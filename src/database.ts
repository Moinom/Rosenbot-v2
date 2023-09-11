import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const db_connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db_connection.connect();

export async function createStreamer(name: string, streamerId: string, subscriptionId: string) {
  const queryString = `INSERT INTO streamers (id, name, twitch_id, subscription_id) VALUES ("${crypto.randomUUID()}", "${name}", "${streamerId}", "${subscriptionId}")`;
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

export async function getSubsriptionIdByStreamerName(name: string) {
  const queryString = `SELECT subscription_id FROM streamers WHERE name="${name}"`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => console.error(error));
  result && console.log('constructor name', result.constructor.name);

  // result[0] is the actual result while result[1] are the fields
  if (result && result[0]) {
    const data = result[0] as RowDataPacket[];
    const subscriptionId: string = data[0].subscription_id;
    return subscriptionId;
  }
}

export function getStreamerNameById(id: string) {
  const queryString = `SELECT name FROM streamers WHERE twitch_id="${id}"`;
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
  const queryString = `SELECT twitch_id FROM streamers WHERE name="${name}"`;
  db_connection.query(queryString, (error, result) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log('result', result);
    return result;
  });
}
