import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.controllers.js';

const auth = new Hono();

auth.post('/register', AuthController.register);
auth.post('/login', AuthController.login);

export default auth;