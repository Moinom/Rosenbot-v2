import { Client, Collection } from 'discord.js';

declare module 'http' {
  export interface IncomingMessage {
    rawBody: any;
  }
}

declare module 'discord.js' {
  export interface Client {
    commands: Collection;
  }
  export default Client;
}
