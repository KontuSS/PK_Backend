// Test endpoint to verify multer functionality
import { Hono } from "hono";
import multer from "multer";
import path from "path";

const testApp = new Hono();

// Simple multer configuration for testing
const upload = multer({
  dest: "uploads/test/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Test endpoint
testApp.post("/test-upload", async (c) => {
  return new Promise((resolve) => {
    const multerSingle = upload.single("file");

    multerSingle(c.req.raw as any, c.res as any, (err: any) => {
      if (err) {
        console.error("Upload error:", err);
        resolve(c.json({ error: err.message }, 400));
        return;
      }

      const file = (c.req.raw as any).file;

      if (!file) {
        resolve(c.json({ error: "No file uploaded" }, 400));
        return;
      }

      resolve(
        c.json({
          message: "File uploaded successfully!",
          file: {
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
          },
        })
      );
    });
  });
});

export default testApp;
