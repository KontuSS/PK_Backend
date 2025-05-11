import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { PlagiarismController } from '../controllers/plagiarism.controllers.js';

const codeRoutes = new Hono();

codeRoutes.use('*', authMiddleware);

codeRoutes.get('/plagGet', PlagiarismController.getPlagiarismFlag);

export default codeRoutes;