import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

export const db_connection = mysql.createConnection({
  host: process.env.AZURE_MYSQL_HOST,
  user: process.env.AZURE_MYSQL_USER,
  password: process.env.AZURE_MYSQL_PASSWORD,
  database: process.env.AZURE_MYSQL_DATABASE,
});

db_connection.connect();