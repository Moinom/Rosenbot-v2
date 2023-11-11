export interface Streamers {
  [key: string]: Streamer | null;
}

interface Streamer {
  id: string;
  name: string;
  thumbnailUrl: string;
  gameName: string;
  streamTitle: string;
}

export interface Channels {
  data: ChannelData[];
  pagination: { cursor?: string };
}

export interface ChannelData {
  broadcaster_language: string;
  broadcaster_login: string;
  display_name: string;
  game_id: string;
  game_name: string;
  id: string;
  is_live: boolean;
  tag_ids: string[];
  tags: string[];
  thumbnail_url: string;
  title: string;
  started_at: string;
}

export interface Games {
  data: GameData[];
  pagination: { cursor?: string };
}

export interface GameData {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: string;
}

export interface TwitchTokenResponse {
  access_token: string;
}

export interface TwitchSubscriptions {
  total: number;
  data: TwitchSubscriptionData[];
  total_cost: number;
  max_total_cost: number;
  pagination: { cursor?: string };
}

export interface TwitchSubscriptionData {
  id: string;
  status: SubscriptionStatus;
  type: string;
  version: string;
  condition: { [key: string]: string };
  created_at: string; // format: 2023-09-07T15:47:17.405588903Z
  transport: { [key: string]: string };
  cost: number;
}

export interface TwitchEvent {
  id: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  type: string;
  started_at: string; // format: 2023-09-08T11:22:40Z
}

export interface TwitchRequestParams {
  method: string;
  headers: {
    'Client-id': string;
    'Content-Type'?: string;
    Authorization: string;
  };
  body?: string;
}

export type SubscriptionStatus =
  | 'enabled'
  | 'webhook_callback_verification_pending'
  | 'webhook_callback_verification_failed'
  | 'notification_failures_exceeded'
  | 'authorization_revoked'
  | 'moderator_removed'
  | 'user_removed'
  | 'version_removed'
  | 'websocket_disconnected'
  | 'websocket_failed_ping_pong'
  | 'websocket_received_inbound_traffic'
  | 'websocket_connection_unused'
  | 'websocket_internal_error'
  | 'websocket_network_timeout'
  | 'websocket_network_error';
