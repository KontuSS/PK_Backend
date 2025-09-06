import * as admin from 'firebase-admin';
import { db } from '../config/db.js';
import { eq } from 'drizzle-orm';
import { users } from '../models/schema.js';

export class FCMService {
  private static initialized = false;

  static initialize() {
    if (!this.initialized) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
      
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.initialized = true;
      }
    }
  }

  static async sendMessage(token: string, title: string, body: string, data?: any) {
    if (!this.initialized) {
      console.warn('FCM not initialized');
      return;
    }

    try {
      const message = {
        token,
        notification: {
          title,
          body
        },
        data
      };

      await admin.messaging().send(message);
    } catch (error) {
      console.error('Error sending FCM message:', error);
    }
  }

  static async sendChatNotification(receiverId: number, senderName: string, message: string, conversationId: string) {
    // Get user's FCM token from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, receiverId),
      columns: {
        fcmToken: true
      }
    });

    if (user?.fcmToken) {
      await this.sendMessage(
        user.fcmToken,
        `New message from ${senderName}`,
        message,
        {
          type: 'chat',
          conversationId,
          senderId: receiverId.toString()
        }
      );
    }
  }
}

// Initialize FCM on app startup
FCMService.initialize();