import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';

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

// Health check
app.get('/', (c) => c.text('API is running'));

export default app;