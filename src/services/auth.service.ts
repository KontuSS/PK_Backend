import { db } from '../config/db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RegisterInput, LoginInput, AuthResponse } from '../types/auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const [user] = await db.insert(users).values({
      email: input.email,
      passwordHash: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      nick: input.nick,
      isActive: true,
    }).returning();

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nick: user.nick,
      },
    };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await db.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nick: user.nick,
      },
    };
  }

  private static generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  static async verifyToken(token: string): Promise<number> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
      return payload.userId;
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
}