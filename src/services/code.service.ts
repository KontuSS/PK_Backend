import { db } from '../config/db.js';
import { codeSubmissions } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';
import { PlagiarismChecker } from './plagiarism.service.js';
import { StorageService } from './storage.service';

export class CodeService {
  // Save code submission
  static async saveCode(
    userId: string,
    code: string,
    language: string,
    title?: string
  ) {
    const [submission] = await db.insert(codeSubmissions).values({
      userId,
      code,
      language,
      title: title || 'Untitled',
      createdAt: new Date(),
    }).returning();

    return submission;
  }

  // Get user's code submissions
  static async getUserSubmissions(userId: string) {
    return db.query.codeSubmissions.findMany({
      where: eq(codeSubmissions.userId, userId),
      orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
    });
  }

  // Share code with specific user
  static async shareCode(submissionId: string, userId: string, targetUserId: string) {
    const submission = await db.query.codeSubmissions.findFirst({
      where: and(
        eq(codeSubmissions.id, submissionId),
        eq(codeSubmissions.userId, userId)
      ),
    });

    if (!submission) throw new Error('Submission not found');

    // Create a shared copy
    const [shared] = await db.insert(codeSubmissions).values({
      ...submission,
      userId: targetUserId,
      shared: true,
      originalSubmissionId: submissionId,
      createdAt: new Date(),
    }).returning();

    return shared;
  }
}