export interface Streamers {
  [key: string]: boolean;
}

export interface Stream {
  data: StreamData[];
  pagination: { cursor: string };
}

export interface StreamData {
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

export interface Game {
  data: GameData[];
  pagination: { cursor: string };
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
