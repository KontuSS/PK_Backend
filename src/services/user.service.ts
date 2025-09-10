import { db } from "../config/db.js";
import { users, userInterests, intrests } from "../models/schema.js";
import { eq, inArray } from "drizzle-orm";
import type {
  UserProfile,
  UserProfileUpdate,
  Interest,
} from "../types/user.types.js";

export class UserService {
  static async getProfile(userId: number): Promise<UserProfile> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nick: true,
        bio: true,
        age: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get user interests
    const userInterestsData = await db.query.userInterests.findFirst({
      where: eq(userInterests.userId, userId),
      columns: {
        categoryIds: true,
      },
    });

    let interests: Interest[] = [];

    if (
      userInterestsData?.categoryIds &&
      userInterestsData.categoryIds.length > 0
    ) {
      // Get interest details
      interests = await db
        .select({
          id: intrests.id,
          name: intrests.name,
          description: intrests.description,
        })
        .from(intrests)
        .where(inArray(intrests.id, userInterestsData.categoryIds));
    }

    return {
      ...user,
      interests,
    };
  }

  static async updateProfile(
    userId: number,
    data: UserProfileUpdate
  ): Promise<UserProfile> {
    // Extract interests from data to handle separately
    const { interests: interestIds, ...userData } = data;

    // Update user basic information
    if (Object.keys(userData).length > 0) {
      await db.update(users).set(userData).where(eq(users.id, userId));
    }

    // Update user interests if provided
    if (interestIds !== undefined) {
      // First, check if user has existing interests
      const existingInterests = await db.query.userInterests.findFirst({
        where: eq(userInterests.userId, userId),
      });

      if (existingInterests) {
        // Update existing interests
        await db
          .update(userInterests)
          .set({ categoryIds: interestIds })
          .where(eq(userInterests.userId, userId));
      } else {
        // Create new interests record
        await db.insert(userInterests).values({
          userId,
          categoryIds: interestIds,
        });
      }
    }

    // Return updated profile
    return this.getProfile(userId);
  }

  static async getAllInterests(): Promise<Interest[]> {
    return await db
      .select({
        id: intrests.id,
        name: intrests.name,
        description: intrests.description,
      })
      .from(intrests)
      .orderBy(intrests.name);
  }
}
