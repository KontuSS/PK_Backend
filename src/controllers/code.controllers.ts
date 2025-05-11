import type { Context } from 'hono';
import { CodeService } from '../services/code.service.js';

export class CodeController {
  static async getCode(c: Context) {
    const userId = c.get('userId');
    const repo = await CodeService.getRepo(userId);

    if (!repo) {
      return c.json({ error: 'Repository not found' }, 404);
    }

    return c.json(repo);
  }

  static async getRepoContent(c: Context){
    const userId = c.get('userId');
    const repo = await CodeService.getRepo(userId);
    if (!repo) return c.json({ error: 'Repository not found' }, 404);
    const content = await CodeService.getRepoContent(repo.id);
    return c.json(content);
  }

  static async uploadCode(c: Context) {
    const userId = c.get('userId');
    const data = await c.req.json();
    const updatedProfile = await CodeService.uploadCode(userId, data);
    return ;//c.json(updatedProfile);
  }
}