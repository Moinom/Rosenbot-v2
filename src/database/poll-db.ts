import { ResultSetHeader } from 'mysql2';
import { ReplyStatus } from '../types/discordTypes';
import { db_connection } from './database';
import crypto from 'crypto';

export async function createPoll(name: string, openTime: number) {
  const queryString = 'INSERT INTO polls (id, name, open_time) VALUES (?, ?, ?);';
  const input = [crypto.randomUUID(), name, openTime];
  const result = await db_connection
    .promise()
    .execute(queryString, input)
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

export async function createPollOption(name: string, pollName: string) {
  const queryString = 'INSERT INTO poll_options (poll_option, poll_name) VALUES (?, ?);';
  const input = [name, pollName];
  const result = await db_connection
    .promise()
    .execute(queryString, input)
    .catch((error: Error) => {
      console.error(error);
      if (error.message.includes('Duplicate')) return ReplyStatus.duplicate;
    });
  console.log('result', result);
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
  }
  return result === ReplyStatus.duplicate ? ReplyStatus.duplicate : ReplyStatus.failed;
}
