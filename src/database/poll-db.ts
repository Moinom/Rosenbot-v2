import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PollData, ReplyStatus } from '../types/discordTypes';
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
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
  }
  return result === ReplyStatus.duplicate ? ReplyStatus.duplicate : ReplyStatus.failed;
}

export async function getPoll(name: string) {
  const queryString =
    'SELECT polls.name, polls.open_time, poll_options.poll_option FROM polls INNER JOIN poll_options ON polls.name = poll_options.poll_name AND polls.name = ?';
  const input = [name];
  const result = await db_connection
    .promise()
    .execute(queryString, input)
    .catch((error: Error) => {
      console.error(error);
      if (error.message.includes('Duplicate')) return ReplyStatus.duplicate;
    });
  // result[0] is the actual result while result[1] are the fields
  if (result && result[0]) {
    const data = result[0] as RowDataPacket[];
    if (data.length === 0) return ReplyStatus.notFound;
    const pollData: PollData = {
        name: data[0].name,
        openTime: data[0].open_time,
        pollOptions: []
    }
    data.forEach(poll => pollData.pollOptions.push(poll.poll_option))
    return pollData;
  }
  return ReplyStatus.failed;
}
