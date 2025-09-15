import { db } from "../config/db.js";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  userInterests,
  users,
  userFriends,
  userBlocked,
  conversations,
} from "../models/schema.js";
import {} from "../utils/match.utils.js";

export class MatchService {
  static async getMatches(userId: number) {
    // Filtering data
    const allUsers = await db.select({ id: users.id }).from(users);
    const userFriendList = await db.query.userFriends.findFirst({
      where: eq(userFriends.userId, userId),
      columns: {
        friends: true,
      },
    });
    const userInterest = await db.query.userInterests.findFirst({
      where: eq(userInterests.userId, userId),
      columns: {
        categoryIds: true,
      },
    });
    const allUsersIds = allUsers.map((user) => user.id);
    const friendSet = new Set(userFriendList?.friends || []);

    // Data used for matching algoritm
    const nonFriendIds = allUsersIds.filter(
      (id) => id !== userId && !friendSet.has(id)
    );
    const userInterestSet = new Set(userInterest?.categoryIds || []);

    type MatchWithUser = {
      userId: number;
      categoryIds: number[];
      user: {
        id: number;
        firstName: string;
        lastName: string;
        nick: string;
        bio: string | null;
      };
    };

    // Get all nonFriendIds interest
    const potentialMatches = (await db.query.userInterests.findMany({
      where: inArray(userInterests.userId, nonFriendIds),
      columns: {
        userId: true,
        categoryIds: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            nick: true,
            bio: true,
          },
        },
      },
    })) as unknown as MatchWithUser[];

    // Calculate compability score
    const scoredMatches = potentialMatches.map((match) => {
      const sharedInterest =
        match.categoryIds?.filter((id) => userInterestSet.has(id)).length || 0;

      return {
        userId: match.userId,
        firstName: match.user.firstName,
        lastName: match.user.lastName,
        nick: match.user.nick,
        bio: match.user.bio,
        sharedInterest,
        compability: (sharedInterest / userInterestSet.size) * 100 || 0,
      };
    });

    const sortedMatches = scoredMatches
      .sort((a, b) => b.sharedInterest - a.sharedInterest)
      .slice(0, 5);

    return sortedMatches;
  }

  static async getRandomUsersForMatching(userId: number) {
    try {
      // Get user's friends and blocked users to exclude them
      const userFriendList = await db.query.userFriends.findFirst({
        where: eq(userFriends.userId, userId),
        columns: {
          friends: true,
        },
      });

      const userBlockedList = await db.query.userBlocked.findFirst({
        where: eq(userBlocked.userId, userId),
        columns: {
          blockedUsers: true,
        },
      });

      // Create sets for efficient lookup
      const friendSet = new Set(userFriendList?.friends || []);
      const blockedSet = new Set(userBlockedList?.blockedUsers || []);

      // Get all users except current user, friends, and blocked users
      const allUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          nick: users.nick,
          bio: users.bio,
          age: users.age,
        })
        .from(users);

      console.log("Total users in database:", allUsers.length);
      console.log("Current user ID:", userId);
      console.log("Friends:", Array.from(friendSet));
      console.log("Blocked users:", Array.from(blockedSet));

      // Filter out current user, friends, and blocked users
      const availableUsers = allUsers.filter(
        (user) =>
          user.id !== userId &&
          !friendSet.has(user.id) &&
          !blockedSet.has(user.id)
      );

      console.log("Available users after filtering:", availableUsers.length);

      // Shuffle array and take 10 random users
      const shuffled = availableUsers.sort(() => 0.5 - Math.random());
      const randomUsers = shuffled.slice(0, 10);

      // Get interests for each random user
      const userIds = randomUsers.map((user) => user.id);
      const usersWithInterests = await db.query.userInterests.findMany({
        where: inArray(userInterests.userId, userIds),
        columns: {
          userId: true,
          categoryIds: true,
        },
      });

      // Create a map of userId to interests for quick lookup
      const interestsMap = new Map();
      usersWithInterests.forEach((userInterest) => {
        interestsMap.set(userInterest.userId, userInterest.categoryIds || []);
      });

      // Add interests to each user
      const randomUsersWithInterests = randomUsers.map((user) => ({
        ...user,
        interests: interestsMap.get(user.id) || [],
      }));

      return randomUsersWithInterests;
    } catch (error) {
      console.error("Error fetching random users:", error);
      return null;
    }
  }

  static async createMatch(userId: number, targetUserId: number) {
    try {
      // Validate that both users exist
      const [user, targetUser] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { id: true, nick: true },
        }),
        db.query.users.findFirst({
          where: eq(users.id, targetUserId),
          columns: { id: true, nick: true },
        }),
      ]);

      if (!user || !targetUser) {
        throw new Error("One or both users not found");
      }

      // Check if they are already friends
      const userFriendList = await db.query.userFriends.findFirst({
        where: eq(userFriends.userId, userId),
        columns: { friends: true },
      });

      const currentFriends = userFriendList?.friends || [];
      if (currentFriends.includes(targetUserId)) {
        throw new Error("Users are already matched/friends");
      }

      // Get target user's current friends
      const targetFriendList = await db.query.userFriends.findFirst({
        where: eq(userFriends.userId, targetUserId),
        columns: { friends: true },
      });

      const targetCurrentFriends = targetFriendList?.friends || [];

      // Update both users' friend lists using simple array operations
      await Promise.all([
        // Update user's friends
        db
          .insert(userFriends)
          .values({
            userId: userId,
            friends: [...currentFriends, targetUserId],
          })
          .onConflictDoUpdate({
            target: userFriends.userId,
            set: {
              friends: [...currentFriends, targetUserId],
            },
          }),

        // Update target user's friends
        db
          .insert(userFriends)
          .values({
            userId: targetUserId,
            friends: [...targetCurrentFriends, userId],
          })
          .onConflictDoUpdate({
            target: userFriends.userId,
            set: {
              friends: [...targetCurrentFriends, userId],
            },
          }),
      ]);

      // Create a conversation between them so they appear in each other's conversations
      const user1Id = Math.min(userId, targetUserId);
      const user2Id = Math.max(userId, targetUserId);

      try {
        await db
          .insert(conversations)
          .values({
            user1Id,
            user2Id,
          })
          .onConflictDoNothing();

        // Return success without the conversation ID to avoid BigInt issues
        return {
          success: true,
          message: "Match created successfully",
          match: {
            userId,
            targetUserId,
            conversationCreated: true,
          },
        };
      } catch (convError) {
        console.error("Error creating conversation:", convError);
        // Still return success since the friendship was created
        return {
          success: true,
          message: "Match created successfully (conversation setup pending)",
          match: {
            userId,
            targetUserId,
            conversationCreated: false,
          },
        };
      }
    } catch (error: any) {
      console.error("Error creating match:", error);
      throw error;
    }
  }
}
