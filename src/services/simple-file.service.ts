import { db } from "../config/db.js";
import { userFiles } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";

export class SimpleFileService {
  /**
   * Upload/Replace user's file (ONE USER = ONE FILE)
   */
  static async uploadUserFile(
    userId: number,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string
  ) {
    // Check if user already has a file
    const existingFile = await db.query.userFiles.findFirst({
      where: eq(userFiles.userId, userId),
    });

    if (existingFile) {
      // Delete old file from disk
      try {
        await fs.unlink(existingFile.filePath);
      } catch (error) {
        console.warn("Could not delete old file:", error);
      }

      // Update existing record
      const updatedFile = await db
        .update(userFiles)
        .set({
          fileName,
          filePath,
          fileSize,
          mimeType,
          uploadedAt: new Date().toISOString(),
        })
        .where(eq(userFiles.userId, userId))
        .returning();

      return updatedFile[0];
    } else {
      // Insert new file record
      const insertedFile = await db
        .insert(userFiles)
        .values({
          userId,
          fileName,
          filePath,
          fileSize,
          mimeType,
        })
        .returning();

      return insertedFile[0];
    }
  }

  /**
   * Get user's file
   */
  static async getUserFile(userId: number) {
    const file = await db.query.userFiles.findFirst({
      where: eq(userFiles.userId, userId),
    });

    if (!file) {
      throw new Error("User has no uploaded file");
    }

    return file;
  }

  /**
   * Get any user's file by user ID (for public viewing)
   */
  static async getFileByUserId(userId: number) {
    const file = await db.query.userFiles.findFirst({
      where: eq(userFiles.userId, userId),
    });

    if (!file) {
      throw new Error("User has no uploaded file");
    }

    return file;
  }

  /**
   * Delete user's file
   */
  static async deleteUserFile(userId: number) {
    const existingFile = await db.query.userFiles.findFirst({
      where: eq(userFiles.userId, userId),
    });

    if (!existingFile) {
      throw new Error("User has no uploaded file");
    }

    // Delete file from disk
    try {
      await fs.unlink(existingFile.filePath);
    } catch (error) {
      console.warn("Could not delete file from disk:", error);
    }

    // Delete record from database
    await db.delete(userFiles).where(eq(userFiles.userId, userId));

    return { message: "File deleted successfully" };
  }

  /**
   * Get all users who have uploaded files
   */
  static async getAllUsersWithFiles() {
    const files = await db.query.userFiles.findMany({
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            nick: true,
          },
        },
      },
    });

    return files;
  }
}
