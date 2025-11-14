/**
 * Data Source Repository
 * Handles all database operations for data sources using Drizzle ORM
 */

import { and, eq, desc } from "drizzle-orm";
import { pgDb } from "../pg/db.pg";
import { dataSource as dataSourceTable } from "../pg/schema.pg";
import type { DataSourceInsert } from "../pg/schema.pg";
import type {
  DataSourceCategory,
  DataSourceStatus,
  ConnectionStatus,
} from "app-types/data-source";

export const dataSourceRepository = {
  /**
   * Create a new data source
   */
  async create(data: DataSourceInsert) {
    const result = await pgDb.insert(dataSourceTable).values(data).returning();
    return result[0];
  },

  /**
   * Get data source by ID
   */
  async findById(id: string) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(eq(dataSourceTable.id, id))
      .limit(1);
    return result[0] || null;
  },

  /**
   * Get data source by ID and project ID (security check)
   */
  async findByIdAndProject(id: string, projectId: string) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.id, id),
          eq(dataSourceTable.projectId, projectId),
        ),
      )
      .limit(1);
    return result[0] || null;
  },

  /**
   * Get all data sources for a project
   */
  async findByProject(projectId: string) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(eq(dataSourceTable.projectId, projectId))
      .orderBy(desc(dataSourceTable.createdAt));
    return result;
  },

  /**
   * Get data sources by category for a project
   */
  async findByProjectAndCategory(
    projectId: string,
    category: DataSourceCategory,
  ) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.projectId, projectId),
          eq(dataSourceTable.category, category),
        ),
      )
      .orderBy(desc(dataSourceTable.createdAt));
    return result;
  },

  /**
   * Get data sources by type for a project
   */
  async findByProjectAndType(projectId: string, type: string) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.projectId, projectId),
          eq(dataSourceTable.type, type),
        ),
      )
      .orderBy(desc(dataSourceTable.createdAt));
    return result;
  },

  /**
   * Get all database type data sources for a project
   */
  async findDatabasesByProject(projectId: string) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.projectId, projectId),
          eq(dataSourceTable.category, "database"),
        ),
      )
      .orderBy(desc(dataSourceTable.createdAt));
    return result;
  },

  /**
   * Get all knowledge base type data sources for a project
   */
  async findKnowledgeBasesByProject(projectId: string) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.projectId, projectId),
          eq(dataSourceTable.category, "knowledge_base"),
        ),
      )
      .orderBy(desc(dataSourceTable.createdAt));
    return result;
  },

  /**
   * Update data source
   */
  async update(id: string, data: Partial<DataSourceInsert>) {
    const result = await pgDb
      .update(dataSourceTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dataSourceTable.id, id))
      .returning();
    return result[0] || null;
  },

  /**
   * Update data source with project check (security)
   */
  async updateByIdAndProject(
    id: string,
    projectId: string,
    data: Partial<DataSourceInsert>,
  ) {
    const result = await pgDb
      .update(dataSourceTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dataSourceTable.id, id),
          eq(dataSourceTable.projectId, projectId),
        ),
      )
      .returning();
    return result[0] || null;
  },

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    id: string,
    status: ConnectionStatus,
    error?: string | null,
  ) {
    const result = await pgDb
      .update(dataSourceTable)
      .set({
        connectionStatus: status,
        connectionError: error || null,
        lastConnectionTest: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dataSourceTable.id, id))
      .returning();
    return result[0] || null;
  },

  /**
   * Update data source status (active/inactive)
   */
  async updateStatus(id: string, status: DataSourceStatus) {
    const result = await pgDb
      .update(dataSourceTable)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(dataSourceTable.id, id))
      .returning();
    return result[0] || null;
  },

  /**
   * Delete data source
   */
  async delete(id: string) {
    const result = await pgDb
      .delete(dataSourceTable)
      .where(eq(dataSourceTable.id, id))
      .returning();
    return result[0] || null;
  },

  /**
   * Delete data source with project check (security)
   */
  async deleteByIdAndProject(id: string, projectId: string) {
    const result = await pgDb
      .delete(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.id, id),
          eq(dataSourceTable.projectId, projectId),
        ),
      )
      .returning();
    return result[0] || null;
  },

  /**
   * Check if data source exists for a project
   */
  async exists(projectId: string, id: string) {
    const result = await pgDb
      .select({ id: dataSourceTable.id })
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.id, id),
          eq(dataSourceTable.projectId, projectId),
        ),
      )
      .limit(1);
    return result.length > 0;
  },

  /**
   * Get count of data sources by category for a project
   */
  async countByCategory(projectId: string, category: DataSourceCategory) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.projectId, projectId),
          eq(dataSourceTable.category, category),
        ),
      );
    return result.length;
  },

  /**
   * Get data sources with specific connection status
   */
  async findByConnectionStatus(
    projectId: string,
    connectionStatus: ConnectionStatus,
  ) {
    const result = await pgDb
      .select()
      .from(dataSourceTable)
      .where(
        and(
          eq(dataSourceTable.projectId, projectId),
          eq(dataSourceTable.connectionStatus, connectionStatus),
        ),
      )
      .orderBy(desc(dataSourceTable.createdAt));
    return result;
  },
};
