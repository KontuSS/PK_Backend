import type { Context } from 'hono';
import { ChatService } from '../services/chat.service.js';

export class ChatController {
  static async videoChat(c: Context) {
    const userId = c.get('userId');
    const video = await ChatService.videoChatHandler(userId);

    if (!video) {
      return c.json({ error: 'Error' }, 404);
    }

    return c.json(video);
  }

  static async textChat(c: Context){
    const userId = c.get('userId');
    const text = await ChatService.textChatHandler(userId);

    if (!text) {
      return c.json({ error: 'Error' }, 404);
    }

    return c.json(text);
  }
}