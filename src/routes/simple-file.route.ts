import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { SimpleFileController } from '../controllers/simple-file.controller.js';

const simpleFileRoutes = new Hono();

// All routes require authentication
simpleFileRoutes.use('*', authMiddleware);

// My file operations
simpleFileRoutes.post('/upload', SimpleFileController.uploadFile);           // Upload/replace my file
simpleFileRoutes.get('/my-file', SimpleFileController.getMyFile);            // Get my file info
simpleFileRoutes.get('/my-file/view', SimpleFileController.viewFile);        // View my file content
simpleFileRoutes.get('/my-file/download', SimpleFileController.viewFile);    // Download my file
simpleFileRoutes.delete('/my-file', SimpleFileController.deleteMyFile);      // Delete my file

// Browse other users' files
simpleFileRoutes.get('/users', SimpleFileController.getAllUsersWithFiles);   // List all users with files
simpleFileRoutes.get('/user/:userId/view', SimpleFileController.viewUserFile);    // View user's file
simpleFileRoutes.get('/user/:userId/download', SimpleFileController.viewUserFile); // Download user's file

export default simpleFileRoutes;
