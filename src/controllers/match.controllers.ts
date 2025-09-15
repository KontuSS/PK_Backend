import type { Context } from "hono";
import { MatchService } from "../services/match.service.js";

export class MatchController {
  static async getMatches(c: Context) {
    const userId = c.get("userId");
    const usersMatched = await MatchService.getMatches(userId);

    if (!usersMatched) {
      return c.json({ error: "Error" }, 404);
    }
    return c.json(usersMatched);
  }

  static async getRandomUsersForMatching(c: Context) {
    const userId = c.get("userId");
    const randomUsers = await MatchService.getRandomUsersForMatching(userId);

    if (!randomUsers) {
      return c.json({ error: "Error fetching random users" }, 404);
    }
    return c.json(randomUsers);
  }
  static async createMatch(c: Context) {
    try {
      const userId = c.get("userId");
      const { targetUserId } = await c.req.json();

      if (!targetUserId || typeof targetUserId !== "number") {
        return c.json({ error: "Target user ID is required" }, 400);
      }

      if (userId === targetUserId) {
        return c.json({ error: "Cannot match with yourself" }, 400);
      }

      const result = await MatchService.createMatch(userId, targetUserId);

      return c.json(result, 201);
    } catch (error: any) {
      console.error("Error in createMatch controller:", error);

      if (error.message === "One or both users not found") {
        return c.json({ error: "User not found" }, 404);
      }

      if (error.message === "Users are already matched/friends") {
        return c.json({ error: "Users are already matched" }, 400);
      }

      return c.json({ error: "Failed to create match" }, 500);
    }
  }
}
