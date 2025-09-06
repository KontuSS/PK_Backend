import { db } from '../config/db.js';
import { 
  repositories, 
  repositoryMetadata, 
  repoEntries, 
  repoEntriesData,
  users 
} from '../models/schema.js';
import { eq, and, desc, isNull, ne, or, sql } from 'drizzle-orm';

// ---- Types inferred from schema to prevent "never" errors ----
type RepositoryRow = typeof repositories.$inferSelect;
type RepoEntryRow = typeof repoEntries.$inferSelect;
type RepoEntryDataRow = typeof repoEntriesData.$inferSelect;
type RepositoryMetadataRow = typeof repositoryMetadata.$inferSelect;

// Composite types for queries with relations
type RepoEntryWithRepository = RepoEntryRow & { repository: Pick<RepositoryRow, "id" | "userId"> };
type RepoEntryWithData = RepoEntryRow & { repoEntriesData: RepoEntryDataRow | null };

export class CodeService {
  /**
   * Get all repositories for a user
   */
  static async getUserRepositories(userId: number) {
    return await db.query.repositories.findMany({
      where: eq(repositories.userId, userId),
      with: {
        repositoryMetadata: true
      },
      orderBy: desc(repositories.id)
    });
  }

  /**
   * Get a single repository with all details
   */
  static async getRepository(repositoryId: number, userId: number) {
    const repository = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.id, repositoryId),
        eq(repositories.userId, userId)
      ),
      with: {
        repositoryMetadata: true,
        repoEntries: {
          where: isNull(repoEntries.parentId), // Root entries only
          with: {
            repoEntriesData: true,
            repoEntries: {
              with: {
                repoEntriesData: true
              }
            }
          }
        }
      }
    });

    if (!repository) {
      throw new Error('Repository not found or access denied');
    }

    return repository;
  }

  /**
   * Create a new repository
   */
  static async createRepository(
    userId: number, 
    name: string, 
    description?: string, 
    visibility: 'public' | 'private' = 'private'
  ) {
    const existingRepo = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.userId, userId),
        eq(repositories.name, name)
      )
    });

    if (existingRepo) {
      throw new Error('Repository with this name already exists');
    }

    const insertedRepo = await db.insert(repositories)
      .values({
        userId,
        name,
        description
      })
      .returning() as RepositoryRow[];

    const [newRepository] = insertedRepo;

    const insertedMetadata = await db.insert(repositoryMetadata)
      .values({
        repositoryId: newRepository.id,
        visibility
      })
      .returning() as RepositoryMetadataRow[];

    const [metadata] = insertedMetadata;

    return {
      ...newRepository,
      repositoryMetadata: metadata
    };
  }

  /**
   * Update repository details
   */
  static async updateRepository(
    repositoryId: number, 
    userId: number, 
    updates: { name?: string; description?: string; visibility?: 'public' | 'private' }
  ) {
    const repository = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.id, repositoryId),
        eq(repositories.userId, userId)
      )
    });

    if (!repository) {
      throw new Error('Repository not found or access denied');
    }

    if (updates.name && updates.name !== repository.name) {
      const existingRepo = await db.query.repositories.findFirst({
        where: and(
          eq(repositories.userId, userId),
          eq(repositories.name, updates.name),
          ne(repositories.id, repositoryId)
        )
      });

      if (existingRepo) {
        throw new Error('Repository with this name already exists');
      }
    }

    const updated = await db.update(repositories)
      .set({
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description })
      })
      .where(eq(repositories.id, repositoryId))
      .returning() as RepositoryRow[];

    const [updatedRepo] = updated;

    if (updates.visibility) {
      await db.update(repositoryMetadata)
        .set({ visibility: updates.visibility })
        .where(eq(repositoryMetadata.repositoryId, repositoryId));
    }

    const metadata = await db.query.repositoryMetadata.findFirst({
      where: eq(repositoryMetadata.repositoryId, repositoryId)
    });

    return {
      ...updatedRepo,
      repositoryMetadata: metadata
    };
  }

  /**
   * Delete a repository
   */
  static async deleteRepository(repositoryId: number, userId: number) {
    const repository = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.id, repositoryId),
        eq(repositories.userId, userId)
      )
    });

    if (!repository) {
      throw new Error('Repository not found or access denied');
    }

    await db.delete(repositories)
      .where(eq(repositories.id, repositoryId));

    return { success: true };
  }

  /**
   * Create a file or directory in repository
   */
  static async createEntry(
    repositoryId: number, 
    userId: number, 
    name: string, 
    isDirectory: boolean = false,
    parentId?: number,
    content?: string,
    extension?: string
  ) {
    const repository = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.id, repositoryId),
        eq(repositories.userId, userId)
      )
    });

    if (!repository) {
      throw new Error('Repository not found or access denied');
    }

    if (parentId) {
      const parent = await db.query.repoEntries.findFirst({
        where: and(
          eq(repoEntries.id, parentId),
          eq(repoEntries.repositoryId, repositoryId)
        ),
        with: {
          repoEntriesData: true
        }
      }) as RepoEntryWithData;

      if (!parent || !parent.repoEntriesData?.isDirectory) {
        throw new Error('Parent directory not found or is not a directory');
      }
    }

    const existingEntry = await db.query.repoEntries.findFirst({
      where: and(
        eq(repoEntries.repositoryId, repositoryId),
        eq(repoEntries.name, name),
        parentId ? eq(repoEntries.parentId, parentId) : isNull(repoEntries.parentId)
      )
    });

    if (existingEntry) {
      throw new Error('Entry with this name already exists in this location');
    }

    const insertedEntry = await db.insert(repoEntries)
      .values({
        repositoryId,
        name,
        parentId: parentId || null
      })
      .returning() as RepoEntryRow[];

    const [newEntry] = insertedEntry;

    const entryData = {
      entryId: newEntry.id,
      isDirectory,
      extension: isDirectory ? null : extension,
      content: isDirectory ? null : content,
      numberOfLines: isDirectory ? null : (content ? content.split('\n').length : 0),
      size: isDirectory ? 0 : (content ? Buffer.byteLength(content, 'utf8') : 0)
    };

    const insertedEntryData = await db.insert(repoEntriesData)
      .values(entryData)
      .returning() as RepoEntryDataRow[];

    const [newEntryData] = insertedEntryData;

    await this.updateRepositoryMetadata(repositoryId, isDirectory);

    return {
      ...newEntry,
      repoEntriesData: newEntryData
    };
  }

  /**
   * Get repository entry details
   */
  static async getEntry(entryId: number, userId: number) {
    const entry = await db.query.repoEntries.findFirst({
      where: eq(repoEntries.id, entryId),
      with: {
        repository: {
          columns: { userId: true }
        },
        repoEntriesData: true,
        repoEntries: {
          with: {
            repoEntriesData: true
          }
        }
      }
    }) as RepoEntryWithRepository & { repoEntriesData: RepoEntryDataRow | null };

    if (!entry || entry.repository.userId !== userId) {
      throw new Error('Entry not found or access denied');
    }

    return entry;
  }

  /**
   * Update repository entry
   */
  static async updateEntry(
    entryId: number, 
    userId: number, 
    updates: { name?: string; content?: string }
  ) {
    const entry = await db.query.repoEntries.findFirst({
      where: eq(repoEntries.id, entryId),
      with: {
        repository: {
          columns: { userId: true }
        },
        repoEntriesData: true
      }
    }) as RepoEntryWithRepository & { repoEntriesData: RepoEntryDataRow | null };

    if (!entry || entry.repository.userId !== userId) {
      throw new Error('Entry not found or access denied');
    }

    if (entry.repoEntriesData?.isDirectory && updates.content) {
      throw new Error('Cannot add content to a directory');
    }

    if (updates.name && updates.name !== entry.name) {
      const existingEntry = await db.query.repoEntries.findFirst({
        where: and(
          eq(repoEntries.repositoryId, entry.repositoryId),
          eq(repoEntries.name, updates.name),
          entry.parentId ? eq(repoEntries.parentId, entry.parentId) : isNull(repoEntries.parentId),
          ne(repoEntries.id, entryId)
        )
      });

      if (existingEntry) {
        throw new Error('Entry with this name already exists in this location');
      }
    }

    if (updates.name) {
      await db.update(repoEntries)
        .set({ name: updates.name })
        .where(eq(repoEntries.id, entryId));
    }

    if (updates.content !== undefined && !entry.repoEntriesData?.isDirectory) {
      const newData = {
        content: updates.content,
        numberOfLines: updates.content.split('\n').length,
        size: Buffer.byteLength(updates.content, 'utf8'),
        lastModified: new Date().toISOString() // fix string vs Date
      };

      await db.update(repoEntriesData)
        .set(newData)
        .where(eq(repoEntriesData.entryId, entryId));
    }

    return await this.getEntry(entryId, userId);
  }

  /**
   * Delete repository entry
   */
  static async deleteEntry(entryId: number, userId: number) {
    const entry = await db.query.repoEntries.findFirst({
      where: eq(repoEntries.id, entryId),
      with: {
        repository: {
          columns: { userId: true, id: true }
        },
        repoEntriesData: true
      }
    }) as RepoEntryWithRepository & { repoEntriesData: RepoEntryDataRow | null };

    if (!entry || entry.repository.userId !== userId) {
      throw new Error('Entry not found or access denied');
    }

    await db.delete(repoEntries)
      .where(eq(repoEntries.id, entryId));

    if (entry.repoEntriesData?.isDirectory) {
      await this.updateRepositoryMetadata(entry.repository.id, true, true);
    } else {
      await this.updateRepositoryMetadata(entry.repository.id, false, true);
    }

    return { success: true };
  }

  /**
   * Helper method to update repository metadata
   */
  private static async updateRepositoryMetadata(
    repositoryId: number, 
    isDirectory: boolean, 
    isDeletion: boolean = false
  ) {
    const increment = isDeletion ? -1 : 1;

    if (isDirectory) {
      await db.update(repositoryMetadata)
        .set({
          totalFolders: sql`total_folders + ${increment}`,
          lastModified: new Date().toISOString()
        })
        .where(eq(repositoryMetadata.repositoryId, repositoryId));
    } else {
      await db.update(repositoryMetadata)
        .set({
          totalFiles: sql`total_files + ${increment}`,
          lastModified: new Date().toISOString()
        })
        .where(eq(repositoryMetadata.repositoryId, repositoryId));
    }
  }

  /**
   * Search repositories by name or description
   */
  static async searchRepositories(userId: number, query: string) {
    return await db.query.repositories.findMany({
      where: and(
        eq(repositories.userId, userId),
        or(
          sql`${repositories.name} ILIKE ${'%' + query + '%'}`,
          sql`${repositories.description} ILIKE ${'%' + query + '%'}`
        )
      ),
      with: {
        repositoryMetadata: true
      },
      orderBy: desc(repositories.id)
    });
  }
}