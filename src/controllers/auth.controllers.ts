import type { Context } from 'hono';
import { AuthService } from '../services/auth.service.js';
import type { RegisterInput, LoginInput } from '../types/auth.types.js';

export class AuthController {
  static async register(c: Context) {
    const input = await c.req.json<RegisterInput>();
    const result = await AuthService.register(input);
    return c.json(result);
  }

  static async login(c: Context) {
    const input = await c.req.json<LoginInput>();
    const result = await AuthService.login(input);
    return c.json(result);
  }
}