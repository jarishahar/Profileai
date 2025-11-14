// app/api/auth/reset/route.ts  (POST)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pgDb } from "@/lib/db/pg/db.pg";
import { userToken, VerificationTable, AccountTable, UserTable } from "@/lib/db/pg/schema.pg";
import { projectUser } from "@/lib/db/pg/schema.pg"; // global users table
import { and, eq, isNull } from "drizzle-orm";
import { hashToken } from "@/lib/security/tokens";
import { hash } from "bcrypt-ts";

const Body = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = Body.parse(await req.json());
    const tokenHash = hashToken(token);

    const invalid = () =>
      NextResponse.json(
        { success: false, message: "Invalid or expired link" },
        { status: 400 },
      );

    // First, try to find token in userToken table (for project users)
    const [projectUserToken] = await pgDb
      .select({
        id: userToken.id,
        userId: userToken.userId, // FK → project_user.id
        type: userToken.type, // 'INVITE' | 'RESET_PASSWORD'
        expiresAt: userToken.expiresAt,
        usedAt: userToken.usedAt,
      })
      .from(userToken)
      .where(and(eq(userToken.tokenHash, tokenHash), isNull(userToken.usedAt)))
      .limit(1);

    // If found in userToken table, handle project user password reset
    if (projectUserToken && projectUserToken.expiresAt > new Date()) {
      // Hash new password
      const newHash = await hash(newPassword, 12);

      // Update project_user.password
      await pgDb
        .update(projectUser)
        .set({ password: newHash, updatedAt: new Date() })
        .where(eq(projectUser.id, projectUserToken.userId));

      // Mark token used
      await pgDb
        .update(userToken)
        .set({ usedAt: new Date() })
        .where(and(eq(userToken.id, projectUserToken.id), isNull(userToken.usedAt)));

      return NextResponse.json({ success: true });
    }

    // If not found in userToken, check VerificationTable (for admin users with Better Auth)
    const [verificationToken] = await pgDb
      .select({
        id: VerificationTable.id,
        identifier: VerificationTable.identifier, // email
        value: VerificationTable.value, // hashed token
        expiresAt: VerificationTable.expiresAt,
      })
      .from(VerificationTable)
      .where(eq(VerificationTable.value, tokenHash))
      .limit(1);

    if (!verificationToken || verificationToken.expiresAt <= new Date()) {
      return invalid();
    }

    // Found admin user token - update their password in AccountTable
    const email = verificationToken.identifier;
    
    // Hash new password
    const newHash = await hash(newPassword, 12);

    // Update the credential account password
    const [updatedAccount] = await pgDb
      .update(AccountTable)
      .set({ password: newHash })
      .where(
        and(
          eq(AccountTable.accountId, email),
          eq(AccountTable.providerId, "credential")
        )
      )
      .returning();

    if (!updatedAccount) {
      return invalid();
    }

    // Mark user as verified in UserTable
    await pgDb
      .update(UserTable)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(UserTable.email, email));

    // Delete the verification token (one-time use)
    await pgDb
      .delete(VerificationTable)
      .where(eq(VerificationTable.id, verificationToken.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, message: "Error" },
      { status: 500 },
    );
  }
}
