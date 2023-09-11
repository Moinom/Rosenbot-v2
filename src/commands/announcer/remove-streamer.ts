import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { deleteStreamer, getSubsriptionIdByStreamerName } from '../../database';
import { removeSubscription } from '../../twitch';

export const data = new SlashCommandBuilder()
  .setName('remove-streamer')
  .setDescription('Remove a streamer from the stream announcer.')
  .addStringOption((option) =>
    option.setName('twitch-name').setDescription("The streamer's Twitch name").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const name: string | null = interaction.options.getString('twitch-name');
  if (name) {
    const subscriptionId = await getSubsriptionIdByStreamerName(name);
    // unsubscribe from twitch events
    if (subscriptionId) {
      const deleteSubSuccess = await removeSubscription(subscriptionId);

      // remove from DB
      if (deleteSubSuccess) {
        const removeSuccess = await deleteStreamer(name);
        if (removeSuccess === 'success') {
          await interaction.reply(`${name} has been removed from the announcer.`);
          return;
        }
        if (removeSuccess === 'notFound') {
          await interaction.reply(`${name} was not part of the announcer to begin with.`);
          return;
        }
      }
    }
  }
  await interaction.reply(`Ooops something went wrong. Ask Lisa about it.`);
}
