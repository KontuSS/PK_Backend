import type { Context } from 'hono';
import { PlagiarismService } from '../services/plagiarism.service.js';

export class PlagiarismController {
  static async getPlagiarismFlag(c: Context) {
    const userId = c.get('userId');
    const flag = await PlagiarismService.getPlagiarismFlag(userId);

    if (!flag) {
      return c.json({ error: 'Error' }, 404);
    }

    return c.json(flag);
  }
}