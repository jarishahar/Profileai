/**
 * Agent Guardrails Repository
 * CRUD operations for agent role access and guardrails configuration
 */

import { eq, and } from "drizzle-orm";
import { pgDb } from "../pg/db.pg";
import {
  agentRoleAccess,
  agentGuardrailsConfig,
  type AgentRoleAccess,
  type AgentRoleAccessInsert,
  type AgentGuardrailsConfig,
  type AgentGuardrailsConfigInsert,
} from "../pg/schema.pg";

/**
 * Create a new role access mapping
 */
export async function createRoleAccess(
  data: AgentRoleAccessInsert,
): Promise<AgentRoleAccess> {
  const [result] = await pgDb.insert(agentRoleAccess).values(data).returning();
  return result;
}

/**
 * Delete a role access mapping
 */
export async function deleteRoleAccess(
  agentId: string,
  roleId: string,
): Promise<void> {
  await pgDb
    .delete(agentRoleAccess)
    .where(
      and(
        eq(agentRoleAccess.agentId, agentId),
        eq(agentRoleAccess.roleId, roleId),
      ),
    );
}

/**
 * Get all role access mappings for an agent
 */
export async function getRoleAccessByAgent(
  agentId: string,
): Promise<AgentRoleAccess[]> {
  return pgDb
    .select()
    .from(agentRoleAccess)
    .where(eq(agentRoleAccess.agentId, agentId));
}

/**
 * Get all role access mappings for a project
 */
export async function getRoleAccessByProject(
  projectId: string,
): Promise<AgentRoleAccess[]> {
  return pgDb
    .select()
    .from(agentRoleAccess)
    .where(eq(agentRoleAccess.projectId, projectId));
}

/**
 * Check if a role has access to an agent
 */
export async function checkRoleAccess(
  agentId: string,
  roleId: string,
): Promise<boolean> {
  const result = await pgDb
    .select()
    .from(agentRoleAccess)
    .where(
      and(
        eq(agentRoleAccess.agentId, agentId),
        eq(agentRoleAccess.roleId, roleId),
      ),
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Upsert guardrails configuration for an agent-datasource pair
 */
export async function updateGuardrailsConfig(
  data: AgentGuardrailsConfigInsert,
): Promise<AgentGuardrailsConfig> {
  // Check if config already exists
  const existing = await pgDb
    .select()
    .from(agentGuardrailsConfig)
    .where(
      and(
        eq(agentGuardrailsConfig.agentId, data.agentId),
        eq(agentGuardrailsConfig.dataSourceId, data.dataSourceId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    const [updated] = await pgDb
      .update(agentGuardrailsConfig)
      .set({
        guardrailsConfig: data.guardrailsConfig,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(agentGuardrailsConfig.agentId, data.agentId),
          eq(agentGuardrailsConfig.dataSourceId, data.dataSourceId),
        ),
      )
      .returning();

    return updated;
  } else {
    // Insert new
    const [created] = await pgDb
      .insert(agentGuardrailsConfig)
      .values(data)
      .returning();
    return created;
  }
}

/**
 * Get guardrails configuration for an agent-datasource pair
 */
export async function getGuardrailsConfig(
  agentId: string,
  dataSourceId: string,
): Promise<AgentGuardrailsConfig | undefined> {
  const [result] = await pgDb
    .select()
    .from(agentGuardrailsConfig)
    .where(
      and(
        eq(agentGuardrailsConfig.agentId, agentId),
        eq(agentGuardrailsConfig.dataSourceId, dataSourceId),
      ),
    )
    .limit(1);

  return result;
}

/**
 * Get all guardrails configurations for an agent
 */
export async function getGuardrailsConfigByAgent(
  agentId: string,
): Promise<AgentGuardrailsConfig[]> {
  return pgDb
    .select()
    .from(agentGuardrailsConfig)
    .where(eq(agentGuardrailsConfig.agentId, agentId));
}

/**
 * Delete guardrails configuration for an agent-datasource pair
 */
export async function deleteGuardrailsConfig(
  agentId: string,
  dataSourceId: string,
): Promise<void> {
  await pgDb
    .delete(agentGuardrailsConfig)
    .where(
      and(
        eq(agentGuardrailsConfig.agentId, agentId),
        eq(agentGuardrailsConfig.dataSourceId, dataSourceId),
      ),
    );
}

/**
 * Get all guardrails configurations for a datasource
 */
export async function getGuardrailsConfigByDataSource(
  dataSourceId: string,
): Promise<AgentGuardrailsConfig[]> {
  return pgDb
    .select()
    .from(agentGuardrailsConfig)
    .where(eq(agentGuardrailsConfig.dataSourceId, dataSourceId));
}
