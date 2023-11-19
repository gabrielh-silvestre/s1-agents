import { Chat, Message, MessageMedia } from 'whatsapp-web.js';

import { RouteBase } from './base';
import { Agent } from '../openai/agent';
import { AgentEnum } from '../utils';

export class SpeechRoute extends RouteBase {
  constructor(chat: Chat, agent = new Agent(AgentEnum.audio)) {
    super(chat, agent, '.speech');
  }

  private async toBase64(response: string): Promise<string> {
    const audio = await this.agent.transcriptText(response);
    const arrayBuffer = await audio.arrayBuffer();

    return Buffer.from(arrayBuffer).toString('base64');
  }

  async handle(msg: Message): Promise<boolean | null> {
    try {
      const response = await this.sendToGPT(msg.body);
      if (!response) return null;

      const base64 = await this.toBase64(response);
      const msgMedia = new MessageMedia('audio/ogg', base64);

      await msg.reply(msgMedia);
      return true;
    } catch (error: any) {
      console.log(error);
      return null;
    }
  }
}