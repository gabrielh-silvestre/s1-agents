import { Chat } from 'whatsapp-web.js';

import { RouteBase } from './base';
import { Agent } from '../openai/agent';

export class RawRoute extends RouteBase {
  constructor(chat: Chat) {
    super('raw', chat, new Agent('asst_qAybN7Be1IswTGYhD9kC7NYi'));
  }

  async answer(msg: string): Promise<string | null> {
    try {
      return await this.sendToGPT(msg);
    } catch (error: any) {
      console.error(error);
      return null;
    }
  }
}
