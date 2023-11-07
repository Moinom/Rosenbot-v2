import { CommandInteraction, SlashCommandBuilder, MessageReaction } from 'discord.js';
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
  const validReacts = pollReacts.slice(0, poll.pollOptions.length);
  const message = await interaction.reply({
    content: 'A new poll started! Vote on this poll:',
    fetchReply: true,
    embeds: [
      {
        color: 3447003,
        author: {
          name: interaction.user.username,
          icon_url: interaction.user.avatarURL() || undefined,
        },
        title: name,
        description: `This poll will be open for ${
          poll.openTime
        } hours. Make sure to vote in time!\n\n${poll.pollOptions
          .map((option, index) => `${validReacts[index]} ${option}`)
          .join('\n')}`,
      },
    ],
  });

  // Collect reactions
  const timeInMilliseconds = 5000//poll.openTime * 60 * 60 * 1000;

  const collectorFilter = (reaction: MessageReaction) => {
    const emoji = reaction.emoji.name || '';
    return validReacts.includes(emoji);
  };

  const collector = message.createReactionCollector({
    filter: collectorFilter,
    time: timeInMilliseconds,
  });

  collector.on('end', (collected) => {
    // announce result
    const totalVoteAmount = collected.reduce((a, b) => a + (b.count - 1), 0);

    message.reply({
      content: `This poll ended. See the results:`,
      embeds: [
        {
          color: 3447003,
          title: name,
          description: `Total number of votes cast: ${totalVoteAmount}\n\n${poll.pollOptions
            .map((option, index) => {
              let emoji = validReacts[index];
              let react = collected.get(emoji);
              let count = react ? react.count - 1 : 0;
              return `${emoji} ${option}:\t\t${count} ${count === 1 ? 'vote' : 'votes'} ⇒ ${
                totalVoteAmount > 0 ? Math.round((count / totalVoteAmount) * 100) : 0
              }%`;
            })
            .join('\n')}`,
        },
      ],
    });
  });

  //React with available remojis
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
