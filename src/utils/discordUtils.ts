export enum ReplyStatus {
  notFound = 'notFound',
  success = 'success',
  failed = 'failed',
  duplicate = 'duplicate',
}

export interface PollData {
  name: string;
  openTime: number;
  pollOptions: string[];
  creatorDiscordId: string;
}

export interface PollNamesData {
  name: string;
}

export const pollReacts = [
  '1️⃣',
  '2️⃣',
  '3️⃣',
  '4️⃣',
  '5️⃣',
  '6️⃣',
  '7️⃣',
  '8️⃣',
  '9️⃣',
  '🔟'
];

