const express = require('express');
const http = require('http');
const net = require('net');
const mysql = require('mysql2');
const fs = require('fs');
const mqtt = require('mqtt');
const Aedes = require('aedes');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const app = express();

app.use(session({
    secret: "test fraze",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60 * 60 * 1000, //1 h
        secure: false
    }
}))

app.use(express.static(__dirname));

app.use(express.json());

const server = http.createServer(app);

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        ca: fs.readFileSync(__dirname + '/DigiCertGlobalRootG2.crt.pem'),
        rejectUnauthorized: true 
    }
});

app.post('/register', async (req, res) => {
    const { username, password, name, surname, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO SystemUser (username, password, name, surname, email, role) VALUES (?, ?, ?, ?, ?, ?)';
        
        db.query(query, [username, hashedPassword, name, surname, email, 'monitorer'], (err, result) => {
            if (err) { console.error("DB error:", err); return res.status(500).json({ error: "Already exist or DB error" });}
            res.json({ success: true, message: "Success!!!" });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM SystemUser WHERE username = ?';

    db.query(query, [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ error: "User not found" });

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.userId = user.id_User;
            req.session.role = user.role;
            res.json({ success: true, user: { id: user.id_User, username: user.username } });
        } else {
            res.status(401).json({ error: "Password Incorrect!" });
        }
    });
});

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.status(401).json({ error: "Please log in!" });
};

async function startServer() {
    const aedes = await Aedes.Aedes.createBroker();

    aedes.on('clientError', (client, err) => {
        console.log('MQTT Client Error:', client ? client.id : 'unknown', err.message);
    });

    aedes.on('connectionError', (client, err) => {
        console.log('MQTT Connection Error:', client ? client.id : 'unknown', err.message);
    });

    aedes.on('subscribe', (subscriptions, client) => {
        console.log('MQTT Subscription request:', subscriptions.map(s => s.topic), 'from client:', client ? client.id : 'unknown');
    });

    aedes.authorizeSubscribe = (client, sub, callback) => {
    if (sub.topic.startsWith('$SYS')) {
        console.log(`[SECURITY] Blocked sys-topic subscription from: ${client.id}`);
        return callback(new Error('Forbidden: $SYS topics are restricted'), null);
    }
    
    callback(null, sub);
};

    const mqttServer = net.createServer(aedes.handle);
    mqttServer.listen(1883, '0.0.0.0', () => {
        console.log('MQTT: 1883');
    });

    const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883')

    aedes.on('publish', (packet, client) => {
        if (packet.topic.startsWith('$SYS')) return;
    
        console.log(`New message! Topic: ${packet.topic}`);
        const rawPayload = packet.payload.toString();
        console.log(`Payload: ${rawPayload}`);
        const data = JSON.parse(rawPayload);
        const topicParts = packet.topic.split('/');
        const sender = topicParts[0]
        const type = topicParts[1]

        try {
            if (packet.topic.startsWith('$SYS')) return;
            if (sender === 'driver') {

                const serial_number = topicParts[2]

                if (type === 'location') {
                    const query_insert = `
                        INSERT INTO TravelHistoryEvent (lat, lon, timestamp, fk_TrackerDevice)
                        SELECT ?, ?, NOW(), id_TrackerDevice
                        FROM TrackerDevice
                        WHERE serial_number = ?
                    `;

                    db.query(query_insert, [data.lat, data.long, serial_number || 0], (err, result) => {
                        if (err) {
                            console.error("Error logging event to DB:", err.message);
                        } else {
                            console.log("Created new history event (id: " + result.insertId + ")");
                            const query_update = `UPDATE TrackerDevice SET last_updated = NOW(), last_long = ?, last_lat = ? WHERE serial_number = ?`;
                            db.query(query_update, [data.long, data.lat, serial_number])
                        }
                    });
                } else if (type === 'mark_location'){
                    const query_mark = `
                        INSERT INTO MarkedLocation (
                            mark_name, lon, lat, info, mark_type, source_type,
                            fk_TrackerDevice, fk_Userid_User
                        )
                        SELECT ?, ?, ?, ?, ?, 'driver',
                            td.id_TrackerDevice,
                            do.fk_Userid_User
                        FROM TrackerDevice td
                        JOIN DeviceOwner do ON td.fk_DeviceOwnerid_DeviceOwner = do.id_DeviceOwner
                        WHERE td.serial_number = ?
                    `;

                    db.query(query_mark, [data.name, data.lon, data.lat, data.info, data.type, serial_number || 0], (err, result) => {
                        if (err) {
                            console.error("Error logging mark event to DB:", err.message);
                        } else {
                            console.log("Created new marked location (id: " + result.insertId + ")");
                        }
                    });
                    
                } 
            } else {
                // This catches everything else (the bots/scanners)
                console.warn(`[WARN] Unauthorized/Unexpected topic: ${packet.topic} from client: ${client ? client.id : 'unknown'}`);
                // Optional: Close connection for bad actors
                client.close(); 
            }

        } catch (e) {
            console.error("Exception:", e.message);
            console.error("Received:", rawPayload);
        }
    });

    app.get('/fetchmarked/:serial/:lastId/:localCount', (req, res) => {
        const serial = req.params.serial;
        const lastId = parseInt(req.params.lastId);
        const localCount = parseInt(req.params.localCount);

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM MarkedLocation ml
            JOIN TrackerDevice td ON ml.fk_TrackerDevice = td.id_TrackerDevice
            WHERE td.serial_number = ?
        `;

        db.query(countQuery, [serial], (err, countResult) => {
            if (err) return res.status(500).json({ error: err.message });
            const serverCount = countResult[0].total;

            if (serverCount === localCount) {
                return res.json({ sync: true, zones: [] });
            }

            const fetchQuery = `
                SELECT ml.* FROM MarkedLocation ml
                JOIN TrackerDevice td ON ml.fk_TrackerDevice = td.id_TrackerDevice
                WHERE td.serial_number = ? AND ml.id_MarkedLocation > ?
            `;
            
            db.query(fetchQuery, [serial, lastId], (err, zones) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (zones.length + localCount !== serverCount) {
                    const allQuery = `
                        SELECT ml.* FROM MarkedLocation ml
                        JOIN TrackerDevice td ON ml.fk_TrackerDevice = td.id_TrackerDevice
                        WHERE td.serial_number = ?
                    `;
                    db.query(allQuery, [serial], (err, allZones) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ sync: false, fullReset: true, zones: allZones, count: serverCount });
                    });
                } else {
                    res.json({ sync: false, fullReset: false, zones: zones, count: serverCount });
                }
            });
        });
    });

    app.get('/get_history/:serial', isAuthenticated, (req, res) => {
        const { start, end } = req.query;
        
        // 1. Convert the incoming local date strings (e.g., '2026-05-24 12:00') 
        // to UTC date objects
        const startDate = new Date(start.replace(' ', 'T'));
        const endDate = new Date(end.replace(' ', 'T'));

        // 2. Convert to ISO format (UTC string) for the SQL query
        const startUTC = startDate.toISOString().replace('T', ' ').slice(0, 19);
        const endUTC = endDate.toISOString().replace('T', ' ').slice(0, 19);

        // Now query the DB using the normalized UTC strings
        const query = `
            SELECT lat, lon 
            FROM TravelHistoryEvent 
            WHERE fk_TrackerDevice = (SELECT id_TrackerDevice FROM TrackerDevice WHERE serial_number = ?)
            AND timestamp BETWEEN ? AND ?
        `;

        db.query(query, [req.params.serial, startUTC, endUTC], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ coordinates: results.map(r => [r.lon, r.lat]) });
        });
    });
    
    app.get('/my-drivers', isAuthenticated, (req, res) => {
        const query = `
            SELECT td.serial_number, td.name as car_model
            FROM TrackerDevice td
            JOIN DeviceOwner do ON td.fk_DeviceOwnerid_DeviceOwner = do.id_DeviceOwner
            WHERE do.fk_Userid_User = ?
        `;

        db.query(query, [req.session.userId], (err, results) => {
            if (err) {
                console.error("DB error fetching drivers:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ drivers: results });
        });
    });
    
    app.post('/mark', isAuthenticated, (req, res) => {
        const data = req.body;
        const query = `
            INSERT INTO MarkedLocation (
                mark_name, lon, lat, info, mark_type,
                source_type, fk_Userid_User
            )
            VALUES (?, ?, ?, ?, ?, 'monitorer', ?)
        `;
    
        db.query(query, [data.name, data.long, data.lat, data.info, data.type, req.session.userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            const markPayload = JSON.stringify({ name: data.name,
                                                    lon: data.long,
                                                    lat: data.lat,
                                                    info: data.info,
                                                    type: data.type });

            mqttClient.publish('monitorer/1/marked', markPayload);
            res.json({ success: true, id: result.insertId });

        });
    });

    app.post('/add-device', (req, res) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Unauthorized. Please log in." });
        }

        const { owner, device } = req.body;
        const userId = req.session.userId;

        db.getConnection((err, connection) => {
            if (err) return res.status(500).json({ error: "Database error" });

            connection.beginTransaction((err) => {
                if (err) { connection.release(); return res.status(500).json({ error: "Transaction start failed" }); }

                const ownerSql = "INSERT INTO deviceowner (name, surname, phone_number, fk_Userid_User) VALUES (?, ?, ?, ?)";
                connection.query(ownerSql, [owner.name, owner.surname, owner.phone_number, userId], (err, ownerResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ error: "Failed to add owner" });
                        });
                    }

                    const ownerId = ownerResult.insertId;
                    const deviceSql = "INSERT INTO trackerdevice (name, serial_number, fk_DeviceOwnerid_DeviceOwner) VALUES (?, ?, ?)";
                    connection.query(deviceSql, [device.name, device.serial_number, ownerId], (err, deviceResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ error: "Failed to add device (Serial number might already exist)" });
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(500).json({ error: "Commit failed" });
                                });
                            }
                            connection.release();
                            res.json({ success: true, ownerId, deviceId: deviceResult.insertId });
                        });
                    });
                });
            });
        });
    });

    app.get('/get_history/:serial', (req, res) => {
        const { serial } = req.params;
        const { start, end } = req.query;

        let query = `
            SELECT the.lon, the.lat 
            FROM travelhistoryevent the
            JOIN trackerdevice td ON the.fk_TrackerDevice = td.id_TrackerDevice
            WHERE td.serial_number = ?
        `;
        const params = [serial];

        if (start && end) {
            query += ` AND the.timestamp BETWEEN ? AND ?`;
            params.push(start, end);
        }

        query += ` ORDER BY the.timestamp ASC`;

        db.query(query, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            const coords = results.map(row => [row.lon, row.lat]);
            res.json({ type: 'LineString', coordinates: coords });
        });
    });

    app.post('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) return res.status(500).json({ error: "Disconnecting failed" });
            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    });
        
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`HTTP: ${PORT}`);
    });
}

startServer().catch(err => console.error("Error starting node.js server:", err));
