import { db } from '../config/db.js';
import { eq, and, inArray } from 'drizzle-orm';
import { userInterests, users, userFriends, userBlocked } from '../models/schema.js';
import {  } from '../utils/match.utils.js'

export class MatchService {
  static async getMatches(userId: number) {

    // Filtering data
    const allUsers = await db.select({id: users.id}).from(users); 
    const userFriendList = await db.query.userFriends.findFirst({
      where: eq(userFriends.userId, userId),
      columns: {
        friends: true
      }
    })
    const userInterest = await db.query.userInterests.findFirst({
      where: eq(userInterests.userId, userId),
      columns: {
        categoryIds: true
      }
    })
    const allUsersIds = allUsers.map(user => user.id)
    const friendSet = new Set(userFriendList?.friends || []);

    // Data used for matching algoritm
    const nonFriendIds = allUsersIds.filter(id => id !== userId && !friendSet.has(id));
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
    const potentialMatches = await db.query.userInterests.findMany({
      where: inArray(userInterests.userId, nonFriendIds),
      columns: {
        userId: true,
        categoryIds: true
      },
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            nick: true,
            bio: true
          }
        }
      }
    }) as unknown as MatchWithUser[];

    // Calculate compability score
    const scoredMatches = potentialMatches.map(match => {
      const sharedInterest = match.categoryIds?.filter(id => userInterestSet.has(id)).length || 0;

      return {
        userId: match.userId,
        firstName: match.user.firstName,
        lastName: match.user.lastName,
        nick: match.user.nick,
        bio: match.user.bio,
        sharedInterest,
        compability: (sharedInterest / userInterestSet.size) * 100 || 0
      }
    });

    const sortedMatches = scoredMatches.sort((a, b) => b.sharedInterest - a.sharedInterest).slice(0, 5);

    return sortedMatches;
  }
}