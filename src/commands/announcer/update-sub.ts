import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { createSubscription, getSubscriptions, isSubscriptionValid, removeSubscription } from '../../twitch';
import { ReplyStatus } from '../../utils/discordUtils';
import {
  getAllStreamerIds,
  getStreamerIdByStreamerName,
  updateSubscriptionIdByName,
} from '../../database/announcer-db';

export const data = new SlashCommandBuilder()
  .setName('update-sub')
  .setDescription('Update one or all streamer event subscriptions.')
  .addStringOption((option) =>
    option
      .setName('twitch-name')
      .setDescription("The streamer's Twitch name or 'all'")
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  const input: string | null = interaction.options.getString('twitch-name');

  // There is a 3 second time limit to reply
  await interaction.reply('Updating twitch event subscription ... this may take a few seconds.');

  // validate and update all streamer event subs
  if (input === 'all') {
    const allStreamers = await getAllStreamerIds();
    if (Array.isArray(allStreamers)) {
      allStreamers.forEach(async (streamer) => {
        const updateSuccess = await updateSub(streamer[1], streamer[0]);
        interaction.followUp(updateSuccess);
      });
      return;
    }
    await interaction.reply(allStreamers);
    return;
  }

  // validate and update a single streamer event sub
  if (input) {
    const streamerId = await getStreamerIdByStreamerName(input);
    if (!streamerId) {
      return selectResponse(input, ReplyStatus.notFound);
    }
    const updateSuccess = await updateSub(input, streamerId);
    await interaction.editReply(updateSuccess);
    return;
  }
  await interaction.editReply(`Ooops something went wrong. Ask Lisa about it.`);
}

async function updateSub(name: string, streamerId: string) {
  // Check if subsription for this user already exists and is valid
  const subscriptions = await getSubscriptions(`user_id=${streamerId}`);
  const userSub = subscriptions?.data;
  
  if (userSub && userSub.length > 0) {
    const subValid =  isSubscriptionValid(userSub[0])
    if (subValid) return selectResponse(name, ReplyStatus.duplicate);
    if (!subValid) {
        // Remove invalid sub
        await removeSubscription(userSub[0].id)
    }
}
  // Subscribe to Twitch channel activity if subscription not valid or existing
  const subscriptionId = await createSubscription(streamerId);
  // update subscription ID in DB
  const subscriptionUpdateSuccess = await updateSubscriptionIdByName(name, subscriptionId);
  return selectResponse(name, subscriptionUpdateSuccess);
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
      return `${name}'s Twitch event subscription has been updated.`;
    }
    case ReplyStatus.duplicate: {
      return `${name}'s Twitch event subscription is still valid.`;
    }
    default: {
      return `Something happened to ${name}. Oopsie. Ask Lisa about it.`;
    }
  }
}
