import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createStreamer } from '../../database';
import {
  createSubscription,
  getSubscriptions,
  isSubscriptionValid,
  requestStreamerInfo,
} from '../../twitch';
import { ReplyStatus } from '../../types/discordTypes';

export const data = new SlashCommandBuilder()
  .setName('add-streamer')
  .setDescription('Add a streamer to the stream announcer.')
  .addStringOption((option) =>
    option.setName('twitch-name').setDescription("The streamer's Twitch name").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const name: string | null = interaction.options.getString('twitch-name');

  // There is a 3 second time limit to reply
  await interaction.reply('Adding streamer ... this may take a few seconds.');

  if (name) {
    // Get ID associated with Twitch name
    const streamerInfo = await requestStreamerInfo(name);
    if (!streamerInfo?.id) {
      await interaction.editReply(selectResponse(name, ReplyStatus.notFound));
      return;
    }
    // Check if subsription for this user already exists
    const subscriptions = await getSubscriptions(`user_id=${streamerInfo.id}`);
    let subscriptionId = '';
    const userSub = subscriptions?.data;

    if (userSub && userSub.length && isSubscriptionValid(userSub[0])) {
      subscriptionId = subscriptions.data[0].id;
    } else {
      // Subscribe to Twitch channel activity if no valid subscription yet
      subscriptionId = await createSubscription(streamerInfo.id);
    }

    if (!subscriptionId) {
      await interaction.editReply(selectResponse(name, ReplyStatus.failed));
      return;
    }

    // Add streamer to database
    const createResponse = await createStreamer(
      streamerInfo.display_name,
      streamerInfo.id,
      subscriptionId
    );
    await interaction.editReply(selectResponse(name, createResponse));
    return;
  }
  await interaction.editReply(`Ooops something went wrong. Ask Lisa about it.`);
}

function selectResponse(name: string, status: ReplyStatus) {
  switch (status) {
    case ReplyStatus.failed: {
      return `Creating Twitch streaming event subscription for ${name} failed.`;
    }
    case ReplyStatus.notFound: {
      return `${name} was not found on Twitch.`;
    }
    case ReplyStatus.success: {
      return `${name} was successfully added to the stream announcer.`;
    }
    case ReplyStatus.duplicate: {
      return `${name} is already part of the announcer.`;
    }
    default: {
      return `${name} could not be added. Oopsie. Ask Lisa about it.`;
    }
  }
}
