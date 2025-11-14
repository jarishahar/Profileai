/**
 * Agent Data Source Repository
 * Manages data source assignments to agents with tool selections
 */

import { eq, and } from "drizzle-orm";
import { pgDb } from "../pg/db.pg";
import { agentDataSource } from "../pg/schema.pg";
import type { AgentDataSource, AgentDataSourceInsert } from "../pg/schema.pg";
import { deleteGuardrailsConfig } from "./agent-guardrails.repository.pg";

export const agentDataSourceRepository = {
  /**
   * Assign a data source to an agent with tool selections
   */
  async create(data: AgentDataSourceInsert): Promise<AgentDataSource> {
    const result = await pgDb.insert(agentDataSource).values(data).returning();
    return result[0];
  },

  /**
   * Get all data sources assigned to an agent
   */
  async findByAgentId(agentId: string): Promise<AgentDataSource[]> {
    return pgDb
      .select()
      .from(agentDataSource)
      .where(eq(agentDataSource.agentId, agentId))
      .orderBy(agentDataSource.createdAt);
  },

  /**
   * Get a specific agent-data source assignment
   */
  async findByAgentAndDataSource(
    agentId: string,
    dataSourceId: string,
  ): Promise<AgentDataSource | null> {
    const result = await pgDb
      .select()
      .from(agentDataSource)
      .where(
        and(
          eq(agentDataSource.agentId, agentId),
          eq(agentDataSource.dataSourceId, dataSourceId),
        ),
      );
    return result[0] || null;
  },

  /**
   * Get all agents using a data source
   */
  async findByDataSourceId(dataSourceId: string): Promise<AgentDataSource[]> {
    return pgDb
      .select()
      .from(agentDataSource)
      .where(eq(agentDataSource.dataSourceId, dataSourceId))
      .orderBy(agentDataSource.createdAt);
  },

  /**
   * Update tool selections for a data source assigned to an agent
   */
  async updateSelectedTools(
    agentId: string,
    dataSourceId: string,
    selectedTools: string[],
  ): Promise<AgentDataSource | null> {
    const result = await pgDb
      .update(agentDataSource)
      .set({
        selectedTools,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentDataSource.agentId, agentId),
          eq(agentDataSource.dataSourceId, dataSourceId),
        ),
      )
      .returning();
    return result[0] || null;
  },

  /**
   * Delete a data source assignment from an agent
   */
  async delete(agentId: string, dataSourceId: string): Promise<boolean> {
    const result = await pgDb
      .delete(agentDataSource)
      .where(
        and(
          eq(agentDataSource.agentId, agentId),
          eq(agentDataSource.dataSourceId, dataSourceId),
        ),
      )
      .returning();
    return result.length > 0;
  },

  /**
   * Delete all data source assignments from an agent
   */
  async deleteByAgentId(agentId: string): Promise<number> {
    const result = await pgDb
      .delete(agentDataSource)
      .where(eq(agentDataSource.agentId, agentId))
      .returning();
    return result.length;
  },

  /**
   * Delete all agent assignments for a data source
   */
  async deleteByDataSourceId(dataSourceId: string): Promise<number> {
    const result = await pgDb
      .delete(agentDataSource)
      .where(eq(agentDataSource.dataSourceId, dataSourceId))
      .returning();
    return result.length;
  },

  /**
   * Bulk assign data sources to an agent (for create/update agent form)
   * Handles additions, updates, and deletions in a single operation
   */
  async bulkUpdateAssignments(
    agentId: string,
    assignments: Array<{ dataSourceId: string; selectedTools: string[] }>,
  ): Promise<AgentDataSource[]> {
    // Get existing assignments
    const existing = await this.findByAgentId(agentId);
    const existingMap = new Map(existing.map((a) => [a.dataSourceId, a]));

    // Determine what to add, update, and delete
    const newMap = new Map(assignments.map((a) => [a.dataSourceId, a]));
    const toAdd: Array<{ dataSourceId: string; selectedTools: string[] }> = [];
    const toUpdate: Array<{ dataSourceId: string; selectedTools: string[] }> =
      [];
    const toDelete: string[] = [];

    // Find additions and updates
    for (const [dataSourceId, assignment] of newMap) {
      if (existingMap.has(dataSourceId)) {
        toUpdate.push(assignment);
      } else {
        toAdd.push(assignment);
      }
    }

    // Find deletions
    for (const [dataSourceId] of existingMap) {
      if (!newMap.has(dataSourceId)) {
        toDelete.push(dataSourceId);
      }
    }

    // Execute operations
    const results: AgentDataSource[] = [];

    // Delete unassigned - also clean up guardrails configuration
    for (const dataSourceId of toDelete) {
      await this.delete(agentId, dataSourceId);
      // Clean up guardrails configuration for removed data source
      await deleteGuardrailsConfig(agentId, dataSourceId);
    }

    // Add new
    for (const { dataSourceId, selectedTools } of toAdd) {
      const created = await this.create({
        agentId,
        dataSourceId,
        selectedTools,
      });
      results.push(created);
    }

    // Update existing
    for (const { dataSourceId, selectedTools } of toUpdate) {
      const updated = await this.updateSelectedTools(
        agentId,
        dataSourceId,
        selectedTools,
      );
      if (updated) {
        results.push(updated);
      }
    }

    return results;
  },

  /**
   * Find assignment by agent ID and data source ID
   */
  async findByAgentAndDataSourceId(
    agentId: string,
    dataSourceId: string,
  ): Promise<AgentDataSource | null> {
    const result = await pgDb
      .select()
      .from(agentDataSource)
      .where(
        and(
          eq(agentDataSource.agentId, agentId),
          eq(agentDataSource.dataSourceId, dataSourceId),
        ),
      );
    return result[0] || null;
  },

  /**
   * Update TOON schema for an agent data source assignment
   */
  async updateSchema(
    assignmentId: string,
    toonSchema: string,
  ): Promise<AgentDataSource> {
    const result = await pgDb
      .update(agentDataSource)
      .set({
        toonSchema,
        updatedAt: new Date(),
      })
      .where(eq(agentDataSource.id, assignmentId))
      .returning();
    return result[0];
  },

  /**
   * Get new assignments (those that exist in newAssignments but not in existing)
   * Used to identify which assignments need schema generation
   */
  getNewAssignments(
    existing: AgentDataSource[],
    newAssignments: Array<{ dataSourceId: string; selectedTools: string[] }>,
  ): Array<{ dataSourceId: string; selectedTools: string[] }> {
    const existingMap = new Map(existing.map((a) => [a.dataSourceId, a]));
    return newAssignments.filter(
      (assignment) => !existingMap.has(assignment.dataSourceId),
    );
  },
};

