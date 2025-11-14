import { eq, and, desc } from "drizzle-orm";
import { pgDb } from "@/lib/db/pg/db.pg";
import {
  smartAgent,
  agentToolAssignment,
  type SmartAgent,
  type SmartAgentInsert,
  type AgentToolAssignment,
  type AgentToolAssignmentInsert,
} from "@/lib/db/pg/schema.pg";

// ============================================================================
// Smart Agent Operations
// ============================================================================

export const smartAgentRepository = {
  /**
   * Create a new smart agent
   */
  async create(data: SmartAgentInsert): Promise<SmartAgent> {
    const [agent] = await pgDb.insert(smartAgent).values(data).returning();
    return agent;
  },

  /**
   * Get agent by ID
   */
  async findById(id: string): Promise<SmartAgent | undefined> {
    const [agent] = await pgDb
      .select()
      .from(smartAgent)
      .where(eq(smartAgent.id, id));
    return agent;
  },

  /**
   * Get all agents for a project
   */
  async findByProject(projectId: string): Promise<SmartAgent[]> {
    return await pgDb
      .select()
      .from(smartAgent)
      .where(eq(smartAgent.projectId, projectId))
      .orderBy(desc(smartAgent.createdAt));
  },

  /**
   * Get all agents created by a user
   */
  async findByUser(userId: string): Promise<SmartAgent[]> {
    return await pgDb
      .select()
      .from(smartAgent)
      .where(eq(smartAgent.createdBy, userId))
      .orderBy(desc(smartAgent.createdAt));
  },

  /**
   * Get agents by project and status
   */
  async findByProjectAndStatus(
    projectId: string,
    status: string,
  ): Promise<SmartAgent[]> {
    return await pgDb
      .select()
      .from(smartAgent)
      .where(
        and(eq(smartAgent.projectId, projectId), eq(smartAgent.status, status)),
      )
      .orderBy(desc(smartAgent.createdAt));
  },

  /**
   * Update an agent
   */
  async update(
    id: string,
    data: Partial<
      Omit<SmartAgentInsert, "id" | "createdAt" | "projectId" | "createdBy">
    >,
  ): Promise<SmartAgent | undefined> {
    const [agent] = await pgDb
      .update(smartAgent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smartAgent.id, id))
      .returning();
    return agent;
  },

  /**
   * Delete an agent
   */
  async delete(id: string): Promise<void> {
    await pgDb.delete(smartAgent).where(eq(smartAgent.id, id));
  },

  /**
   * Archive an agent
   */
  async archive(id: string): Promise<SmartAgent | undefined> {
    const [agent] = await pgDb
      .update(smartAgent)
      .set({
        status: "archived",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(smartAgent.id, id))
      .returning();
    return agent;
  },
};

// ============================================================================
// Agent Tool Assignment Operations
// ============================================================================

export const agentToolAssignmentRepository = {
  /**
   * Create a tool assignment
   */
  async create(data: AgentToolAssignmentInsert): Promise<AgentToolAssignment> {
    const [assignment] = await pgDb
      .insert(agentToolAssignment)
      .values(data)
      .returning();
    return assignment;
  },

  /**
   * Create multiple tool assignments
   */
  async createMany(
    data: AgentToolAssignmentInsert[],
  ): Promise<AgentToolAssignment[]> {
    if (data.length === 0) return [];
    return await pgDb.insert(agentToolAssignment).values(data).returning();
  },

  /**
   * Get all tool assignments for an agent
   */
  async findByAgent(agentId: string): Promise<AgentToolAssignment[]> {
    return await pgDb
      .select()
      .from(agentToolAssignment)
      .where(eq(agentToolAssignment.agentId, agentId));
  },

  /**
   * Get all agents using a specific tool
   */
  async findByTool(toolId: string): Promise<AgentToolAssignment[]> {
    return await pgDb
      .select()
      .from(agentToolAssignment)
      .where(eq(agentToolAssignment.toolId, toolId));
  },

  /**
   * Delete all tool assignments for an agent
   */
  async deleteByAgent(agentId: string): Promise<void> {
    await pgDb
      .delete(agentToolAssignment)
      .where(eq(agentToolAssignment.agentId, agentId));
  },

  /**
   * Delete a specific tool assignment
   */
  async delete(id: string): Promise<void> {
    await pgDb
      .delete(agentToolAssignment)
      .where(eq(agentToolAssignment.id, id));
  },
};

// Agent Tool Assignment Operations
// ============================================================================
