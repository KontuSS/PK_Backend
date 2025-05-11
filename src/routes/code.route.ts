import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { CodeController } from '../controllers/code.controllers.js';

const codeRoutes = new Hono();

codeRoutes.use('*', authMiddleware);

codeRoutes.post('/upload', CodeController.uploadCode);
codeRoutes.get('/repo', CodeController.getCode);
codeRoutes.get('/repo/content', CodeController.getRepoContent);

export default codeRoutes;