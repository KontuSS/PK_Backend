import { db } from '../config/db.js';
import { repoEntries, repositories, repositoryMetadata } from '../models/schema.js';
import { eq, and } from 'drizzle-orm';

export class CodeService {
  static async getRepo(userId: number) {

    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.userId, userId),
      columns: {
        id: true,
        name: true,
        description: true
      },
      with: {
        repositoryMetadata: {
          columns: {
            totalFiles: true,
            totalFolders: true,
            totalSize: true,
            createdAt: true,
            lastModified: true,
            license: true,
            visibility: true
          }
        },
      }
    });

    if (!repo){
      throw new Error('Repo not found');
    }
    return repo;
  }

  static async getRepoContent(repositoryId: number){
    const content = await db.query.repoEntries.findMany({
      where: eq(repoEntries.repositoryId, repositoryId),
      columns: {
        id: true,
        name: true,
        parentId: true
      },
      with: {
        repoEntriesData: {
          columns: {
            isDirectory: true,
            extension: true,
            content: true,
            numberOfLines: true,
            size: true,
            lastModified: true,
            createdAt: true
          }
        }
      }
    });

    return content;
  }


  static async uploadCode(userId: number, data: {}){
    
  }
}