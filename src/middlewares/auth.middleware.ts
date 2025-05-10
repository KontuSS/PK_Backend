import type { Context } from 'hono';
import { AuthService } from '../services/auth.service.js';

export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const userId = await AuthService.verifyToken(token);
    c.set('userId', userId);
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}