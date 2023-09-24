import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getAllStreamerNames } from '../../database/announcer-db';
import { ReplyStatus } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('list-streamers')
  .setDescription('List all registered streamers.')

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const result = await getAllStreamerNames();

  if (Array.isArray(result)) {
    await interaction.reply(selectResponse(ReplyStatus.success, result));
    return;
  }
  await interaction.reply(selectResponse(result));
}

function selectResponse(status: ReplyStatus, streamers?: string[]) {
  switch (status) {
    case ReplyStatus.failed: {
      return 'Getting streamers from database failed.';
    }
    case ReplyStatus.notFound: {
      return 'No streamers are in the database.';
    }
    case ReplyStatus.success: {
      return `**Streamers in database:**\n${streamers?.join('\n')}`;
    }
    default: {
      return 'Something went wrong. Ask Lisa about it.';
    }
  }
}
