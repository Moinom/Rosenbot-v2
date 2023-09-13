import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { ReplyStatus } from './types/discordTypes';

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
      if (error.message.includes('Duplicate')) return ReplyStatus.duplicate;
    });
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
  }
  return result === ReplyStatus.duplicate ? ReplyStatus.duplicate : ReplyStatus.failed;
}

export async function deleteStreamer(name: string) {
  const queryString = `DELETE FROM streamers WHERE name="${name}"`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => console.error(error));
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
    if (header.affectedRows === 0) return ReplyStatus.notFound;
  }
  return ReplyStatus.failed;
}

export async function getSubsriptionIdByStreamerName(name: string) {
  const queryString = `SELECT subscription_id FROM streamers WHERE name="${name}"`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => console.error(error));

  // result[0] is the actual result while result[1] are the fields
  if (result && result[0]) {
    const data = result[0] as RowDataPacket[];

    if (data.length === 0) return ReplyStatus.notFound;

    const subscriptionId: string = data[0]?.subscription_id;
    return subscriptionId;
  }
}

export async function getStreamerIdByStreamerName(name: string) {
  const queryString = `SELECT twitch_id FROM streamers WHERE name="${name}"`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => console.error(error));

  // result[0] is the actual result while result[1] are the fields
  if (result && result[0]) {
    const data = result[0] as RowDataPacket[];

    if (data.length === 0) return ReplyStatus.notFound;

    const streamerId: string = data[0]?.twitch_id;
    return streamerId;
  }
}

export async function updateSubscriptionIdByName(name: string, subscriptionId: string) {
  const queryString = `UPDATE streamers SET subscription_id = "${subscriptionId}" WHERE name = "${name}"`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => {
      console.error(error);
      if (error.message.includes('Duplicate')) return ReplyStatus.duplicate;
    });

  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
  }
  return result === ReplyStatus.duplicate ? ReplyStatus.duplicate : ReplyStatus.failed;
}

export async function getAllStreamerIds() {
  const queryString = `SELECT name, twitch_id FROM streamers`;
  const result = await db_connection
    .promise()
    .query(queryString)
    .catch((error) => console.error(error));
  // result[0] is the actual result while result[1] are the fields
  if (result && result[0]) {
    const data = result[0] as RowDataPacket[];
    if (data.length === 0) return ReplyStatus.notFound;
    return data.map(streamer => [streamer.twitch_id, streamer.name]);
  }
  return ReplyStatus.failed;
}
