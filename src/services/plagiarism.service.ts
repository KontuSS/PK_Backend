import { db } from '../config/db.js';
import {  } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

export class PlagiarismService {
  static async getPlagiarismFlag(userId: number) {
    const flag = 0;
    return flag;
  }
}