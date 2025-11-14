export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
} as const;
export type UserRoleNames = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Default user role is "editor" which matches the current user capabilities

export const DEFAULT_USER_ROLE: UserRoleNames =
  process.env.DEFAULT_USER_ROLE &&
  Object.values(USER_ROLES).includes(
    process.env.DEFAULT_USER_ROLE as UserRoleNames,
  )
    ? (process.env.DEFAULT_USER_ROLE as UserRoleNames)
    : USER_ROLES.EDITOR;

export type UserRolesInfo = Record<
  UserRoleNames,
  {
    label: string;
    description: string;
  }
>;

export const userRolesInfo: UserRolesInfo = {
  superadmin: {
    label: "Super Admin",
    description: "System administrator with full access to all tenants and system-wide settings",
  },
  admin: {
    label: "Admin",
    description: "Tenant administrator who can manage their tenant's projects and users",
  },
  editor: {
    label: "Editor",
    description:
      "Default role for users who can create agents, workflows and add MCPs within their tenant",
  },
  user: {
    label: "User",
    description: "Basic user role with limited permissions within their tenant",
  },
};
