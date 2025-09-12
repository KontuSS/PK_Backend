import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req: any, file: Express.Multer.File, cb: Function) => {
    const uploadPath = path.join(process.cwd(), "uploads", "repositories");

    // Ensure directory exists
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (error) {
      console.error("Error creating upload directory:", error);
    }

    cb(null, uploadPath);
  },
  filename: (req: any, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename while preserving extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + "-" + uniqueSuffix + fileExtension;
    cb(null, fileName);
  },
});

// File filter for allowed file types
const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedTypes = [
    ".txt",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".js",
    ".ts",
    ".html",
    ".css",
    ".json",
    ".xml",
    ".md",
    ".kt",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".swift",
    ".sql",
    ".yaml",
    ".yml",
    ".sh",
    ".bat",
    ".ps1",
    ".dockerfile",
  ];

  const fileExt = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${fileExt} not allowed. Only code files are supported.`
      )
    );
  }
};

// Create multer upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files per upload
  },
  fileFilter,
});

// Helper function to convert multer middleware for Hono
export const honoMulter = (multerMiddleware: any) => {
  return async (c: any, next: Function) => {
    return new Promise((resolve, reject) => {
      multerMiddleware(c.req.raw, c.res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(next());
        }
      });
    });
  };
};
