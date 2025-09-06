import type { Context } from 'hono';
import { CodeService } from '../services/code.service.js';

export class CodeController {
  /**
   * Get all repositories for the authenticated user
   */
  static async getRepositories(c: Context) {
    try {
      const userId = c.get('userId');
      const repositories = await CodeService.getUserRepositories(userId);
      
      return c.json({ repositories });
    } catch (error) {
      console.error('Error getting repositories:', error);
      return c.json({ error: 'Failed to get repositories' }, 500);
    }
  }

  /**
   * Get a single repository with all details
   */
  static async getRepository(c: Context) {
    try {
      const userId = c.get('userId');
      const repositoryId = Number(c.req.param('id'));
      
      if (isNaN(repositoryId)) {
        return c.json({ error: 'Invalid repository ID' }, 400);
      }

      const repository = await CodeService.getRepository(repositoryId, userId);
      return c.json({ repository });
    } catch (error: any) {
      console.error('Error getting repository:', error);
      
      if (error.message === 'Repository not found or access denied') {
        return c.json({ error: 'Repository not found' }, 404);
      }
      
      return c.json({ error: 'Failed to get repository' }, 500);
    }
  }

  /**
   * Create a new repository
   */
  static async createRepository(c: Context) {
    try {
      const userId = c.get('userId');
      const { name, description, visibility } = await c.req.json();

      if (!name) {
        return c.json({ error: 'Repository name is required' }, 400);
      }

      const repository = await CodeService.createRepository(
        userId, 
        name, 
        description, 
        visibility
      );

      return c.json({ repository }, 201);
    } catch (error: any) {
      console.error('Error creating repository:', error);
      
      if (error.message === 'Repository with this name already exists') {
        return c.json({ error: error.message }, 409);
      }
      
      return c.json({ error: 'Failed to create repository' }, 500);
    }
  }

  /**
   * Update repository details
   */
  static async updateRepository(c: Context) {
    try {
      const userId = c.get('userId');
      const repositoryId = Number(c.req.param('id'));
      const updates = await c.req.json();

      if (isNaN(repositoryId)) {
        return c.json({ error: 'Invalid repository ID' }, 400);
      }

      const repository = await CodeService.updateRepository(
        repositoryId, 
        userId, 
        updates
      );

      return c.json({ repository });
    } catch (error: any) {
      console.error('Error updating repository:', error);
      
      if (error.message === 'Repository not found or access denied') {
        return c.json({ error: 'Repository not found' }, 404);
      }
      
      if (error.message === 'Repository with this name already exists') {
        return c.json({ error: error.message }, 409);
      }
      
      return c.json({ error: 'Failed to update repository' }, 500);
    }
  }

  /**
   * Delete a repository
   */
  static async deleteRepository(c: Context) {
    try {
      const userId = c.get('userId');
      const repositoryId = Number(c.req.param('id'));

      if (isNaN(repositoryId)) {
        return c.json({ error: 'Invalid repository ID' }, 400);
      }

      const result = await CodeService.deleteRepository(repositoryId, userId);
      return c.json(result);
    } catch (error: any) {
      console.error('Error deleting repository:', error);
      
      if (error.message === 'Repository not found or access denied') {
        return c.json({ error: 'Repository not found' }, 404);
      }
      
      return c.json({ error: 'Failed to delete repository' }, 500);
    }
  }

  /**
   * Create a file or directory in repository
   */
  static async createEntry(c: Context) {
    try {
      const userId = c.get('userId');
      const repositoryId = Number(c.req.param('id'));
      const { name, isDirectory, parentId, content, extension } = await c.req.json();

      if (isNaN(repositoryId)) {
        return c.json({ error: 'Invalid repository ID' }, 400);
      }

      if (!name) {
        return c.json({ error: 'Entry name is required' }, 400);
      }

      if (!isDirectory && !content) {
        return c.json({ error: 'Content is required for files' }, 400);
      }

      const entry = await CodeService.createEntry(
        repositoryId, 
        userId, 
        name, 
        isDirectory, 
        parentId, 
        content, 
        extension
      );

      return c.json({ entry }, 201);
    } catch (error: any) {
      console.error('Error creating entry:', error);
      
      if (error.message === 'Repository not found or access denied') {
        return c.json({ error: 'Repository not found' }, 404);
      }
      
      if (error.message === 'Parent directory not found or is not a directory') {
        return c.json({ error: error.message }, 404);
      }
      
      if (error.message === 'Entry with this name already exists in this location') {
        return c.json({ error: error.message }, 409);
      }
      
      return c.json({ error: 'Failed to create entry' }, 500);
    }
  }

  /**
   * Get repository entry details
   */
  static async getEntry(c: Context) {
    try {
      const userId = c.get('userId');
      const entryId = Number(c.req.param('entryId'));

      if (isNaN(entryId)) {
        return c.json({ error: 'Invalid entry ID' }, 400);
      }

      const entry = await CodeService.getEntry(entryId, userId);
      return c.json({ entry });
    } catch (error: any) {
      console.error('Error getting entry:', error);
      
      if (error.message === 'Entry not found or access denied') {
        return c.json({ error: 'Entry not found' }, 404);
      }
      
      return c.json({ error: 'Failed to get entry' }, 500);
    }
  }

  /**
   * Update repository entry
   */
  static async updateEntry(c: Context) {
    try {
      const userId = c.get('userId');
      const entryId = Number(c.req.param('entryId'));
      const updates = await c.req.json();

      if (isNaN(entryId)) {
        return c.json({ error: 'Invalid entry ID' }, 400);
      }

      const entry = await CodeService.updateEntry(entryId, userId, updates);
      return c.json({ entry });
    } catch (error: any) {
      console.error('Error updating entry:', error);
      
      if (error.message === 'Entry not found or access denied') {
        return c.json({ error: 'Entry not found' }, 404);
      }
      
      if (error.message === 'Cannot add content to a directory') {
        return c.json({ error: error.message }, 400);
      }
      
      if (error.message === 'Entry with this name already exists in this location') {
        return c.json({ error: error.message }, 409);
      }
      
      return c.json({ error: 'Failed to update entry' }, 500);
    }
  }

  /**
   * Delete repository entry
   */
  static async deleteEntry(c: Context) {
    try {
      const userId = c.get('userId');
      const entryId = Number(c.req.param('entryId'));

      if (isNaN(entryId)) {
        return c.json({ error: 'Invalid entry ID' }, 400);
      }

      const result = await CodeService.deleteEntry(entryId, userId);
      return c.json(result);
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      
      if (error.message === 'Entry not found or access denied') {
        return c.json({ error: 'Entry not found' }, 404);
      }
      
      return c.json({ error: 'Failed to delete entry' }, 500);
    }
  }

  /**
   * Search repositories
   */
  static async searchRepositories(c: Context) {
    try {
      const userId = c.get('userId');
      const query = c.req.query('q');

      if (!query) {
        return c.json({ error: 'Search query is required' }, 400);
      }

      const repositories = await CodeService.searchRepositories(userId, query);
      return c.json({ repositories });
    } catch (error) {
      console.error('Error searching repositories:', error);
      return c.json({ error: 'Failed to search repositories' }, 500);
    }
  }
}