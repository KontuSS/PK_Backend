import type { Context } from 'hono';
import { UserService } from '../services/user.service.js';

export class UserController {
  static async getProfile(c: Context) {
    const userId = c.get('userId');
    const profile = await UserService.getProfile(userId);
    return c.json(profile);
  }

  static async updateProfile(c: Context) {
    const userId = c.get('userId');
    const data = await c.req.json();
    const updatedProfile = await UserService.updateProfile(userId, data);
    return c.json(updatedProfile);
  }
}