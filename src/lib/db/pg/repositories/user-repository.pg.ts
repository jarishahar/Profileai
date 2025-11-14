import {
  BasicUserWithLastLogin,
  User,
  UserPreferences,
  UserRepository,
} from "app-types/user";
import { pgDb as db, pgDb } from "../db.pg";
import { AccountTable, SessionTable, UserTable } from "../schema.pg";
import { count, eq, getTableColumns, sql } from "drizzle-orm";

// Helper function to get user columns without password
const getUserColumnsWithoutPassword = () => {
  const { password, ...userColumns } = getTableColumns(UserTable);
  return userColumns;
};

export const pgUserRepository: UserRepository = {
  existsByEmail: async (email: string): Promise<boolean> => {
    const result = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));
    return result.length > 0;
  },
  updateUserDetails: async ({
    userId,
    name,
    image,
    email,
  }: {
    userId: string;
    name?: string;
    image?: string;
    email?: string;
  }): Promise<User> => {
    const [result] = await db
      .update(UserTable)
      .set({
        ...(name && { name }),
        ...(image && { image }),
        ...(email && { email }),
        updatedAt: new Date(),
      })
      .where(eq(UserTable.id, userId))
      .returning();
    return {
      ...result,
      preferences: result.preferences,
    };
  },

  updatePreferences: async (
    userId: string,
    preferences: UserPreferences,
  ): Promise<User> => {
    const [result] = await db
      .update(UserTable)
      .set({
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(UserTable.id, userId))
      .returning();
    return {
      ...result,
      preferences: result.preferences ?? null,
    };
  },
  getPreferences: async (userId: string) => {
    const [result] = await db
      .select({ preferences: UserTable.preferences })
      .from(UserTable)
      .where(eq(UserTable.id, userId));
    return result?.preferences ?? null;
  },
  getUserById: async (
    userId: string,
  ): Promise<BasicUserWithLastLogin | null> => {
    const [result] = await pgDb
      .select({
        ...getUserColumnsWithoutPassword(),
        lastLogin: sql<Date | null>`(
          SELECT MAX(${SessionTable.updatedAt}) 
          FROM ${SessionTable} 
          WHERE ${SessionTable.userId} = ${UserTable.id}
        )`.as("lastLogin"),
      })
      .from(UserTable)
      .where(eq(UserTable.id, userId));

    return result || null;
  },

  getUserCount: async () => {
    const [result] = await db.select({ count: count() }).from(UserTable);
    return result?.count ?? 0;
  },
  getUserAuthMethods: async (userId: string) => {
    const accounts = await pgDb
      .select({
        providerId: AccountTable.providerId,
      })
      .from(AccountTable)
      .where(eq(AccountTable.userId, userId));

    return {
      hasPassword: accounts.some((a) => a.providerId === "credential"),
      oauthProviders: accounts
        .filter((a) => a.providerId !== "credential")
        .map((a) => a.providerId),
    };
  },
};
