import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createPoll, createPollOption, deletePoll } from '../../database/poll-db';
import { ReplyStatus } from '../../utils/discordUtils';

export const data = new SlashCommandBuilder()
  .setName('new-poll')
  .setDescription('Create a new poll.')
  .addStringOption((option) =>
    option.setName('poll-name').setDescription('The poll title.').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('poll-options')
      .setDescription('Poll options (comma separated).')
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName('open-time')
      .setDescription('Time the poll will be open (in hours). Default is 72 hours.')
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  // input params
  const defaultOpenHours = 72;
  const name: string | null = interaction.options.getString('poll-name');
  const openHours: number = interaction.options.getInteger('open-time') || defaultOpenHours;
  const optionsString: string = interaction.options.getString('poll-options') || '';
  const options = optionsString.split(',');
  const userDiscordId = interaction.user.id;
  
  if (!name) {
    await interaction.reply('Error: No poll name provided.');
    return;
  }

  await interaction.reply('Creating poll... this may take a few seconds.');

  // Create new poll
  const newPollResponse = await createPoll(name, openHours, userDiscordId);
  const newPollStatusReply = selectResponse(name, openHours, newPollResponse);

  if (newPollResponse === ReplyStatus.failed) {
    interaction.editReply(newPollStatusReply);
    return;
  }

  // Create poll options
  const pollOptionsResponses: ReplyStatus[] = [];

  for (let option of options) {
    const response = await createPollOption(option.trim(), name);
    pollOptionsResponses.push(response);
  }

  const pollOptionsStatus = evalPollOptionsSuccess(pollOptionsResponses);
  if (pollOptionsStatus === ReplyStatus.failed) {
    await interaction.editReply("Creating poll options failed. Try again or ask Lisa what's up");
    await deletePoll(name);
    return;
  }

  await interaction.editReply(newPollStatusReply);
}

function evalPollOptionsSuccess(pollOptionsResponses: ReplyStatus[]) {
  if (pollOptionsResponses.every((response) => ReplyStatus.success === response)) {
    return ReplyStatus.success;
  } else if (pollOptionsResponses.some((response) => ReplyStatus.failed === response)) {
    return ReplyStatus.failed;
  }
  return ReplyStatus.duplicate;
}

function selectResponse(name: string, openHours: number, status: ReplyStatus) {
  switch (status) {
    case ReplyStatus.failed: {
      return `Creating poll failed.`;
    }
    case ReplyStatus.success: {
      return `Poll "${name}" with open time ${openHours}h has been created.`;
    }
    case ReplyStatus.duplicate: {
      return `Poll with the name "${name}" already exists.`;
    }
    default: {
      return `Something weird happened with "${name}". Oopsie. Ask Lisa about it.`;
    }
  }
}
