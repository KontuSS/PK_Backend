import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { ChatController } from '../controllers/chat.controllers.js';

const chatRoutes = new Hono();

chatRoutes.use('*', authMiddleware);

// Send a message
chatRoutes.post('/messages', ChatController.sendMessage);

// Get user's conversations
chatRoutes.get('/conversations', ChatController.getConversations);

// Get messages from a conversation
chatRoutes.get('/conversations/:conversationId/messages', ChatController.getMessages);

// Mark conversation as read
chatRoutes.post('/conversations/:conversationId/read', ChatController.markAsRead);

export default chatRoutes;