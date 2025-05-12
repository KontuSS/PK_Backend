import type { Context } from 'hono';
import { ChatService } from '../services/chat.service.js';

export class ChatController {
  static async getConversations(c: Context) {
    const userId = c.get('userId');

    const userConversations = await ChatService.getAll(userId);

    return c.json(userConversations);
  }

  static async getSingleConversation(c: Context){
    const conversationId = Number(c.req.param('id'));
    const userId = c.get('userId');

    const singleConversation = await ChatService.getSingle(userId, conversationId);

    return c.json(singleConversation);
  }
}

    // if (!video) {
    //   return c.json({ error: 'Error' }, 404);
    // }
