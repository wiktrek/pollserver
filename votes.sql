SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";




CREATE DATABASE votesdb;

CREATE USER 'user'@'localhost' IDENTIFIED BY 'password';

GRANT SELECT, INSERT, DELETE, UPDATE ON votesdb.* TO 'user'@'localhost';

USE votesdb;

CREATE TABLE `vote` (
  `poll` varchar(128) NOT NULL,
  `voter` varchar(128) NOT NULL,
  `vote` int(4) NOT NULL,
  `date` date NOT NULL DEFAULT CURDATE(),
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
);