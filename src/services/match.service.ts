import { db } from '../config/db.js';
import {  } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';
import {  } from '../utils/match.utils.js'

export class MatchService {
  static async getMatches(userId: number) {
    const matches = 0;
    //Prosty algorytm do dopasowywania kategorii użytkowników
    return matches;
  }
}