import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createStreamer } from '../../database';

export const data = new SlashCommandBuilder()
  .setName('add-streamer')
  .setDescription('Add a streamer to the stream announcer.')
  .addStringOption((option) =>
    option.setName('twitch-name').setDescription("The streamer's Twitch name").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const name: string | null = interaction.options.getString('twitch-name');
  if (name) {
    const createSuccess = await createStreamer(name);
    if (createSuccess) {
      await interaction.reply(`${name} has been added to the announcer.`);
      return;
    }
  }
  await interaction.reply(`Ooops something went wrong. Double check the Twitch name and if that doesn't help ask Lisa about it.`);
}
