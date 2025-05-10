import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  uploadCode,
  getCode,
  checkPlagiarism,
  updateCode,
} from '../controllers/code.controller';

const codeRoutes = new Hono();

codeRoutes.post('/upload', authMiddleware, uploadCode);
codeRoutes.get('/:id', authMiddleware, getCode);
codeRoutes.post('/plagiarism', authMiddleware, checkPlagiarism);
codeRoutes.put('/:id', authMiddleware, updateCode);

export default codeRoutes;