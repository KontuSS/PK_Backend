import axios from 'axios';
import { db } from '../config/db.ts';
import { codeSubmissions } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config/constants.js';

export class PlagiarismChecker {
  // Check against external plagiarism API
  static async checkAgainstAPI(code: string, language: string) {
    const response = await axios.post(config.PLAGIARISM_API_URL, {
      code,
      language,
    }, {
      headers: {
        'Authorization': `Bearer ${config.PLAGIARISM_API_KEY}`,
      },
    });

    return response.data;
  }

  // Check against internal database
  static async checkAgainstDatabase(code: string, language: string, threshold = 0.8) {
    const submissions = await db.query.codeSubmissions.findMany({
      where: eq(codeSubmissions.language, language),
    });

    const results = [];
    for (const submission of submissions) {
      const similarity = this.calculateSimilarity(code, submission.code);
      if (similarity >= threshold) {
        results.push({
          submissionId: submission.id,
          userId: submission.userId,
          similarity,
          createdAt: submission.createdAt,
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  // Simple similarity algorithm (for demo, consider using more advanced algorithms)
  private static calculateSimilarity(str1: string, str2: string) {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    return intersection.size / Math.max(set1.size, set2.size);
  }
}