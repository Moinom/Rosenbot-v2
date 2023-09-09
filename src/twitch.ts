import {
  Channels,
  Streamers,
  TwitchRequestParams,
  TwitchSubscriptions,
  TwitchTokenResponse,
} from './types/twitchTypes';
import savedStreamers from './streamers.json';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';
const TWITCH_WEBHOOK_SECRET = process.env.TWITCH_WEBHOOK_SECRET || '';
const TWITCH_CALLBACK_URL = process.env.TWITCH_CALLBACK_URL || '';

// Subscribe to all streamers on the list
export async function subscribeAll(streamers: Streamers) {
  for (let i in streamers) {
    streamers[i]?.id && createSubscription(streamers[i]!.id);
  }
}

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
  subs.data.forEach(async (sub) => {
    if (
      (sub.status !== 'enabled' && sub.status !== 'webhook_callback_verification_pending') ||
      sub.transport.callback !== `${TWITCH_CALLBACK_URL}/message`
    ) {
      const response = await callTwitchApi(`eventsub/subscriptions?id=${sub.id}`, 'DELETE');
      console.log('Delete status: ', response?.status);
    }
  });
}

// Request all subscriptions made with this app
async function getSubscriptions(query?: string) {
  const response = await callTwitchApi('eventsub/subscriptions', 'GET');
  const subscriptions: TwitchSubscriptions = await response?.json();
  return subscriptions;
}

// Create a new subscription with user id
async function createSubscription(userId: string) {
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
  console.log('Create sub status: ', response?.status)
}

// Request data matching streamer names
// TODO: pagination
export async function getStreamerInfo() {
  const tempStreamers: Streamers = savedStreamers;

  for (let streamer in tempStreamers) {
    const response = await callTwitchApi(`search/channels?query=${streamer}`, 'GET');
    let channels: Channels = await response?.json();
    channels.data.forEach((channel) => {
      if (channel.display_name.toLowerCase() === streamer.toLowerCase()) {
        tempStreamers[streamer.toLowerCase()] = {
          id: channel.id,
          name: channel.display_name,
          thumbnailUrl: channel.thumbnail_url,
          gameName: channel.game_name,
          streamTitle: channel.title,
        };
        return;
      }
    });
  }
  return tempStreamers;
}

// Request ID of a single streamer
export async function requestStreamerId(name: string) {
  const response = await callTwitchApi(`search/channels?query=${name}`, 'GET');
  let channels: Channels = await response?.json();
  for (let channel of channels.data) {
    if (channel.display_name.toLowerCase() === name.toLowerCase()) {
      return channel.id;
    }
  }
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

  const response = await fetch(url, params).catch((e) => {
    console.log(e);
  });
  return response;
}

// Generate twitch app access token
async function getAppAuthToken() {
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
  const response = await fetch(twitchAuthUrl, {
    method: 'POST',
  }).catch((e) => {
    console.log(e);
  });
  const authResJson = (await response?.json()) as TwitchTokenResponse;
  return authResJson.access_token;
}
