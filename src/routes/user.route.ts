import { Hono } from 'hono';
import { UserController } from '../controllers/user.controllers.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const users = new Hono();

users.use('*', authMiddleware);

users.get('/profile', UserController.getProfile);
users.patch('/profile', UserController.updateProfile);

export default users;