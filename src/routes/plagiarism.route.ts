import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { PlagiarismController } from '../controllers/plagiarism.controllers.js';

const plagiarism = new Hono();

plagiarism.use('*', authMiddleware);

plagiarism.post("/compare-users", PlagiarismController.compareUsers);
plagiarism.post("/check-all", PlagiarismController.checkAll);
plagiarism.get("/high-similarity", PlagiarismController.highSimilarity);

export default plagiarism;