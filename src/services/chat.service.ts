import { db } from '../config/db.js';
import { conversationMessages, userFriendsView, userConversations, messages } from '../models/schema.js';
import { eq, and, asc, desc } from 'drizzle-orm';

export class ChatService {
  static async getAll(userId: number) {
    const userConvs = await db
      .select()
      .from(userConversations)
      .where(eq(userConversations.otherUserId, userId))
      .orderBy(desc(userConversations.lastMessageAt));

    return userConvs;
  }

  static async getSingle(userId: number, conversationId: number){

    const conversation = await db
      .select().from(messages)
      .where(eq(messages.conversationId, BigInt(conversationId)))
      .orderBy(asc(messages.sentAt));

    return conversation;
  }
}