import { pgDb as db } from "../pg/db.pg";
import {
  roleTemplate,
  projectRole,
  projectUser,
  projectUserAgent,
} from "../pg/schema.pg";
import { eq, and, like, sql, asc } from "drizzle-orm";

class RoleTemplateRepository {
  async getAllSorted() {
    return await db.select().from(roleTemplate).orderBy(asc(roleTemplate.name));
  }

  async searchByName(search: string) {
    return await db
      .select()
      .from(roleTemplate)
      .where(like(roleTemplate.name, `%${search}%`))
      .orderBy(asc(roleTemplate.name));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(roleTemplate)
      .where(eq(roleTemplate.id, id));
    return result[0] || null;
  }

  async create(data: any) {
    const result = await db.insert(roleTemplate).values(data).returning();
    return result[0];
  }
}

class ProjectRoleRepository {
  async findByProjectId(projectId: string) {
    return await db
      .select()
      .from(projectRole)
      .where(eq(projectRole.projectId, projectId))
      .orderBy(asc(projectRole.name));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(projectRole)
      .where(eq(projectRole.id, id));
    return result[0] || null;
  }

  // async findByProjectAndName(projectId: string, name: string) {
  //   const result = await db
  //     .select()
  //     .from(projectRole)
  //     .where(and(eq(projectRole.projectId, projectId), eq(projectRole.name, name)))
  //   return result[0] || null
  // }

  async findByProjectAndName(projectId: string, name: string) {
    const result = await db
      .select()
      .from(projectRole)
      .where(
        and(
          eq(projectRole.projectId, projectId),
          sql`LOWER(${projectRole.name}) = LOWER(${name})`, // ✅ case-insensitive
        ),
      );

    return result[0] || null;
  }

  async findRolesReportingTo(roleId: string) {
    return await db
      .select()
      .from(projectRole)
      .where(eq(projectRole.reportingToRoleId, roleId))
      .orderBy(asc(projectRole.name));
  }

  async create(data: any) {
    const result = await db.insert(projectRole).values(data).returning();
    return result[0];
  }

  async update(id: string, data: any) {
    const result = await db
      .update(projectRole)
      .set(data)
      .where(eq(projectRole.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string) {
    return await db.delete(projectRole).where(eq(projectRole.id, id));
  }

  async getAssignedUserCount(roleId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectUser)
      .where(eq(projectUser.roleId, roleId));
    return result[0]?.count || 0;
  }
}

class ProjectUserRepository {
  async findByProjectId(projectId: string) {
    return await db
      .select()
      .from(projectUser)
      .where(eq(projectUser.projectId, projectId))
      .orderBy(asc(projectUser.email));
  }

  async findByProjectIdWithRoles(projectId: string) {
    const users = await db
      .select()
      .from(projectUser)
      .where(eq(projectUser.projectId, projectId))
      .orderBy(asc(projectUser.email));

    const roles = await db
      .select()
      .from(projectRole)
      .where(eq(projectRole.projectId, projectId));

    const roleMap = new Map(roles.map((r) => [r.id, r]));
    return users.map((u) => ({
      ...u,
      role: u.roleId ? roleMap.get(u.roleId) : null,
    }));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(projectUser)
      .where(eq(projectUser.id, id));
    return result[0] || null;
  }

  async findByProjectAndEmail(projectId: string, email: string) {
    const result = await db
      .select()
      .from(projectUser)
      .where(
        and(eq(projectUser.projectId, projectId), eq(projectUser.email, email)),
      );
    return result[0] || null;
  }

  async findByEmail(email: string) {
    const result = await db
      .select()
      .from(projectUser)
      .where(and(eq(projectUser.email, email)));
    return result[0] || null;
  }

  async create(data: any) {
    const result = await db.insert(projectUser).values(data).returning();
    return result[0];
  }

  async createMany(items: any[]) {
    if (items.length === 0) return [];
    return await db.insert(projectUser).values(items).returning();
  }

  async update(id: string, data: any) {
    const result = await db
      .update(projectUser)
      .set(data)
      .where(eq(projectUser.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string) {
    return await db.delete(projectUser).where(eq(projectUser.id, id));
  }

  async findUsersByRoleId(roleId: string) {
    const result = await db
      .select()
      .from(projectUser)
      .where(eq(projectUser.roleId, roleId));
    return result;
  }
}

class ProjectUserAgentRepository {
  async findByProjectUserId(userId: string) {
    return await db
      .select()
      .from(projectUserAgent)
      .where(eq(projectUserAgent.projectUserId, userId))
      .orderBy(asc(projectUserAgent.agentId));
  }

  async findByUserAndAgent(userId: string, agentId: string) {
    const result = await db
      .select()
      .from(projectUserAgent)
      .where(
        and(
          eq(projectUserAgent.projectUserId, userId),
          eq(projectUserAgent.agentId, agentId),
        ),
      );
    return result[0] || null;
  }

  async create(data: any) {
    const result = await db.insert(projectUserAgent).values(data).returning();
    return result[0];
  }

  async createMany(items: any[]) {
    if (items.length === 0) return [];
    return await db.insert(projectUserAgent).values(items).returning();
  }

  async delete(id: string) {
    return await db.delete(projectUserAgent).where(eq(projectUserAgent.id, id));
  }

  async deleteByUserAndAgent(userId: string, agentId: string) {
    return await db
      .delete(projectUserAgent)
      .where(
        and(
          eq(projectUserAgent.projectUserId, userId),
          eq(projectUserAgent.agentId, agentId),
        ),
      );
  }

  async countByUser(userId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectUserAgent)
      .where(eq(projectUserAgent.projectUserId, userId));
    return result[0]?.count || 0;
  }
}

export const roleTemplateRepository = new RoleTemplateRepository();
export const projectRoleRepository = new ProjectRoleRepository();
export const projectUserRepository = new ProjectUserRepository();
export const projectUserAgentRepository = new ProjectUserAgentRepository();
