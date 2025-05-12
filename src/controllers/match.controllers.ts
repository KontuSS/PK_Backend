import type { Context } from 'hono';
import { MatchService } from '../services/match.service.js';


export class MatchController {
  static async getMatches(c: Context) {
    const userId = c.get('userId');
    const usersMatched = await MatchService.getMatches(userId);



    if (!usersMatched) {
      return c.json({ error: 'Error' }, 404);
    }
    return c.json(usersMatched);
  }
}