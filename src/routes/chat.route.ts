import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { ChatController } from '../controllers/chat.controllers.js';

const chatRoutes = new Hono();

chatRoutes.use('*', authMiddleware);

chatRoutes.post('/video', ChatController.videoChat);
chatRoutes.get('/chat', ChatController.textChat);

export default chatRoutes;