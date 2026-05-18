-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: bakalauras.mysql.database.azure.com    Database: drivers_monitor_db
-- ------------------------------------------------------
-- Server version	8.0.44-azure

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `deviceowner`
--

DROP TABLE IF EXISTS `deviceowner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deviceowner` (
  `id_DeviceOwner` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `surname` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `fk_Userid_User` int NOT NULL,
  PRIMARY KEY (`id_DeviceOwner`),
  KEY `fk_Userid_User` (`fk_Userid_User`),
  CONSTRAINT `deviceowner_ibfk_1` FOREIGN KEY (`fk_Userid_User`) REFERENCES `systemuser` (`id_User`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deviceowner`
--

LOCK TABLES `deviceowner` WRITE;
/*!40000 ALTER TABLE `deviceowner` DISABLE KEYS */;
INSERT INTO `deviceowner` VALUES (1,'Vairuotojas','Vairuotavicius','+37060000000',1);
/*!40000 ALTER TABLE `deviceowner` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `markedlocation`
--

DROP TABLE IF EXISTS `markedlocation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `markedlocation` (
  `id_MarkedLocation` int NOT NULL AUTO_INCREMENT,
  `mark_name` varchar(255) DEFAULT NULL,
  `lon` float DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `info` varchar(255) DEFAULT NULL,
  `mark_type` enum('gas','pharmacy','market','street','hotel','markedDangerous','markedImportant','markedEmergency','unclassified') DEFAULT 'unclassified',
  `source_type` enum('driver','monitorer') NOT NULL,
  `fk_Userid_User` int DEFAULT NULL,
  `fk_TrackerDevice` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_MarkedLocation`),
  KEY `fk_Userid_User` (`fk_Userid_User`),
  KEY `fk_TrackerDevice` (`fk_TrackerDevice`),
  CONSTRAINT `markedlocation_ibfk_1` FOREIGN KEY (`fk_Userid_User`) REFERENCES `systemuser` (`id_User`),
  CONSTRAINT `markedlocation_ibfk_2` FOREIGN KEY (`fk_TrackerDevice`) REFERENCES `trackerdevice` (`id_TrackerDevice`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `markedlocation`
--

LOCK TABLES `markedlocation` WRITE;
/*!40000 ALTER TABLE `markedlocation` DISABLE KEYS */;
INSERT INTO `markedlocation` VALUES (1,'vieta? ',23.8874,54.8974,'vieta! ','unclassified','driver',1,1,'2026-05-04 16:52:43'),(2,'vieta is zmogaus',23.901,54.9039,'vieta','markedImportant','monitorer',1,NULL,'2026-05-08 13:38:09'),(3,'vieta2',23.8799,54.8982,'vietos aprasymas','unclassified','monitorer',1,NULL,'2026-05-08 13:54:52'),(4,'a',23.9124,54.9071,'v','unclassified','monitorer',1,NULL,'2026-05-08 13:55:08'),(5,'3',23.9284,54.9044,'ab','unclassified','monitorer',1,NULL,'2026-05-08 13:57:01'),(6,'name',23.9542,54.9054,'vieta','markedImportant','monitorer',1,NULL,'2026-05-08 13:57:37'),(7,'No name entered',23.9243,54.9084,'No info entered','unclassified','monitorer',1,NULL,'2026-05-08 13:58:01'),(8,'No name entered',23.906,54.9044,'No info entered','unclassified','monitorer',1,NULL,'2026-05-08 14:02:22'),(9,'No name entered',23.9074,54.9086,'No info entered',NULL,'monitorer',1,NULL,'2026-05-08 14:03:37'),(10,'No name entered',23.8939,54.9008,'No info entered','unclassified','monitorer',1,NULL,'2026-05-08 14:04:10'),(11,'No name entered',23.9097,54.9074,'No info entered','unclassified','monitorer',1,NULL,'2026-05-08 14:05:16'),(12,'is vairuotojo! ',23.8774,54.9281,'vairuotojo info','unclassified','driver',1,1,'2026-05-08 15:46:34'),(13,'pav',23.9169,54.9075,'pav','unclassified','driver',1,1,'2026-05-08 15:55:32'),(14,'yy',23.9011,54.9029,'yy','unclassified','driver',1,1,'2026-05-08 15:58:13'),(15,'Vilijampoles vieta',23.8839,54.9052,'sita vieta grazi','unclassified','driver',1,1,'2026-05-16 18:21:17'),(16,'Vilijampoles vieta',23.8839,54.9052,'sita vieta grazi','unclassified','driver',1,1,'2026-05-16 18:21:28'),(17,'Vilijampoles vieta',23.8839,54.9052,'sita vieta grazi','unclassified','driver',1,1,'2026-05-16 18:21:39'),(18,'Vilijampoles vieta',23.8839,54.9052,'sita vieta grazi','unclassified','driver',1,1,'2026-05-16 18:21:50'),(19,'vieta prie tilto',23.9036,54.907,'tilto vieta','unclassified','driver',1,1,'2026-05-16 18:45:34'),(20,'biruliskes',23.9705,54.9306,'birbir','unclassified','driver',1,1,'2026-05-16 19:29:51'),(21,'vietele',23.9209,54.9099,'vietuze','unclassified','driver',1,1,'2026-05-16 20:03:03');
/*!40000 ALTER TABLE `markedlocation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemuser`
--

DROP TABLE IF EXISTS `systemuser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemuser` (
  `id_User` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `surname` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','monitorer') DEFAULT 'monitorer',
  PRIMARY KEY (`id_User`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemuser`
--

LOCK TABLES `systemuser` WRITE;
/*!40000 ALTER TABLE `systemuser` DISABLE KEYS */;
INSERT INTO `systemuser` VALUES (1,'jusvar','$2b$10$a4YV9MLxVtnUrpkHuxsucu25POJ6PU6aswrXPxDr/.METc8itduQm','Justina','Varoneckaite','jv@gmail.com','monitorer');
/*!40000 ALTER TABLE `systemuser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trackerdevice`
--

DROP TABLE IF EXISTS `trackerdevice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trackerdevice` (
  `id_TrackerDevice` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_updated` datetime DEFAULT NULL,
  `last_long` float DEFAULT NULL,
  `last_lat` float DEFAULT NULL,
  `fk_DeviceOwnerid_DeviceOwner` int NOT NULL,
  PRIMARY KEY (`id_TrackerDevice`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `fk_DeviceOwnerid_DeviceOwner` (`fk_DeviceOwnerid_DeviceOwner`),
  CONSTRAINT `trackerdevice_ibfk_1` FOREIGN KEY (`fk_DeviceOwnerid_DeviceOwner`) REFERENCES `deviceowner` (`id_DeviceOwner`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trackerdevice`
--

LOCK TABLES `trackerdevice` WRITE;
/*!40000 ALTER TABLE `trackerdevice` DISABLE KEYS */;
INSERT INTO `trackerdevice` VALUES (1,'Mano Raspberry Pi','RPi-Bakalauras-2026',1,'2026-05-16 20:02:38',23.9036,54.8985,1);
/*!40000 ALTER TABLE `trackerdevice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `travelhistoryevent`
--

DROP TABLE IF EXISTS `travelhistoryevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `travelhistoryevent` (
  `id_TravelHistoryEvent` int NOT NULL AUTO_INCREMENT,
  `lon` float DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `fk_TrackerDevice` int NOT NULL,
  PRIMARY KEY (`id_TravelHistoryEvent`),
  KEY `fk_TrackerDevice` (`fk_TrackerDevice`),
  CONSTRAINT `travelhistoryevent_ibfk_1` FOREIGN KEY (`fk_TrackerDevice`) REFERENCES `trackerdevice` (`id_TrackerDevice`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `travelhistoryevent`
--

LOCK TABLES `travelhistoryevent` WRITE;
/*!40000 ALTER TABLE `travelhistoryevent` DISABLE KEYS */;
INSERT INTO `travelhistoryevent` VALUES (1,23.9764,54.9259,'2026-05-03 18:02:11',1),(2,23.9036,54.8985,'2026-05-03 18:03:12',1),(3,23.9036,54.8985,'2026-05-03 18:10:39',1),(4,23.9036,54.8985,'2026-05-03 18:12:40',1),(5,23.9036,54.8985,'2026-05-04 16:50:01',1),(6,23.9036,54.8985,'2026-05-04 16:52:05',1),(7,23.9036,54.8985,'2026-05-04 16:53:06',1),(8,23.9036,54.8985,'2026-05-04 16:54:06',1),(9,23.977,54.9259,'2026-05-04 17:00:29',1),(10,23.9768,54.9259,'2026-05-04 17:14:20',1),(11,23.9767,54.9259,'2026-05-04 17:17:20',1),(12,23.9036,54.8985,'2026-05-07 14:16:37',1),(13,23.9036,54.8985,'2026-05-07 14:17:37',1),(14,23.9036,54.8985,'2026-05-07 14:18:37',1),(15,0,0,'2026-05-08 10:34:02',1),(16,0,0,'2026-05-08 10:42:44',1),(17,0,0,'2026-05-08 10:45:28',1),(18,23.9036,54.8985,'2026-05-08 10:48:16',1),(19,23.9036,54.8985,'2026-05-08 10:49:16',1),(20,23.9036,54.8985,'2026-05-08 13:36:23',1),(21,23.9036,54.8985,'2026-05-08 13:37:33',1),(22,23.9036,54.8985,'2026-05-08 13:43:30',1),(23,23.9036,54.8985,'2026-05-08 13:47:29',1),(24,23.9036,54.8985,'2026-05-08 13:54:08',1),(25,23.9036,54.8985,'2026-05-08 13:55:08',1),(26,23.9036,54.8985,'2026-05-08 13:57:00',1),(27,23.9036,54.8985,'2026-05-08 13:58:01',1),(28,23.9036,54.8985,'2026-05-08 14:00:23',1),(29,23.9036,54.8985,'2026-05-08 14:01:23',1),(30,23.9036,54.8985,'2026-05-08 14:02:23',1),(31,23.9036,54.8985,'2026-05-08 14:03:16',1),(32,23.9036,54.8985,'2026-05-08 14:04:16',1),(33,23.9036,54.8985,'2026-05-08 14:05:16',1),(34,23.9036,54.8985,'2026-05-08 15:45:53',1),(35,23.9036,54.8985,'2026-05-08 15:55:02',1),(36,23.9782,54.9259,'2026-05-08 15:56:02',1),(37,23.9778,54.9258,'2026-05-08 15:57:02',1),(38,23.9036,54.8985,'2026-05-08 15:58:02',1),(39,23.9036,54.8985,'2026-05-16 18:18:02',1),(40,23.9036,54.8985,'2026-05-16 18:20:05',1),(41,23.9036,54.8985,'2026-05-16 18:21:06',1),(42,23.9036,54.8985,'2026-05-16 18:45:05',1),(43,23.9036,54.8985,'2026-05-16 18:46:06',1),(44,23.9036,54.8985,'2026-05-16 18:47:05',1),(45,23.9036,54.8985,'2026-05-16 18:48:05',1),(46,23.9036,54.8985,'2026-05-16 19:16:25',1),(47,23.9036,54.8985,'2026-05-16 19:17:26',1),(48,23.9036,54.8985,'2026-05-16 19:18:26',1),(49,23.9036,54.8985,'2026-05-16 19:19:26',1),(50,23.9036,54.8985,'2026-05-16 19:21:03',1),(51,23.9036,54.8985,'2026-05-16 19:22:03',1),(52,23.9036,54.8985,'2026-05-16 19:23:03',1),(53,23.9036,54.8985,'2026-05-16 19:24:03',1),(54,23.9036,54.8985,'2026-05-16 19:25:03',1),(55,23.9036,54.8985,'2026-05-16 19:26:03',1),(56,23.9036,54.8985,'2026-05-16 19:27:03',1),(57,23.9036,54.8985,'2026-05-16 19:28:41',1),(58,23.9036,54.8985,'2026-05-16 19:29:41',1),(59,23.9036,54.8985,'2026-05-16 19:30:41',1),(60,23.9036,54.8985,'2026-05-16 19:31:41',1),(61,23.9036,54.8985,'2026-05-16 19:32:41',1),(62,23.9036,54.8985,'2026-05-16 19:33:41',1),(63,23.9036,54.8985,'2026-05-16 19:34:42',1),(64,23.9036,54.8985,'2026-05-16 19:35:42',1),(65,23.9036,54.8985,'2026-05-16 19:36:42',1),(66,23.9036,54.8985,'2026-05-16 19:37:42',1),(67,23.9036,54.8985,'2026-05-16 19:38:42',1),(68,23.9036,54.8985,'2026-05-16 19:39:42',1),(69,23.9036,54.8985,'2026-05-16 19:40:42',1),(70,23.9036,54.8985,'2026-05-16 19:41:42',1),(71,23.9036,54.8985,'2026-05-16 19:42:42',1),(72,23.9036,54.8985,'2026-05-16 19:43:42',1),(73,23.9036,54.8985,'2026-05-16 19:44:28',1),(74,23.9036,54.8985,'2026-05-16 19:45:28',1),(75,23.9036,54.8985,'2026-05-16 19:52:30',1),(76,23.9036,54.8985,'2026-05-16 19:53:30',1),(77,23.9036,54.8985,'2026-05-16 19:54:30',1),(78,23.9036,54.8985,'2026-05-16 19:55:30',1),(79,23.9036,54.8985,'2026-05-16 19:56:30',1),(80,23.9036,54.8985,'2026-05-16 19:58:09',1),(81,23.9036,54.8985,'2026-05-16 19:59:09',1),(82,23.9036,54.8985,'2026-05-16 20:00:09',1),(83,23.9036,54.8985,'2026-05-16 20:02:38',1);
/*!40000 ALTER TABLE `travelhistoryevent` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-18 15:18:07
