import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createPoll, createPollOption } from '../../database/poll-db';
import { ReplyStatus } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('add-poll-options')
  .setDescription('Add options to a poll')
  .addStringOption((option) =>
    option.setName('poll-name').setDescription('The polls title.').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('poll-options')
      .setDescription('Poll options (comma separated).')
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const pollName: string | null = interaction.options.getString('poll-name');
  const optionsString: string = interaction.options.getString('poll-options') || '';

  if (!pollName) {
    await interaction.reply('Error: No poll name provided.');
    return;
  }

  await interaction.reply('Adding options ... please wait.');

  const options = optionsString.split(',');
  const responses: ReplyStatus[] = [];

  for (let option of options) {
    const response = await createPollOption(option.trim(), pollName);
    responses.push(response);
  }

  if (responses.every((response) => ReplyStatus.success === response)) {
    console.log('responses', responses);
    await interaction.editReply('All poll options created.');
    return;
  } else if (responses.some((response) => ReplyStatus.failed === response)) {
    await interaction.editReply(
      'Some options could not be added. You can use the "show-poll" slash command to check what was added.'
    );
    return;
  }
  await interaction.editReply('Done. There have been some duplicate entries which I have ignored.');
}
