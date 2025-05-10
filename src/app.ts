import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

// Routes
import authRoutes from './routes/auth.route.js';
import codeRoutes from './routes/code.route.js';
import matchingRoutes from './routes/match.route.js';
import videoRoutes from './routes/chat.route.js';

// Database connection
import { connectDb } from './config/db.js';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());

// Connect to database
connectDb();

// Register routes
app.route('/auth', authRoutes);
app.route('/code', codeRoutes);
app.route('/match', matchingRoutes);
app.route('/video', videoRoutes);

export default app;

// App logic path:
// App -> route -> controllers -> services
// model <-> database