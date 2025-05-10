import { db } from '../config/db.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/constants.js';

export class AuthService {
  // Register a new user
  static async register(email: string, password: string, username: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      username,
      createdAt: new Date(),
    }).returning();
    
    return this.generateTokens(user.id);
  }

  // Login existing user
  static async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user.id);
  }

  // Generate JWT tokens
  private static generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { userId: string };
      return this.generateTokens(payload.userId);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}