import { CommandInteraction, SlashCommandBuilder, Embed } from 'discord.js';
import { getPoll } from '../../database/poll-db';
import { ReplyStatus, pollReacts } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('start-poll')
  .setDescription('Start a created poll.')
  .addStringOption((option) =>
    option.setName('poll-name').setDescription('The poll title.').setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const name: string | null = interaction.options.getString('poll-name');

  if (!name) {
    await interaction.reply('Error: No poll name provided.');
    return;
  }
  const poll = await getPoll(name);

  if (poll === ReplyStatus.failed || poll === ReplyStatus.notFound) {
    await interaction.reply(selectResponse(name, poll));
    return;
  }

  // Send poll embed
  const message = await interaction.reply({
    content: 'A new poll started! Vote on this pole:',
    fetchReply: true,
    embeds: [
      {
        color: 3447003,
        author: {
          name: interaction.user.username,
          icon_url: interaction.user.avatarURL() || undefined,
        },
        title: name,
        description: poll.pollOptions
          .map((option, index) => `${pollReacts[index]} ${option}`)
          .join('\n'),
      },
    ],
  });

  // React with available remojis
  try {
    for (let i = 0; i < poll.pollOptions.length; i++) {
      await message.react(pollReacts[i]);
    }
  } catch (error) {
    console.error('One of the emojis failed to react:', error);
  }
}

function selectResponse(name: string, status: ReplyStatus) {
  switch (status) {
    case ReplyStatus.failed: {
      return `Getting poll from database failed.`;
    }
    case ReplyStatus.notFound: {
      return `Poll with the name "${name}" wasn't found.`;
    }
    default: {
      return `Something weird happened with "${name}". Oopsie. Ask Lisa about it.`;
    }
  }
}
