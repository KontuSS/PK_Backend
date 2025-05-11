import { db } from '../config/db.js';
import { conversationMessages, userFriendsView, userConversations } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

export class ChatService {
  static async videoChatHandler(userId: number) {
    const video = 0;
    return video;
  }

  static async textChatHandler(userId: number){
    const chat = 0;
    return chat;
  }
}