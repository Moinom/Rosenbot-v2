import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getAllPolls } from '../../database/poll-db';
import { ReplyStatus } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('list-polls')
  .setDescription('List all polls in the database.')

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const polls = await getAllPolls();

  if (polls == ReplyStatus.notFound || polls == ReplyStatus.failed) {
    await interaction.reply(selectResponse(polls));
    return;
  }

  const message = 'The polls in the database are:\n' + polls.map(poll => `- ${poll.name}`).join('\n')
  await interaction.reply(message);
}

function selectResponse(status: ReplyStatus) {
  switch (status) {
    case ReplyStatus.failed: {
      return `Getting polls from database failed.`;
    }
    case ReplyStatus.notFound: {
      return `No polls found`;
    }
    default: {
      return `Something weird happened. Oopsie. Ask Lisa about it.`;
    }
  }
}
