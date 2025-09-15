import type { Context } from "hono";
import { PlagiarismService } from "../services/plagiarism.service.js";

export class PlagiarismController {
  static async compareUsers(c: Context) {
    try {
      const body = await c.req.json<{
        user1Id: number;
        user2Id: number;
        threshold?: number;
      }>();
      if (!body.user1Id || !body.user2Id) {
        return c.json({ error: "user1Id and user2Id are required" }, 400);
      }
      const results = await PlagiarismService.compareUsers(
        Number(body.user1Id),
        Number(body.user2Id),
        body.threshold ? Number(body.threshold) : 0.8
      );
      return c.json({ count: results.length, results });
    } catch (err) {
      return c.json({ error: (err as Error).message }, 500);
    }
  }

  static async checkAll(c: Context) {
    try {
      const threshold = c.req.query("threshold")
        ? Number(c.req.query("threshold"))
        : 0.8;
      const results = await PlagiarismService.checkAllUsers(threshold);
      return c.json({ count: results.length, results });
    } catch (err) {
      return c.json({ error: (err as Error).message }, 500);
    }
  }

  static async highSimilarity(c: Context) {
    try {
      const minScore = c.req.query("minScore")
        ? Number(c.req.query("minScore"))
        : 0.7;
      const results = await PlagiarismService.getHighSimilarity(minScore);
      return c.json({ count: results.length, results });
    } catch (err) {
      return c.json({ error: (err as Error).message }, 500);
    }
  }
}
