import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { ChatController } from '../controllers/chat.controllers.js';

const chatRoutes = new Hono();

chatRoutes.use('*', authMiddleware);

// General chat
chatRoutes.get('/userConversations', ChatController.getConversations);
chatRoutes.get('/userConversations/:id', ChatController.getSingleConversation);

//chatRoutes.post('/video', ChatController.videoChat);

export default chatRoutes;