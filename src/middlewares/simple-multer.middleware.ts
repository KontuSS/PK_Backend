import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

// Create uploads directory if it doesn't exist
const ensureUploadDir = async () => {
  const uploadPath = path.join(process.cwd(), 'uploads', 'user-files');
  try {
    await fs.mkdir(uploadPath, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};

// Initialize upload directory
ensureUploadDir();

// Simple multer configuration
const storage = multer.diskStorage({
  destination: (req: any, file: Express.Multer.File, cb: Function) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'user-files');
    cb(null, uploadPath);
  },
  filename: (req: any, file: Express.Multer.File, cb: Function) => {
    // Keep original name with timestamp prefix for uniqueness
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

// File filter for coding files only
const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedExtensions = ['.py', '.js', '.ts', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.md'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExt} not allowed. Only coding files are supported.`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only 1 file
  },
  fileFilter
});
