import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createStreamer } from '../../database';
import { createSubscription, getSubscriptions, requestStreamerId } from '../../twitch';

const TWITCH_CALLBACK_URL = process.env.TWITCH_CALLBACK_URL || '';
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
    // Get ID associated with Twitch name
    const streamerId = await requestStreamerId(name);
    if (!streamerId) {
      await interaction.reply(`${name} was not found on Twitch.`);
      return;
    }
    // Check if subsription for this user already exists
    const subscriptions = await getSubscriptions(`user_id=${streamerId}`);
    let subscriptionId = '';
    const userSub = subscriptions.data;

    if (
      userSub.length > 0 &&
      userSub[0].type === 'stream.online' &&
      userSub[0].status === 'enabled' &&
      userSub[0].transport.callback === TWITCH_CALLBACK_URL
    ) {
      subscriptionId = subscriptions.data[0].id;
    } else {
      // Subscribe to Twitch channel activity if no subscription yet
      subscriptionId = await createSubscription(streamerId);
    }

    if (!subscriptionId) {
      await interaction.reply(`Subscribing to Twitch channel ${name} failed.`);
      return;
    }

    // Add streamer to database
    const createResponse = await createStreamer(name, streamerId, subscriptionId);
    switch (createResponse) {
      case 'success': {
        await interaction.reply(`${name} has been added to the announcer.`);
        return;
      }
      case 'duplicate': {
        await interaction.reply(`${name} is already part of the announcer.`);
        return;
      }
    }
  }
  await interaction.reply(`Ooops something went wrong. Ask Lisa about it.`);
}
