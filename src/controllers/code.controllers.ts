import { Context } from 'hono';
import { CodeService } from '../services/code.service.js';
import { PlagiarismService } from '../services/plagiarism.service.js';

export const uploadCode = async (c: Context) => {
  const { code, language, userId } = await c.req.json();
  const result = await CodeService.uploadCode(code, language, userId);
  return c.json(result);
};

export const checkPlagiarism = async (c: Context) => {
  const { code, language } = await c.req.json();
  const result = await PlagiarismService.check(code, language);
  return c.json(result);
};