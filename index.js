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
            }
        } catch (e) {
            console.error("Exception:", e.message);
            console.error("Received:", rawPayload);
        }
    });

    app.get('/fetchmarked/:lastId/:localCount', (req, res) => {
        const lastId = parseInt(req.params.lastId);
        const localCount = parseInt(req.params.localCount);
        const countQuery = 'SELECT COUNT(*) as total FROM MarkedLocation';
        db.query(countQuery, (err, countResult) => {
            if (err) return res.status(500).json({ error: err.message });
            const serverCount = countResult[0].total;
            if (serverCount === localCount) {
                return res.json({ sync: true, zones: [] });
            }

            const fetchQuery = 'SELECT * FROM MarkedLocation WHERE id_MarkedLocation > ?';
            db.query(fetchQuery, [lastId], (err, zones) => {
                if (err) return res.status(500).json({ error: err.message });
                if (zones.length + localCount !== serverCount) {
                    const allQuery = 'SELECT * FROM MarkedLocation';
                    db.query(allQuery, (err, allZones) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ sync: false, fullReset: true, zones: allZones, count: serverCount });
                    });
                } else {
                    res.json({ sync: false, fullReset: false, zones: zones, count: serverCount });
                }
            });
        });
    });

    app.get('/driver-location/:serial', isAuthenticated, (req, res) => {
        const serial = req.params.serial;
        const query = `
            SELECT td.last_lat, td.last_long, td.last_updated, td.name
            FROM TrackerDevice td
            JOIN DeviceOwner do ON td.fk_DeviceOwnerid_DeviceOwner = do.id_DeviceOwner
            WHERE td.serial_number = ? AND do.fk_Userid_User = ?
        `;

        db.query(query, [serial, req.session.userId], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(404).json({ error: "Driver not found or access denied" });
            
            res.json({
                success: true,
                lat: results[0].last_lat,
                long: results[0].last_long,
                time: results[0].last_updated,
                name: results[0].name
            });
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

            mqttClient.publish('monitorer/1/marked', markPayload); // i will hardcode monitorer id for the prototype
            res.json({ success: true, id: result.insertId });

            // db.query('SELECT COUNT(*) as total FROM MarkedLocation', (err, countResult) => {
            //     if (!err) {
            //         const total = countResult[0].total;
            //         //const syncPayload = JSON.stringify({ count: total, last_id: result.insertId });
                    
            //         //mqttClient.publish('monitorer/marked/sync', syncPayload); cia jei kazkada daryciau sync logika
            //     }
            //     res.json({ success: true, id: result.insertId });
            // });
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
