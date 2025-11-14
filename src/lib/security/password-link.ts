import { pgDb } from "lib/db/pg/db.pg";
import { userToken } from "@/lib/db/pg/schema.pg";
import { projectUser } from "@/lib/db/pg/schema.pg";
import { and, eq, isNull } from "drizzle-orm";
import { generateRawToken, hashToken } from "@/lib/security/tokens";
import { sendMail } from "@/lib/mailer/mail";

const INVITE_TOKEN_TTL_MINUTES = Number(
  process.env.INVITE_TOKEN_TTL_MINUTES ?? 72 * 60,
); // 72h
const RESET_TOKEN_TTL_MINUTES = Number(
  process.env.RESET_TOKEN_TTL_MINUTES ?? 60,
); // 60m

type LinkType = "INVITE" | "RESET_PASSWORD";

export async function issuePasswordLink(opts: {
  projectId: string;
  projectUserId: string; // project_user.id
  origin: string;
  type: LinkType;
}) {
  const { projectId, projectUserId, origin, type } = opts;

  const [u] = await pgDb
    .select({
      id: projectUser.id,
      email: projectUser.email,
      name: projectUser.name,
    })
    .from(projectUser)
    .where(
      and(
        eq(projectUser.id, projectUserId),
        eq(projectUser.projectId, projectId),
      ),
    )
    .limit(1);

  if (!u) throw new Error("User not found");

  // Revoke any previously active token of the same type
  await pgDb
    .update(userToken)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(userToken.userId, u.id),
        eq(userToken.type, type),
        isNull(userToken.usedAt),
      ),
    );

  const raw = generateRawToken(32);
  const tokenHash = hashToken(raw);
  const ttlMin =
    type === "INVITE" ? INVITE_TOKEN_TTL_MINUTES : RESET_TOKEN_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

  await pgDb.insert(userToken).values({
    userId: u.id,
    type,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${origin}/reset?token=${encodeURIComponent(raw)}`;

  await sendMail({
    to: u.email,
    subject: type === "INVITE" ? "Set up your password" : "Reset your password",
    html: `
      <p>Hi ${u.name || u.email},</p>
      <p>${
        type === "INVITE"
          ? `Click the link below to set your password and activate your account (expires in ${Math.round(
              ttlMin / 60,
            )} hours):`
          : `Click the link below to reset your password (expires in ${ttlMin} minutes):`
      }</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
