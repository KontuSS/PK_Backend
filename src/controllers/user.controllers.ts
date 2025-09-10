import type { Context } from "hono";
import { UserService } from "../services/user.service.js";

export class UserController {
  static async getProfile(c: Context) {
    try {
      const userId = c.get("userId");
      const profile = await UserService.getProfile(userId);
      return c.json(profile);
    } catch (error) {
      console.error("Error getting profile:", error);
      return c.json({ error: "Failed to get profile" }, 500);
    }
  }

  static async updateProfile(c: Context) {
    try {
      const userId = c.get("userId");
      const data = await c.req.json();
      const updatedProfile = await UserService.updateProfile(userId, data);
      return c.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      return c.json({ error: "Failed to update profile" }, 500);
    }
  }

  static async getAllInterests(c: Context) {
    try {
      const interests = await UserService.getAllInterests();
      return c.json(interests);
    } catch (error) {
      console.error("Error getting interests:", error);
      return c.json({ error: "Failed to get interests" }, 500);
    }
  }
}
