import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { WebSocketServer } from 'ws';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import chatRoutes from './routes/chat.route.js';
import codeRoutes from './routes/code.route.js';
import matchRoutes from './routes/match.route.js';
import plagiarismRoutes from './routes/plagiarism.route.js';

const app = new Hono();
// Middlewares
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:3000'], // Your frontend URL
  credentials: true,
}));

// Routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/chat', chatRoutes);
app.route('/code', codeRoutes);
app.route('/matching', matchRoutes);
app.route('/plagiarism', plagiarismRoutes);

// Health check
app.get('/', (c) => c.text('API is running'));

export default app;