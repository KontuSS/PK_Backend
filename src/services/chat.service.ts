import { db } from '../config/db.js';
import { chatSessions } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { config } from '../config/constants.js';

export class VideoService {
  // Initialize a video session
  static async createSession(userId1: string, userId2: string) {
    // Check if session already exists
    const existingSession = await db.query.chatSessions.findFirst({
      where: and(
        or(
          and(
            eq(chatSessions.userId1, userId1),
            eq(chatSessions.userId2, userId2)
          ),
          and(
            eq(chatSessions.userId1, userId2),
            eq(chatSessions.userId2, userId1)
          )
        ),
        eq(chatSessions.active, true)
      ),
    });

    if (existingSession) {
      return this.generateTokens(existingSession.id);
    }

    // Create new session
    const sessionId = uuidv4();
    const [session] = await db.insert(chatSessions).values({
      id: sessionId,
      userId1,
      userId2,
      createdAt: new Date(),
      active: true,
    }).returning();

    return this.generateTokens(session.id);
  }

  // Generate video chat tokens (using external service like LiveKit)
  private static async generateTokens(sessionId: string) {
    const response = await axios.post(
      `${config.VIDEO_API_URL}/tokens`,
      {
        sessionId,
        expiresIn: 3600, // 1 hour
      },
      {
        headers: {
          'Authorization': `Bearer ${config.VIDEO_API_KEY}`,
        },
      }
    );

    return {
      sessionId,
      accessToken: response.data.accessToken,
      serverUrl: config.VIDEO_SERVER_URL,
    };
  }

  // End a video session
  static async endSession(sessionId: string) {
    await db.update(chatSessions)
      .set({ active: false, endedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }

  // Get active sessions for user
  static async getUserSessions(userId: string) {
    return db.query.chatSessions.findMany({
      where: and(
        or(
          eq(chatSessions.userId1, userId),
          eq(chatSessions.userId2, userId)
        ),
        eq(chatSessions.active, true)
      ),
    });
  }
}