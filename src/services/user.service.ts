import { db } from '../config/db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';
// import type { UserProfile, UserProfileUpdate } from '../types/users.types.js';

export class UserService {
  static async getProfile(userId: number) {
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
      throw new Error('User not found');
    }

    return user;
  }

  static async updateProfile(userId: number, data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    age?: number;
  }) {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        nick: users.nick,
        bio: users.bio,
        age: users.age,
      });

    return user;
  }
}