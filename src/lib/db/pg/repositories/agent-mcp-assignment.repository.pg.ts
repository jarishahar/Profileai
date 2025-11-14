import { eq, and } from "drizzle-orm";
import { pgDb } from "@/lib/db/pg/db.pg";
import {
  agentMcpServerAssignment,
  type AgentMcpServerAssignment,
  type AgentMcpServerAssignmentInsert,
} from "@/lib/db/pg/schema.pg";

// ============================================================================
// Agent-MCP Server Assignment Operations
// ============================================================================

export const agentMcpAssignmentRepository = {
  /**
   * Create an MCP server assignment
   */
  async create(
    data: AgentMcpServerAssignmentInsert,
  ): Promise<AgentMcpServerAssignment> {
    const [assignment] = await pgDb
      .insert(agentMcpServerAssignment)
      .values(data)
      .returning();
    return assignment;
  },

  /**
   * Create multiple MCP server assignments
   */
  async createMany(
    data: AgentMcpServerAssignmentInsert[],
  ): Promise<AgentMcpServerAssignment[]> {
    if (data.length === 0) return [];
    return await pgDb.insert(agentMcpServerAssignment).values(data).returning();
  },

  /**
   * Get all MCP assignments for an agent
   */
  async findByAgent(agentId: string): Promise<AgentMcpServerAssignment[]> {
    return await pgDb
      .select()
      .from(agentMcpServerAssignment)
      .where(eq(agentMcpServerAssignment.agentId, agentId));
  },

  /**
   * Get all agents using a specific MCP server
   */
  async findByMcpServer(
    mcpServerId: string,
  ): Promise<AgentMcpServerAssignment[]> {
    return await pgDb
      .select()
      .from(agentMcpServerAssignment)
      .where(eq(agentMcpServerAssignment.mcpServerId, mcpServerId));
  },

  /**
   * Get a specific assignment
   */
  async findByAgentAndMcpServer(
    agentId: string,
    mcpServerId: string,
  ): Promise<AgentMcpServerAssignment | undefined> {
    const [assignment] = await pgDb
      .select()
      .from(agentMcpServerAssignment)
      .where(
        and(
          eq(agentMcpServerAssignment.agentId, agentId),
          eq(agentMcpServerAssignment.mcpServerId, mcpServerId),
        ),
      );
    return assignment;
  },

  /**
   * Update an MCP server assignment
   */
  async update(
    id: string,
    data: Partial<
      Omit<
        AgentMcpServerAssignmentInsert,
        "id" | "agentId" | "mcpServerId" | "createdAt"
      >
    >,
  ): Promise<AgentMcpServerAssignment | undefined> {
    const [assignment] = await pgDb
      .update(agentMcpServerAssignment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agentMcpServerAssignment.id, id))
      .returning();
    return assignment;
  },

  /**
   * Delete all MCP assignments for an agent
   */
  async deleteByAgent(agentId: string): Promise<void> {
    await pgDb
      .delete(agentMcpServerAssignment)
      .where(eq(agentMcpServerAssignment.agentId, agentId));
  },

  /**
   * Delete all assignments for an MCP server
   */
  async deleteByMcpServer(mcpServerId: string): Promise<void> {
    await pgDb
      .delete(agentMcpServerAssignment)
      .where(eq(agentMcpServerAssignment.mcpServerId, mcpServerId));
  },

  /**
   * Delete a specific assignment
   */
  async delete(id: string): Promise<void> {
    await pgDb
      .delete(agentMcpServerAssignment)
      .where(eq(agentMcpServerAssignment.id, id));
  },

  /**
   * Delete a specific agent-MCP assignment
   */
  async deleteByAgentAndMcpServer(
    agentId: string,
    mcpServerId: string,
  ): Promise<void> {
    await pgDb
      .delete(agentMcpServerAssignment)
      .where(
        and(
          eq(agentMcpServerAssignment.agentId, agentId),
          eq(agentMcpServerAssignment.mcpServerId, mcpServerId),
        ),
      );
  },
};
