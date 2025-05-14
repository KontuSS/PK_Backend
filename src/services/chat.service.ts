import { db } from '../config/db.js';
import { userConversations, messages, conversations, users } from '../models/schema.js';
import { eq, and, asc, desc, or } from 'drizzle-orm';
import { sendFCMNotification } from './firebase.service.js';

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

/**
   * Wysyła wiadomość i powiadomienie FCM
   * @param senderId ID nadawcy
   * @param receiverId ID odbiorcy
   * @param content Treść wiadomości
   */
  static async sendMessage(
    senderId: number,
    receiverId: number,
    content: string
  ) {
    // 1. Zapisz wiadomość w bazie danych
    const message = await this.saveMessageToDB(senderId, receiverId, content);
    
    // 2. Wyślij powiadomienie FCM
    await this.sendNotification(receiverId, {
      title: `Nowa wiadomość`,
      body: this.formatMessagePreview(content),
      data: {
        type: 'new_message',
        conversationId: conversations.id.toString(),
        senderId: senderId.toString()
      }
    });

    return {
      message,
      conversationId: conversations.id
    };
  }

  /** Zapisuje wiadomość w bazie danych */
  private static async saveMessageToDB(
    senderId: number,
    receiverId: number,
    content: string
  ) {
    // Znajdź lub stwórz konwersację
    let conversation = await db.query.conversations.findFirst({
      where: and(
        or(
          and(
            eq(conversations.user1Id, senderId),
            eq(conversations.user2Id, receiverId)
          ),
          and(
            eq(conversations.user1Id, receiverId),
            eq(conversations.user2Id, senderId)
          )
        )
      )
    });

    if (!conversation) {
      [conversation] = await db.insert(conversations)
        .values({
          user1Id: Math.min(senderId, receiverId),
          user2Id: Math.max(senderId, receiverId)
        })
        .returning();
    }

    // Zapisz wiadomość
    const [message] = await db.insert(messages)
        .values({
          conversationId: conversation.id,
          senderId,
          receiverId,
          messageType: 'text', // Wymagane pole
          content: Buffer.from(content),
          // sentAt jest automatycznie ustawiany przez DEFAULT
          isRead: false
        })
        .returning();

    return {message, conversation};
  }

  /** Wysyła powiadomienie FCM */
  private static async sendNotification(
    receiverId: number,
    payload: {
      title: string;
      body: string;
      data: Record<string, string>;
    }
  ) {
    // Pobierz token FCM odbiorcy
    const receiver = await db.query.users.findFirst({
      where: eq(users.id, receiverId),
      columns: { fcmToken: true }
    });

    if (!receiver?.fcmToken) return false;

    // Wyślij powiadomienie
    return sendFCMNotification(
      receiver.fcmToken,
      { title: payload.title, body: payload.body },
      payload.data
    );
  }

  /** Formatuje podgląd wiadomości dla powiadomienia */
  private static formatMessagePreview(content: string): string {
    return content.length > 50 
      ? `${content.substring(0, 50)}...` 
      : content;
  }


}