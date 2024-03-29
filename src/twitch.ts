import {
  Channels,
  TwitchRequestParams,
  TwitchSubscriptionData,
  TwitchSubscriptions,
  TwitchTokenResponse,
} from './utils/twitchTypes';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { ReplyStatus } from './utils/discordUtils';

dotenv.config();
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';
const TWITCH_WEBHOOK_SECRET = process.env.TWITCH_WEBHOOK_SECRET || '';
const TWITCH_CALLBACK_URL = process.env.TWITCH_CALLBACK_URL || '';

// Verify signature received from Twitch message
export function verifySignature(
  messageSignature: string,
  messageID: string,
  messageTimestamp: string,
  body: string
) {
  let message = messageID + messageTimestamp + body;
  let signature = crypto.createHmac('sha256', TWITCH_WEBHOOK_SECRET).update(message);
  let expectedSignatureHeader = 'sha256=' + signature.digest('hex');

  return expectedSignatureHeader === messageSignature;
}

// Remove subscriptions that failed or lead to an incorrect callback url
export async function removeInvalidSubs() {
  const subs = await getSubscriptions();
  subs?.data.forEach(async (sub) => {
    if (
      (sub.status !== 'enabled' && sub.status !== 'webhook_callback_verification_pending') ||
      sub.transport.callback !== `${TWITCH_CALLBACK_URL}/message`
    ) {
      removeSubscription(sub.id);
    }
  });
}

export async function removeSubscription(subscriptionId: string) {
  const response = await callTwitchApi(`eventsub/subscriptions?id=${subscriptionId}`, 'DELETE');
  return response?.status === 204 ? ReplyStatus.success : ReplyStatus.failed;
}

// Request all subscriptions made with this app
export async function getSubscriptions(query?: string) {
  const initialQuery = query ? `eventsub/subscriptions?${query}` : 'eventsub/subscriptions';
  const initialResponse = await callTwitchApi(initialQuery, 'GET');
  if (!initialResponse) return;

  const subscriptions: TwitchSubscriptions = await initialResponse?.json();
  let nextPageCursor = subscriptions.pagination.cursor;

  while (nextPageCursor) {
    const response = await callTwitchApi(
      `${initialQuery}${query ? '&' : '?'}after=${nextPageCursor}`,
      'GET'
    );
    const nextSub: TwitchSubscriptions = await response?.json();
    subscriptions.data.push(...nextSub.data);
    nextPageCursor = nextSub.pagination.cursor;
  }

  return subscriptions;
}

// Create a new subscription with user id
export async function createSubscription(userId: string) {
  const body = {
    type: 'stream.online',
    version: '1',
    condition: { broadcaster_user_id: userId },
    transport: {
      method: 'webhook',
      callback: `${TWITCH_CALLBACK_URL}/message`,
      secret: TWITCH_WEBHOOK_SECRET,
    },
  };
  const response = await callTwitchApi('eventsub/subscriptions', 'POST', JSON.stringify(body));
  const subscriptions: TwitchSubscriptions | undefined = await response?.json();
  return subscriptions?.data ? subscriptions?.data[0].id : '';
}

// Request ID of a single streamer
export async function requestStreamerInfo(name: string) {
  const query = `search/channels?query=${name}`;
  const initialResponse = await callTwitchApi(query, 'GET');
  let channels: Channels | undefined = await initialResponse?.json();
  if (!channels) return;

  let nextPageCursor = channels.pagination.cursor;

  while (nextPageCursor) {
    const response = await callTwitchApi(`${query}&after=${nextPageCursor}`, 'GET');
    const nextSub: Channels | undefined = await response?.json();
    nextSub && channels.data.push(...nextSub.data);
    nextPageCursor = nextSub?.pagination.cursor;
  }

  for (let channel of channels.data) {
    if (channel.display_name.toLowerCase() === name.toLowerCase()) {
      return channel;
    }
  }
}

// Check if subscription is valid
export function isSubscriptionValid(subscription: TwitchSubscriptionData) {
  if (
    subscription.type === 'stream.online' &&
    subscription.status === 'enabled' &&
    subscription.transport.callback === `${TWITCH_CALLBACK_URL}/message`
  ) {
    return true;
  }
  return false;
}

// Generic function for all calls to Twitch API
async function callTwitchApi(path: string, method: string, body?: string) {
  const url = `https://api.twitch.tv/helix/${path}`;
  const appToken = await getAppAuthToken();
  const params: TwitchRequestParams = {
    method: method,
    headers: {
      'Client-id': TWITCH_CLIENT_ID,
      Authorization: `Bearer ${appToken}`,
    },
  };

  if (body) {
    params['body'] = body;
    params.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, params).catch((error) => {
    console.error(error);
  });
  return response;
}

// Generate twitch app access token
async function getAppAuthToken() {
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
  const response = await fetch(twitchAuthUrl, {
    method: 'POST',
  }).catch((error) => {
    console.error(error);
  });
  const authResJson = (await response?.json()) as TwitchTokenResponse;
  return authResJson.access_token;
}
