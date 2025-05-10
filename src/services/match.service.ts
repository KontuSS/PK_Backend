import { db } from '../config/db.js';
import { users, matches, userSkills } from '../models/schema.js';
import { and, eq, ne, notInArray, or } from 'drizzle-orm';

export class MatchingService {
  // Find potential matches based on skills/categories
  static async findMatches(userId: string, limit = 10) {
    // Get current user's skills
    const currentUserSkills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, userId),
      columns: { skillId: true },
    });

    const skillIds = currentUserSkills.map(s => s.skillId);

    // Find users with matching skills (excluding self and already swiped users)
    const alreadySwiped = await db.query.matches.findMany({
      where: eq(matches.userId1, userId),
      columns: { userId2: true },
    });

    const excludeIds = [userId, ...alreadySwiped.map(m => m.userId2)];

    return db.query.users.findMany({
      where: and(
        notInArray(users.id, excludeIds),
        // Users who share at least one skill
        db.select()
          .from(userSkills)
          .where(
            and(
              eq(userSkills.userId, users.id),
              inArray(userSkills.skillId, skillIds)
            )
          .exists()
      ),
      limit,
      with: {
        skills: {
          columns: { skillId: true },
          with: {
            skill: {
              columns: { name: true },
            },
          },
        },
      },
    });
  }

  // Process swipe action
  static async processSwipe(userId: string, targetUserId: string, like: boolean) {
    // Check if reverse match exists
    const reverseMatch = await db.query.matches.findFirst({
      where: and(
        eq(matches.userId1, targetUserId),
        eq(matches.userId2, userId),
        eq(matches.liked, true)
      ),
    });

    // Record the swipe
    await db.insert(matches).values({
      userId1: userId,
      userId2: targetUserId,
      liked: like,
      matched: like && !!reverseMatch,
      createdAt: new Date(),
    });

    // If mutual like, create a match
    if (like && reverseMatch) {
      await db.update(matches)
        .set({ matched: true })
        .where(eq(matches.id, reverseMatch.id));

      return { matched: true, chatSession: await this.createChatSession(userId, targetUserId) };
    }

    return { matched: false };
  }

  // Create chat session for matched users
  private static async createChatSession(userId1: string, userId2: string) {
    const [session] = await db.insert(chatSessions).values({
      userId1,
      userId2,
      createdAt: new Date(),
      active: true,
    }).returning();

    return session;
  }
}