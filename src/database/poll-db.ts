import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { PollData, ReplyStatus } from '../types/discordTypes';
import { db_connection } from './database';
import crypto from 'crypto';

export async function createPoll(name: string, openTime: number, userDiscordId: string) {
  const queryString = 'INSERT INTO polls (id, name, open_time, creator_discord_id) VALUES (?, ?, ?, ?);';
  const input = [crypto.randomUUID(), name, openTime, userDiscordId];
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

export async function getAllPolls() {
  const queryString = 'SELECT name FROM polls';
const result = await db_connection
  .promise()
  .execute(queryString)
  .catch((error: Error) => {
    console.error(error);
  });
// result[0] is the actual result while result[1] are the fields
if (result && result[0]) {
  const data = result[0] as RowDataPacket[];
  if (data.length === 0) return ReplyStatus.notFound;
  return data;
}
return ReplyStatus.failed;
}

export async function getPoll(name: string) {
  const queryString =
    'SELECT polls.name, polls.open_time, polls.creator_discord_id, poll_options.poll_option FROM polls INNER JOIN poll_options ON polls.name = poll_options.poll_name AND polls.name = ?';
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
      pollOptions: [],
      creatorDiscordId: data[0].creator_discord_id
    };
    data.forEach((poll) => pollData.pollOptions.push(poll.poll_option));
    return pollData;
  }
  return ReplyStatus.failed;
}

async function deletePollOptions(poll_name: string) {
  const queryString = 'DELETE FROM poll_options WHERE poll_name = ?';

  const result = await db_connection
    .promise()
    .execute(queryString, [poll_name])
    .catch((error) => console.error(error));
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
    if (header.affectedRows === 0) return ReplyStatus.notFound;
  }
  return ReplyStatus.failed;
}

export async function deletePoll(name: string) {
  const pollOptionsDeleteStatus = await deletePollOptions(name);
  if (pollOptionsDeleteStatus === ReplyStatus.failed) {
    return pollOptionsDeleteStatus;
  }

  const queryString = 'DELETE FROM polls WHERE name = ?';

  const result = await db_connection
    .promise()
    .execute(queryString, [name])
    .catch((error) => console.error(error));
  if (result && result[0].constructor.name === 'ResultSetHeader') {
    const header = result[0] as ResultSetHeader;
    if (header.affectedRows > 0) return ReplyStatus.success;
    if (header.affectedRows === 0) return ReplyStatus.notFound;
  }
  return ReplyStatus.failed;
}

export async function verifyDeletePermission(discordId: string, pollName: string, guildOwner?: string) {
  const poll = await getPoll(pollName);
  if (poll !== ReplyStatus.failed && poll !== ReplyStatus.notFound) {
    if (
      poll.creatorDiscordId === discordId ||
      (guildOwner && guildOwner === discordId)
    ) {
      return true;
    }
  }
  return false;
}
