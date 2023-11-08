import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { deletePoll, verifyDeletePermission } from '../../database/poll-db';
import { ReplyStatus } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('delete-poll')
  .setDescription('Remove a poll from the database.')
  .addStringOption((option) =>
    option.setName('poll-name').setDescription('The poll title.').setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const name: string | null = interaction.options.getString('poll-name');
  const userDiscordId = interaction.user.id;
  const guildOwner = interaction.guild?.ownerId;

  await interaction.reply('Deletion started...');

  if (!name) {
    await interaction.editReply('Error: No poll name provided.');
    return;
  }

  const hasPermission = await verifyDeletePermission(userDiscordId, name, guildOwner);

  if (!hasPermission) {
    await interaction.editReply(
      "You don't have permission to delete this poll. Only the poll creator or the server owner can delete a poll."
    );
    return;
  }

  const poll = await deletePoll(name);
  await interaction.editReply(selectResponse(name, poll));
  return;
}

function selectResponse(name: string, status: ReplyStatus) {
  switch (status) {
    case ReplyStatus.success: {
      return `Deleted poll "${name}"`;
    }
    case ReplyStatus.failed: {
      return `Deleting poll "${name}" from database has failed.`;
    }
    case ReplyStatus.notFound: {
      return `Poll with the name "${name}" wasn't found.`;
    }
    default: {
      return `Something weird happened with "${name}". Oopsie. Ask Lisa about it.`;
    }
  }
}
