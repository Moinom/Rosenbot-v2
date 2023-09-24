import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createPoll } from '../../database/poll-db';
import { ReplyStatus } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('new-poll')
  .setDescription('Create a new poll.')
  .addStringOption((option) =>
    option.setName('poll-name').setDescription('The polls title.').setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('open-time').setDescription('Time the poll will be open (in hours).').setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const defaultOpenHours = 72;
  const name: string | null = interaction.options.getString('poll-name');
  const openHours: number = interaction.options.getInteger('open-time') || defaultOpenHours;

  if (!name) {
    await interaction.reply('Error: No poll name provided.');
    return;
  }
  const response = await createPoll(name, openHours);
  
  await interaction.reply(selectResponse(name, openHours, response));
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
