import mysql, { ResultSetHeader } from 'mysql2';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { requestStreamerId } from './twitch';

dotenv.config();

const db_connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db_connection.connect();

export async function createStreamer(name: string) {
  const streamerId = await requestStreamerId(name);
  if (!streamerId) return 'notFound';

  const queryString = `INSERT INTO streamers (id, name, twitch_id) VALUES ("${crypto.randomUUID()}", "${name}", "${streamerId}")`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error: Error) => {
      console.error(error);
      if (error.message.includes('Duplicate')) return 'duplicate';
    });
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return 'success';
  }
  return result;
}

export async function deleteStreamer(name: string) {
  const queryString = `DELETE FROM streamers WHERE name="${name}"`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => console.error(error));
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return 'success';
    if (header.affectedRows === 0) return 'notFound';
  }
}

export function getStreamerNameById(id: string) {
  const queryString = `SELECT FROM streamers WHERE twitch_id="${id}"`;
  db_connection.query(queryString, (error, result) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log('result', result);
    return result;
  });
}

export function getStreamerIdByName(name: string) {
  const queryString = `SELECT FROM streamers WHERE name="${name}"`;
  db_connection.query(queryString, (error, result) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log('result', result);
    return result;
  });
}
