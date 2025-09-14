import { db } from "../config/db.js";
import {
  comparisonresults,
  highSimilarityCodes,
  tokenizedcodes,
  repoEntries,
  repositories,
  users,
} from "../models/schema.js";
import { behavioralSimilarity } from "../utils/behavioral-similarity.js";
import { and, eq, sql } from "drizzle-orm";

/** Types inferred from schema */
type ComparisonResultRow = typeof comparisonresults.$inferSelect;
type ComparisonResultInsert = typeof comparisonresults.$inferInsert;
type HighSimilarityRow = typeof highSimilarityCodes.$inferSelect;
type TokenizedCodeRow = typeof tokenizedcodes.$inferSelect;

export class PlagiarismService {
  /**
   * Compare two tokenized codes and save result
   */
  static async compareCodes(
    code1: TokenizedCodeRow,
    code2: TokenizedCodeRow,
    user1Id: number,
    user2Id: number,
    threshold = 0.8
  ): Promise<ComparisonResultRow | null> {
    if (!code1.tokensequence || !code2.tokensequence) return null;

    const sim = behavioralSimilarity(code1.tokensequence, code2.tokensequence);

    if (sim < threshold) return null;

    const [res] = await db
      .insert(comparisonresults)
      .values({
        code1Id: code1.id,
        code2Id: code2.id,
        user1: user1Id,
        user2: user2Id,
        similarityscore: sim,
      } as ComparisonResultInsert)
      .returning();

    return res ?? null;
  }

  /**
   * Compare all tokenized codes between two users
   */
  static async compareUsers(
    user1Id: number,
    user2Id: number,
    threshold = 0.8
  ): Promise<ComparisonResultRow[]> {
    // join tokenizedcodes → repoEntries → repositories to filter by user
    const codes1 = await db
      .select({ token: tokenizedcodes })
      .from(tokenizedcodes)
      .innerJoin(repoEntries, eq(tokenizedcodes.entryid, repoEntries.id))
      .innerJoin(repositories, eq(repoEntries.repositoryId, repositories.id))
      .where(eq(repositories.userId, user1Id));

    const codes2 = await db
      .select({ token: tokenizedcodes })
      .from(tokenizedcodes)
      .innerJoin(repoEntries, eq(tokenizedcodes.entryid, repoEntries.id))
      .innerJoin(repositories, eq(repoEntries.repositoryId, repositories.id))
      .where(eq(repositories.userId, user2Id));

    const results: ComparisonResultRow[] = [];

    for (const { token: c1 } of codes1) {
      for (const { token: c2 } of codes2) {
        const res = await this.compareCodes(c1, c2, user1Id, user2Id, threshold);
        if (res) results.push(res);
      }
    }

    return results;
  }

  /**
   * Check plagiarism for all pairs of users
   */
  static async checkAllUsers(threshold = 0.8): Promise<ComparisonResultRow[]> {
    const allUsers = await db.select().from(users);
    const results: ComparisonResultRow[] = [];

    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const res = await this.compareUsers(
          allUsers[i].id,
          allUsers[j].id,
          threshold
        );
        results.push(...res);
      }
    }

    return results;
  }

  /**
   * Query high-similarity view
   */
  static async getHighSimilarity(minScore = 0.7): Promise<HighSimilarityRow[]> {
    return await db
      .select()
      .from(highSimilarityCodes)
      .where(sql`${highSimilarityCodes.similarityscore} >= ${minScore}`)
      .orderBy(sql`${highSimilarityCodes.similarityscore} DESC`);
  }
}