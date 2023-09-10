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
    const createResponse = await createStreamer(name);
    switch (createResponse) {
      case 'success': {
        await interaction.reply(`${name} has been added to the announcer.`);
        return;
      }
      case 'duplicate': {
        await interaction.reply(`${name} is already part of the announcer.`);
        return;
      }
      case 'notFound': {
        await interaction.reply(`${name} was not found on Twitch.`);
        return;
      }
    }
  }
  await interaction.reply(`Ooops something went wrong. Ask Lisa about it.`);
}
