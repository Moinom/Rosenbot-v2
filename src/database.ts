import mysql from 'mysql2';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const db_connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db_connection.connect();

export function createNewStreamer(name: string) {
    // TODO: get twitch id
    const queryString = `INSERT INTO streamers (id, name, twitch_id) VALUES ("${crypto.randomUUID()}", "${name}", "12345")`
    db_connection.query(queryString, (error) => {
        error && console.error(error);
    })
}
