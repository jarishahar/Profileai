import { eq, and, desc } from "drizzle-orm";
import { pgDb } from "../db.pg";
import {
  mcpServer,
  mcpToolCustomization,
  mcpServerCustomization,
  type McpServer,
  type McpServerInsert,
  type McpToolCustomization,
  type McpToolCustomizationInsert,
  type McpServerCustomization,
  type McpServerCustomizationInsert,
} from "../schema.pg";

// ============================================================================
// MCP Server Operations
// ============================================================================

export const mcpServerRepository = {
  /**
   * Create a new MCP server
   */
  async create(data: McpServerInsert): Promise<McpServer> {
    const [server] = await pgDb.insert(mcpServer).values(data).returning();
    return server;
  },

  /**
   * Get an MCP server by ID
   */
  async findById(id: string): Promise<McpServer | undefined> {
    const [server] = await pgDb
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.id, id));
    return server;
  },

  /**
   * Get all MCP servers for a user
   */
  async findByUserId(userId: string): Promise<McpServer[]> {
    return await pgDb
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.userId, userId))
      .orderBy(desc(mcpServer.createdAt));
  },

  /**
   * Get enabled MCP servers for a user
   */
  async findEnabledByUserId(userId: string): Promise<McpServer[]> {
    return await pgDb
      .select()
      .from(mcpServer)
      .where(and(eq(mcpServer.userId, userId), eq(mcpServer.enabled, true)))
      .orderBy(desc(mcpServer.createdAt));
  },

  /**
   * Update an MCP server
   */
  async update(
    id: string,
    data: Partial<Omit<McpServerInsert, "id" | "userId">>,
  ): Promise<McpServer | undefined> {
    const [server] = await pgDb
      .update(mcpServer)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mcpServer.id, id))
      .returning();
    return server;
  },

  /**
   * Delete an MCP server
   */
  async delete(id: string): Promise<void> {
    await pgDb.delete(mcpServer).where(eq(mcpServer.id, id));
  },

  /**
   * Toggle enabled status
   */
  async toggleEnabled(
    id: string,
    enabled: boolean,
  ): Promise<McpServer | undefined> {
    return await this.update(id, { enabled });
  },

  /**
   * Get all MCP servers for an agent
   */
  async findByAgent(agentId: string): Promise<McpServer[]> {
    return await pgDb
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.agentId, agentId))
      .orderBy(desc(mcpServer.createdAt));
  },

  /**
   * Get enabled MCP servers for an agent
   */
  async findEnabledByAgent(agentId: string): Promise<McpServer[]> {
    return await pgDb
      .select()
      .from(mcpServer)
      .where(
        and(eq(mcpServer.agentId, agentId), eq(mcpServer.enabled, true)),
      )
      .orderBy(desc(mcpServer.createdAt));
  },

  /**
   * Get MCP server by agent and data source
   * Used to check if an MCP server already exists for a specific data source
   */
  async findByAgentAndDataSource(
    agentId: string,
    dataSourceId: string,
  ): Promise<McpServer | undefined> {
    const [server] = await pgDb
      .select()
      .from(mcpServer)
      .where(
        and(
          eq(mcpServer.agentId, agentId),
          eq(mcpServer.projectId, mcpServer.projectId), // Placeholder for now
        ),
      );

    // Filter in code since we can't easily search JSON config
    if (server) {
      const config = server.config as any;
      if (config?.dataSourceId === dataSourceId) {
        return server;
      }
    }
    return undefined;
  },

  /**
   * Get MCP servers for a project
   */
  async findByProject(projectId: string): Promise<McpServer[]> {
    return await pgDb
      .select()
      .from(mcpServer)
      .where(eq(mcpServer.projectId, projectId))
      .orderBy(desc(mcpServer.createdAt));
  },

  /**
   * Get MCP servers for project and agent combination
   */
  async findByProjectAndAgent(
    projectId: string,
    agentId: string,
  ): Promise<McpServer[]> {
    return await pgDb
      .select()
      .from(mcpServer)
      .where(
        and(
          eq(mcpServer.projectId, projectId),
          eq(mcpServer.agentId, agentId),
        ),
      )
      .orderBy(desc(mcpServer.createdAt));
  },
};

// ============================================================================
// MCP Tool Customization Operations
// ============================================================================

export const mcpToolCustomizationRepository = {
  /**
   * Create a new tool customization
   */
  async create(
    data: McpToolCustomizationInsert,
  ): Promise<McpToolCustomization> {
    const [customization] = await pgDb
      .insert(mcpToolCustomization)
      .values(data)
      .returning();
    return customization;
  },

  /**
   * Create multiple tool customizations
   */
  async createMany(
    data: McpToolCustomizationInsert[],
  ): Promise<McpToolCustomization[]> {
    if (data.length === 0) return [];
    return await pgDb.insert(mcpToolCustomization).values(data).returning();
  },

  /**
   * Get customization for a specific tool
   */
  async findByUserToolServer(
    userId: string,
    toolName: string,
    mcpServerId: string,
  ): Promise<McpToolCustomization | undefined> {
    const [customization] = await pgDb
      .select()
      .from(mcpToolCustomization)
      .where(
        and(
          eq(mcpToolCustomization.userId, userId),
          eq(mcpToolCustomization.toolName, toolName),
          eq(mcpToolCustomization.mcpServerId, mcpServerId),
        ),
      );
    return customization;
  },

  /**
   * Get all customizations for an MCP server
   */
  async findByServer(mcpServerId: string): Promise<McpToolCustomization[]> {
    return await pgDb
      .select()
      .from(mcpToolCustomization)
      .where(eq(mcpToolCustomization.mcpServerId, mcpServerId));
  },

  /**
   * Update a tool customization
   */
  async update(
    id: string,
    data: Partial<Pick<McpToolCustomizationInsert, "prompt">>,
  ): Promise<McpToolCustomization | undefined> {
    const [customization] = await pgDb
      .update(mcpToolCustomization)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mcpToolCustomization.id, id))
      .returning();
    return customization;
  },

  /**
   * Upsert tool customization
   */
  async upsert(
    data: McpToolCustomizationInsert,
  ): Promise<McpToolCustomization> {
    // Check if exists
    const existing = await this.findByUserToolServer(
      data.userId,
      data.toolName,
      data.mcpServerId,
    );

    if (existing) {
      // Update
      const [updated] = await pgDb
        .update(mcpToolCustomization)
        .set({ prompt: data.prompt, updatedAt: new Date() })
        .where(eq(mcpToolCustomization.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert
      return await this.create(data);
    }
  },

  /**
   * Delete a tool customization
   */
  async delete(id: string): Promise<void> {
    await pgDb
      .delete(mcpToolCustomization)
      .where(eq(mcpToolCustomization.id, id));
  },

  /**
   * Delete all customizations for an MCP server
   */
  async deleteByServer(mcpServerId: string): Promise<void> {
    await pgDb
      .delete(mcpToolCustomization)
      .where(eq(mcpToolCustomization.mcpServerId, mcpServerId));
  },
};

// ============================================================================
// MCP Server Customization Operations
// ============================================================================

export const mcpServerCustomizationRepository = {
  /**
   * Create server customization
   */
  async create(
    data: McpServerCustomizationInsert,
  ): Promise<McpServerCustomization> {
    const [customization] = await pgDb
      .insert(mcpServerCustomization)
      .values(data)
      .returning();
    return customization;
  },

  /**
   * Get customization for a server
   */
  async findByUserAndServer(
    userId: string,
    mcpServerId: string,
  ): Promise<McpServerCustomization | undefined> {
    const [customization] = await pgDb
      .select()
      .from(mcpServerCustomization)
      .where(
        and(
          eq(mcpServerCustomization.userId, userId),
          eq(mcpServerCustomization.mcpServerId, mcpServerId),
        ),
      );
    return customization;
  },

  /**
   * Update server customization
   */
  async update(
    id: string,
    data: Partial<Pick<McpServerCustomizationInsert, "prompt">>,
  ): Promise<McpServerCustomization | undefined> {
    const [customization] = await pgDb
      .update(mcpServerCustomization)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mcpServerCustomization.id, id))
      .returning();
    return customization;
  },

  /**
   * Upsert server customization
   */
  async upsert(
    data: McpServerCustomizationInsert,
  ): Promise<McpServerCustomization> {
    // Check if exists
    const existing = await this.findByUserAndServer(
      data.userId,
      data.mcpServerId,
    );

    if (existing) {
      // Update
      const [updated] = await pgDb
        .update(mcpServerCustomization)
        .set({ prompt: data.prompt, updatedAt: new Date() })
        .where(eq(mcpServerCustomization.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert
      return await this.create(data);
    }
  },

  /**
   * Delete server customization
   */
  async delete(id: string): Promise<void> {
    await pgDb
      .delete(mcpServerCustomization)
      .where(eq(mcpServerCustomization.id, id));
  },

  /**
   * Delete customization by server
   */
  async deleteByServer(mcpServerId: string): Promise<void> {
    await pgDb
      .delete(mcpServerCustomization)
      .where(eq(mcpServerCustomization.mcpServerId, mcpServerId));
  },
};
