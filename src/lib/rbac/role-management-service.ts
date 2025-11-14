import {
  projectRoleRepository,
  projectUserRepository,
  projectUserAgentRepository,
} from "../db/repositories/rbac-repositories";

class HierarchyValidationService {
  private visited = new Set<string>();

  async wouldCreateCycle(
    roleId: string,
    potentialParentId: string
  ): Promise<boolean> {
    this.visited.clear();
    return await this.hasCycle(potentialParentId, roleId);
  }

  private async hasCycle(current: string, target: string): Promise<boolean> {
    if (current === target) return true;
    if (this.visited.has(current)) return false;

    this.visited.add(current);
    const role = await projectRoleRepository.findById(current);

    if (role?.reportingToRoleId) {
      return await this.hasCycle(role.reportingToRoleId, target);
    }

    return false;
  }
}

class RoleDeduplicationService {
  calculateSimilarity(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    if (aLower === bLower) return 1;

    let matches = 0;
    const minLen = Math.min(aLower.length, bLower.length);
    for (let i = 0; i < minLen; i++) {
      if (aLower[i] === bLower[i]) matches++;
    }
    return matches / Math.max(aLower.length, bLower.length);
  }

  async findDuplicates(
    projectId: string,
    roleName: string,
    threshold: number = 0.7
  ): Promise<any[]> {
    const allRoles = await projectRoleRepository.findByProjectId(projectId);
    return allRoles.filter(
      (role) =>
        this.calculateSimilarity(role.name, roleName) >= threshold &&
        role.name !== roleName
    );
  }
}

class RoleManagementService {
  async createRoleFromTemplate(projectId: string, data: any) {
    const template = data.templateId
      ? await (
          await import("../db/repositories/rbac-repositories")
        ).roleTemplateRepository.findById(data.templateId)
      : null;

    const roleData = {
      projectId,
      name: data.name,
      description: data.description || "",
      permissions: template?.permissionsTemplate || {},
      reportingToRoleId: data.reportingToRoleId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await projectRoleRepository.create(roleData);
  }

  async createCustomRole(projectId: string, data: any) {
    const roleData = {
      projectId,
      name: data.name,
      description: data.description || "",
      permissions: data.permissions || {},
      reportingToRoleId: data.reportingToRoleId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return await projectRoleRepository.create(roleData);
  }

  async updateRoleHierarchy(roleId: string, reportingToRoleId: string | null) {
    if (reportingToRoleId) {
      const validator = new HierarchyValidationService();
      const wouldCycle = await validator.wouldCreateCycle(
        roleId,
        reportingToRoleId
      );
      if (wouldCycle) throw new Error("Circular dependency detected");
    }

    return await projectRoleRepository.update(roleId, { reportingToRoleId });
  }

  async deleteRole(roleId: string) {
    const directReports = await projectRoleRepository.findRolesReportingTo(
      roleId
    );
    for (const report of directReports) {
      await projectRoleRepository.update(report.id, {
        reportingToRoleId: null,
      });
    }

    return await projectRoleRepository.delete(roleId);
  }

  async createUser(projectId: string, data: any) {
    const userData = {
      projectId,
      email: data.email,
      name: data.name,
      roleId: data.roleId,
      uniqueId: data.uniqueId,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: data.password,
    };

    return await projectUserRepository.create(userData);
  }

  async updateUserRole(userId: string, roleId: string) {
    return await projectUserRepository.update(userId, {
      roleId,
      updatedAt: new Date(),
    });
  }

  async deleteUser(userId: string) {
    return await projectUserRepository.delete(userId);
  }

  async assignAgentToUser(userId: string, agentId: string) {
    const existing = await projectUserAgentRepository.findByUserAndAgent(
      userId,
      agentId
    );
    if (existing) return existing;

    return await projectUserAgentRepository.create({
      projectUserId: userId,
      agentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async bulkAssignAgents(userId: string, agentIds: string[]) {
    const existing = await projectUserAgentRepository.findByProjectUserId(
      userId
    );
    const existingIds = new Set(existing.map((a) => a.agentId));
    const newIds = new Set(agentIds);

    // Find agents to add and remove
    const toAdd = agentIds
      .filter((id) => !existingIds.has(id))
      .map((agentId) => ({
        projectUserId: userId,
        agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const toRemove = existing.filter((a) => !newIds.has(a.agentId));

    // Delete unassigned agents
    for (const agent of toRemove) {
      await projectUserAgentRepository.deleteByUserAndAgent(
        userId,
        agent.agentId
      );
    }

    // Add new agents
    if (toAdd.length === 0) {
      // Return the remaining agents after removal
      return await projectUserAgentRepository.findByProjectUserId(userId);
    }

    await projectUserAgentRepository.createMany(toAdd);
    return await projectUserAgentRepository.findByProjectUserId(userId);
  }

  async revokeAgentAccess(userId: string, agentId: string) {
    return await projectUserAgentRepository.deleteByUserAndAgent(
      userId,
      agentId
    );
  }

  async getAgentCountForUser(userId: string): Promise<number> {
    return await projectUserAgentRepository.countByUser(userId);
  }
}

export const hierarchyValidationService = new HierarchyValidationService();
export const roleDeduplicationService = new RoleDeduplicationService();
export const roleManagementService = new RoleManagementService();
