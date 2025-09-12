import type { Context } from "hono";
import { SimpleFileService } from "../services/simple-file.service.js";
import { upload } from "../middlewares/simple-multer.middleware.js";
import { promises as fs } from "fs";
import path from "path";

export class SimpleFileController {
  /**
   * Upload user's file (replace if exists)
   */
  static async uploadFile(c: Context): Promise<Response> {
    try {
      const userId = c.get("userId");

      return new Promise((resolve) => {
        const multerUpload = upload.single("file");

        multerUpload(c.req.raw as any, c.res as any, async (err: any) => {
          if (err) {
            console.error("Multer upload error:", err);
            return resolve(c.json({ error: err.message }, 400));
          }

          const file = (c.req.raw as any).file;

          if (!file) {
            return resolve(c.json({ error: "No file uploaded" }, 400));
          }

          try {
            // Save file info to database
            const fileRecord = await SimpleFileService.uploadUserFile(
              userId,
              file.originalname,
              file.path,
              file.size,
              file.mimetype
            );

            return resolve(
              c.json(
                {
                  success: true,
                  message: "File uploaded successfully",
                  file: {
                    id: fileRecord.id,
                    fileName: fileRecord.fileName,
                    fileSize: fileRecord.fileSize,
                    mimeType: fileRecord.mimeType,
                    uploadedAt: fileRecord.uploadedAt,
                  },
                },
                201
              )
            );
          } catch (serviceError: any) {
            // Clean up uploaded file if database operation fails
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              console.error("Error cleaning up file:", unlinkError);
            }

            console.error("Error saving file info:", serviceError);
            return resolve(c.json({ error: "Failed to save file" }, 500));
          }
        });
      }) as Promise<Response>;
    } catch (error: any) {
      console.error("Error in uploadFile:", error);
      return c.json({ error: "Failed to upload file" }, 500);
    }
  }

  /**
   * Get current user's file info
   */
  static async getMyFile(c: Context) {
    try {
      const userId = c.get("userId");

      const file = await SimpleFileService.getUserFile(userId);

      return c.json({
        success: true,
        file: {
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
        },
      });
    } catch (error: any) {
      console.error("Error getting user file:", error);

      if (error.message === "User has no uploaded file") {
        return c.json({ error: "No file uploaded" }, 404);
      }

      return c.json({ error: "Failed to get file" }, 500);
    }
  }

  /**
   * View/Download user's file content
   */
  static async viewFile(c: Context) {
    try {
      const userId = c.get("userId");
      const download = c.req.query("download") === "true";

      const file = await SimpleFileService.getUserFile(userId);

      // Read file content
      const content = await fs.readFile(file.filePath, "utf-8");
      const extension = path.extname(file.fileName);

      // Set appropriate headers
      if (download) {
        c.header(
          "Content-Disposition",
          `attachment; filename="${file.fileName}"`
        );
        c.header("Content-Type", "application/octet-stream");
      } else {
        // For web display, determine content type
        const mimeTypes: Record<string, string> = {
          ".py": "text/x-python",
          ".js": "text/javascript",
          ".ts": "text/typescript",
          ".java": "text/x-java",
          ".cpp": "text/x-c++",
          ".c": "text/x-c",
          ".html": "text/html",
          ".css": "text/css",
          ".json": "application/json",
          ".xml": "application/xml",
          ".md": "text/markdown",
        };

        const contentType = mimeTypes[extension] || "text/plain";
        c.header("Content-Type", contentType);
      }

      return c.text(content);
    } catch (error: any) {
      console.error("Error viewing file:", error);

      if (error.message === "User has no uploaded file") {
        return c.json({ error: "No file uploaded" }, 404);
      }

      return c.json({ error: "Failed to view file" }, 500);
    }
  }

  /**
   * View any user's file by user ID (public viewing)
   */
  static async viewUserFile(c: Context) {
    try {
      const targetUserId = Number(c.req.param("userId"));
      const download = c.req.query("download") === "true";

      if (isNaN(targetUserId)) {
        return c.json({ error: "Invalid user ID" }, 400);
      }

      const file = await SimpleFileService.getFileByUserId(targetUserId);

      // Read file content
      const content = await fs.readFile(file.filePath, "utf-8");
      const extension = path.extname(file.fileName);

      // Set appropriate headers
      if (download) {
        c.header(
          "Content-Disposition",
          `attachment; filename="${file.fileName}"`
        );
        c.header("Content-Type", "application/octet-stream");
      } else {
        // For web display, determine content type
        const mimeTypes: Record<string, string> = {
          ".py": "text/x-python",
          ".js": "text/javascript",
          ".ts": "text/typescript",
          ".java": "text/x-java",
          ".cpp": "text/x-c++",
          ".c": "text/x-c",
          ".html": "text/html",
          ".css": "text/css",
          ".json": "application/json",
          ".xml": "application/xml",
          ".md": "text/markdown",
        };

        const contentType = mimeTypes[extension] || "text/plain";
        c.header("Content-Type", contentType);
      }

      return c.text(content);
    } catch (error: any) {
      console.error("Error viewing user file:", error);

      if (error.message === "User has no uploaded file") {
        return c.json({ error: "User has no file uploaded" }, 404);
      }

      return c.json({ error: "Failed to view file" }, 500);
    }
  }

  /**
   * Delete current user's file
   */
  static async deleteMyFile(c: Context) {
    try {
      const userId = c.get("userId");

      const result = await SimpleFileService.deleteUserFile(userId);

      return c.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);

      if (error.message === "User has no uploaded file") {
        return c.json({ error: "No file to delete" }, 404);
      }

      return c.json({ error: "Failed to delete file" }, 500);
    }
  }

  /**
   * Get all users with files (for browsing)
   */
  static async getAllUsersWithFiles(c: Context) {
    try {
      const files = await SimpleFileService.getAllUsersWithFiles();

      return c.json({
        success: true,
        users: files.map((file) => ({
          userId: file.userId,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
        })),
      });
    } catch (error: any) {
      console.error("Error getting users with files:", error);
      return c.json({ error: "Failed to get users with files" }, 500);
    }
  }
}
