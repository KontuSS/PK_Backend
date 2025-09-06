import { db } from '../config/db.js';
import { eq, and, desc, asc, or, count } from 'drizzle-orm';
import { conversations, messages, users, userBlocked } from '../models/schema.js';
import { FCMService } from './fcm.service.js';

export class ChatService {
  static async getOrCreateConversation(user1Id: number, user2Id: number) {
    // Ensure consistent ordering to avoid duplicate conversations
    const [smallerId, largerId] = [user1Id, user2Id].sort((a, b) => a - b);
    
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.user1Id, smallerId),
        eq(conversations.user2Id, largerId)
      )
    });

    if (!conversation) {
      [conversation] = await db.insert(conversations)
        .values({
          user1Id: smallerId,
          user2Id: largerId
        })
        .returning();
    }

    return conversation;
  }

  static async sendMessage(senderId: number, receiverId: number, messageType: string, content: Buffer) {
    // Check if receiver has blocked the sender
    const blocked = await db.query.userBlocked.findFirst({
      where: and(
        eq(userBlocked.userId, receiverId),
        eq(userBlocked.blockedUsers, [senderId])
      )
    });

    if (blocked) {
      throw new Error('User has blocked you');
    }

    const conversation = await this.getOrCreateConversation(senderId, receiverId);

    const [message] = await db.insert(messages)
      .values({
        conversationId: conversation.id,
        senderId,
        receiverId,
        messageType,
        content,
        isRead: false
      })
      .returning();

    // Send FCM notification
    const sender = await db.query.users.findFirst({
      where: eq(users.id, senderId),
      columns: { firstName: true, lastName: true }
    });

    if (sender) {
      const senderName = `${sender.firstName} ${sender.lastName}`;
      const messageText = messageType === 'text' ? content.toString('utf-8') : 'New media message';
      
      await FCMService.sendChatNotification(
        receiverId,
        senderName,
        messageText,
        conversation.id.toString()
      );
    }

    return message;
  }

  static async getConversations(userId: number) {
    const userConversations = await db.query.conversations.findMany({
      where: or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      ),
      with: {
        user_user1Id: {
          columns: { id: true, firstName: true, lastName: true, nick: true }
        },
        user_user2Id: {
          columns: { id: true, firstName: true, lastName: true, nick: true }
        },
        messages: {
          orderBy: desc(messages.sentAt),
          limit: 1
        }
      }
    });

    return userConversations.map(async conv => ({
      id: conv.id,
      otherUser: conv.user1Id === userId ? conv.user_user2Id : conv.user_user1Id,
      lastMessage: conv.messages[0],
      unreadCount: await this.getUnreadCount(conv.id, userId)
    }));
  }

  static async getMessages(conversationId: bigint, userId: number, limit = 50, offset = 0) {
    // Verify user is part of conversation
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        ))
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messagesList = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: desc(messages.sentAt),
      limit,
      offset,
      with: {
        user_senderId: {
          columns: { id: true, firstName: true, lastName: true, nick: true }
        }
      }
    });

    // Mark messages as read
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));

    return messagesList.reverse(); // Return in chronological order
  }

  static async getUnreadCount(conversationId: bigint, userId: number) {
    const result = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));

    return result[0]?.count || 0;
  }

  static async markAsRead(conversationId: bigint, userId: number) {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ));
  }
}