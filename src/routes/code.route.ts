import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { CodeController } from '../controllers/code.controllers.js';

const codeRoutes = new Hono();

codeRoutes.use('*', authMiddleware);

// Repository routes
codeRoutes.get('/repositories', CodeController.getRepositories);
codeRoutes.post('/repositories', CodeController.createRepository);
codeRoutes.get('/repositories/:id', CodeController.getRepository);
codeRoutes.put('/repositories/:id', CodeController.updateRepository);
codeRoutes.delete('/repositories/:id', CodeController.deleteRepository);
codeRoutes.get('/repositories/search', CodeController.searchRepositories);

// Repository entry routes
codeRoutes.post('/repositories/:id/entries', CodeController.createEntry);
codeRoutes.get('/entries/:entryId', CodeController.getEntry);
codeRoutes.put('/entries/:entryId', CodeController.updateEntry);
codeRoutes.delete('/entries/:entryId', CodeController.deleteEntry);

export default codeRoutes;