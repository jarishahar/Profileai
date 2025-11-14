import { and, eq, inArray } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import {
  tool,
  toolExecutionLog,
  agentToolAssignment,
  Tool,
  ToolInsert,
  ToolExecutionLog,
  ToolExecutionLogInsert,
  AgentToolAssignment,
  AgentToolAssignmentInsert,
} from "../schema.pg";

/**
 * Tool Repository - Handles all tool-related database operations
 * Includes tools, execution logs, and agent-tool assignments
 */
export const toolRepository = {
  // ============================================================================
  // TOOL OPERATIONS
  // ============================================================================

  /**
   * Get all tools for a project
   */
  async getToolsByProject(projectId: string): Promise<Tool[]> {
    return await db.select().from(tool).where(eq(tool.projectId, projectId));
  },

  /**
   * Get all active tools for a project
   */
  async getActiveToolsByProject(projectId: string): Promise<Tool[]> {
    return await db
      .select()
      .from(tool)
      .where(and(eq(tool.projectId, projectId), eq(tool.status, "active")));
  },

  /**
   * Get a single tool by ID
   */
  async getToolById(toolId: string): Promise<Tool | null> {
    const result = await db.select().from(tool).where(eq(tool.id, toolId));
    return result[0] ?? null;
  },

  /**
   * Get tool by name and project
   */
  async getToolByName(projectId: string, name: string): Promise<Tool | null> {
    const result = await db
      .select()
      .from(tool)
      .where(and(eq(tool.projectId, projectId), eq(tool.name, name)));
    return result[0] ?? null;
  },

  /**
   * Get tools by category
   */
  async getToolsByCategory(
    projectId: string,
    category: string,
  ): Promise<Tool[]> {
    return await db
      .select()
      .from(tool)
      .where(and(eq(tool.projectId, projectId), eq(tool.category, category)));
  },

  /**
   * Create a new tool
   */
  async createTool(data: ToolInsert): Promise<Tool> {
    const result = await db.insert(tool).values(data).returning();
    return result[0]!;
  },

  /**
   * Update a tool
   */
  async updateTool(
    toolId: string,
    data: Partial<ToolInsert>,
  ): Promise<Tool | null> {
    const result = await db
      .update(tool)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tool.id, toolId))
      .returning();
    return result[0] ?? null;
  },

  /**
   * Update tool status
   */
  async updateToolStatus(
    toolId: string,
    status: "draft" | "active" | "deprecated",
  ): Promise<Tool | null> {
    return await toolRepository.updateTool(toolId, { status });
  },

  /**
   * Update AI-SDK format validation status
   */
  async updateAiSdkValidation(
    toolId: string,
    isValid: boolean,
  ): Promise<Tool | null> {
    return await toolRepository.updateTool(toolId, {
      aiSdkFormatValid: isValid,
    });
  },

  /**
   * Increment tool version
   */
  async incrementToolVersion(toolId: string): Promise<Tool | null> {
    const currentTool = await toolRepository.getToolById(toolId);
    if (!currentTool) return null;
    return await toolRepository.updateTool(toolId, {
      version: (currentTool.version ?? 0) + 1,
    });
  },

  /**
   * Soft delete a tool (archive)
   */
  async archiveTool(toolId: string): Promise<Tool | null> {
    return await toolRepository.updateTool(toolId, {
      archivedAt: new Date(),
      status: "deprecated",
    });
  },

  /**
   * Delete a tool permanently
   */
  async deleteTool(toolId: string): Promise<boolean> {
    const result = await db.delete(tool).where(eq(tool.id, toolId));
    return (result.rowCount ?? 0) > 0;
  },

  // ============================================================================
  // TOOL EXECUTION LOG OPERATIONS
  // ============================================================================

  /**
   * Get execution logs for a tool
   */
  async getExecutionLogsByTool(
    toolId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ToolExecutionLog[]> {
    return await db
      .select()
      .from(toolExecutionLog)
      .where(eq(toolExecutionLog.toolId, toolId))
      .limit(limit)
      .offset(offset);
  },

  /**
   * Get test execution logs for a tool
   */
  async getTestExecutionLogs(
    toolId: string,
    limit: number = 50,
  ): Promise<ToolExecutionLog[]> {
    return await db
      .select()
      .from(toolExecutionLog)
      .where(
        and(
          eq(toolExecutionLog.toolId, toolId),
          eq(toolExecutionLog.executionType, "test"),
        ),
      )
      .limit(limit);
  },

  /**
   * Get execution logs for an agent
   */
  async getExecutionLogsByAgent(
    agentId: string,
    limit: number = 100,
  ): Promise<ToolExecutionLog[]> {
    return await db
      .select()
      .from(toolExecutionLog)
      .where(eq(toolExecutionLog.agentId, agentId))
      .limit(limit);
  },

  /**
   * Get execution logs for a conversation
   */
  async getExecutionLogsByConversation(
    conversationId: string,
  ): Promise<ToolExecutionLog[]> {
    return await db
      .select()
      .from(toolExecutionLog)
      .where(eq(toolExecutionLog.conversationId, conversationId));
  },

  /**
   * Create an execution log
   */
  async createExecutionLog(
    data: ToolExecutionLogInsert,
  ): Promise<ToolExecutionLog> {
    const result = await db.insert(toolExecutionLog).values(data).returning();
    return result[0]!;
  },

  /**
   * Get execution log by ID
   */
  async getExecutionLogById(logId: string): Promise<ToolExecutionLog | null> {
    const result = await db
      .select()
      .from(toolExecutionLog)
      .where(eq(toolExecutionLog.id, logId));
    return result[0] ?? null;
  },

  /**
   * Get execution logs by status
   */
  async getExecutionLogsByStatus(
    status: "success" | "failure" | "timeout" | "error",
    limit: number = 50,
  ): Promise<ToolExecutionLog[]> {
    return await db
      .select()
      .from(toolExecutionLog)
      .where(eq(toolExecutionLog.status, status))
      .limit(limit);
  },

  /**
   * Update execution log status
   */
  async updateExecutionLogStatus(
    logId: string,
    status: "success" | "failure" | "timeout" | "error",
    result?: Record<string, any>,
    error?: string,
  ): Promise<ToolExecutionLog | null> {
    const updates: any = { status };
    if (result) updates.outputResult = result;
    if (error) updates.errorMessage = error;

    const execResult = await db
      .update(toolExecutionLog)
      .set(updates)
      .where(eq(toolExecutionLog.id, logId))
      .returning();
    return execResult[0] ?? null;
  },

  // ============================================================================
  // AGENT-TOOL ASSIGNMENT OPERATIONS
  // ============================================================================

  /**
   * Get tools assigned to an agent
   */
  async getToolsByAgent(agentId: string): Promise<AgentToolAssignment[]> {
    return await db
      .select()
      .from(agentToolAssignment)
      .where(eq(agentToolAssignment.agentId, agentId));
  },

  /**
   * Get all tools with full details assigned to an agent
   */
  async getAgentToolsWithDetails(agentId: string): Promise<
    Array<{
      assignment: AgentToolAssignment;
      tool: Tool;
    }>
  > {
    const assignments = await toolRepository.getToolsByAgent(agentId);
    const toolDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const toolData = await toolRepository.getToolById(assignment.toolId);
        return { assignment, tool: toolData! };
      }),
    );
    return toolDetails.filter((item) => item.tool !== null);
  },

  /**
   * Get agents using a specific tool
   */
  async getAgentsByTool(toolId: string): Promise<AgentToolAssignment[]> {
    return await db
      .select()
      .from(agentToolAssignment)
      .where(eq(agentToolAssignment.toolId, toolId));
  },

  /**
   * Get a specific assignment
   */
  async getAssignment(
    agentId: string,
    toolId: string,
  ): Promise<AgentToolAssignment | null> {
    const result = await db
      .select()
      .from(agentToolAssignment)
      .where(
        and(
          eq(agentToolAssignment.agentId, agentId),
          eq(agentToolAssignment.toolId, toolId),
        ),
      );
    return result[0] ?? null;
  },

  /**
   * Assign a tool to an agent
   */
  async assignToolToAgent(
    data: AgentToolAssignmentInsert,
  ): Promise<AgentToolAssignment> {
    const result = await db
      .insert(agentToolAssignment)
      .values(data)
      .returning();
    return result[0]!;
  },

  /**
   * Update a tool assignment
   */
  async updateAssignment(
    agentId: string,
    toolId: string,
    data: Partial<AgentToolAssignmentInsert>,
  ): Promise<AgentToolAssignment | null> {
    const result = await db
      .update(agentToolAssignment)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(agentToolAssignment.agentId, agentId),
          eq(agentToolAssignment.toolId, toolId),
        ),
      )
      .returning();
    return result[0] ?? null;
  },

  /**
   * Update assignment access level
   */
  async updateAssignmentAccessLevel(
    agentId: string,
    toolId: string,
    accessLevel: "read" | "write" | "execute",
  ): Promise<AgentToolAssignment | null> {
    return await toolRepository.updateAssignment(agentId, toolId, {
      accessLevel,
    });
  },

  /**
   * Update assignment rate limit
   */
  async updateAssignmentRateLimit(
    agentId: string,
    toolId: string,
    rateLimit: number,
  ): Promise<AgentToolAssignment | null> {
    return await toolRepository.updateAssignment(agentId, toolId, {
      rateLimit,
    });
  },

  /**
   * Revoke tool access from agent
   */
  async revokeToolAccess(agentId: string, toolId: string): Promise<boolean> {
    const result = await db
      .delete(agentToolAssignment)
      .where(
        and(
          eq(agentToolAssignment.agentId, agentId),
          eq(agentToolAssignment.toolId, toolId),
        ),
      );
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Revoke all tools from agent
   */
  async revokeAllTools(agentId: string): Promise<boolean> {
    const result = await db
      .delete(agentToolAssignment)
      .where(eq(agentToolAssignment.agentId, agentId));
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Remove all agents from a tool
   */
  async removeAllAgentsFromTool(toolId: string): Promise<boolean> {
    const result = await db
      .delete(agentToolAssignment)
      .where(eq(agentToolAssignment.toolId, toolId));
    return (result.rowCount ?? 0) > 0;
  },

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Get multiple tools by IDs
   */
  async getToolsByIds(toolIds: string[]): Promise<Tool[]> {
    if (toolIds.length === 0) return [];
    return await db.select().from(tool).where(inArray(tool.id, toolIds));
  },

  /**
   * Assign multiple tools to an agent
   */
  async assignToolsToAgent(
    agentId: string,
    toolIds: string[],
  ): Promise<AgentToolAssignment[]> {
    if (toolIds.length === 0) return [];
    const assignments = toolIds.map((toolId) => ({
      agentId,
      toolId,
      accessLevel: "execute" as const,
    }));
    const result = await db
      .insert(agentToolAssignment)
      .values(assignments)
      .returning();
    return result;
  },

  /**
   * Get tool statistics for a project
   */
  async getToolStats(projectId: string): Promise<{
    total: number;
    active: number;
    draft: number;
    deprecated: number;
  }> {
    const tools = await toolRepository.getToolsByProject(projectId);
    return {
      total: tools.length,
      active: tools.filter((t) => t.status === "active").length,
      draft: tools.filter((t) => t.status === "draft").length,
      deprecated: tools.filter((t) => t.status === "deprecated").length,
    };
  },

  /**
   * Get execution statistics for a tool
   */
  async getExecutionStats(toolId: string): Promise<{
    total: number;
    success: number;
    failure: number;
    timeout: number;
    error: number;
    avgExecutionTimeMs: number;
  }> {
    const logs = await db
      .select()
      .from(toolExecutionLog)
      .where(eq(toolExecutionLog.toolId, toolId));

    const avgTime =
      logs.length > 0
        ? Math.round(
            logs.reduce((sum, log) => sum + (log.executionTimeMs ?? 0), 0) /
              logs.length,
          )
        : 0;

    return {
      total: logs.length,
      success: logs.filter((l) => l.status === "success").length,
      failure: logs.filter((l) => l.status === "failure").length,
      timeout: logs.filter((l) => l.status === "timeout").length,
      error: logs.filter((l) => l.status === "error").length,
      avgExecutionTimeMs: avgTime,
    };
  },
};
