/**
 * Seed script to create a superadmin user
 * 
 * Usage:
 * tsx scripts/seed-superadmin.ts <email> <password> <name>
 * 
 * Example:
 * tsx scripts/seed-superadmin.ts admin@example.com SecurePass123! "Super Admin"
 */

import "load-env";
import { pgDb } from "../src/lib/db/pg/db.pg";
import { UserTable, AccountTable } from "../src/lib/db/pg/schema.pg";
import { USER_ROLES } from "../src/types/roles";
import { hashPassword } from "../src/lib/security/password";
import { eq, and } from "drizzle-orm";

async function seedSuperAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("Usage: tsx scripts/seed-superadmin.ts <email> <password> <name>");
    console.error('Example: tsx scripts/seed-superadmin.ts admin@example.com SecurePass123! "Super Admin"');
    process.exit(1);
  }

  const [email, password, name] = args;

  try {
    // Check if user already exists
    const [existingUser] = await pgDb
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email))
      .limit(1);

    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      
      // Update existing user to superadmin
      const [updatedUser] = await pgDb
        .update(UserTable)
        .set({ role: USER_ROLES.SUPERADMIN })
        .where(eq(UserTable.email, email))
        .returning();
      
      // Check if credential account exists
      const [existingAccount] = await pgDb
        .select()
        .from(AccountTable)
        .where(
          and(
            eq(AccountTable.userId, updatedUser.id),
            eq(AccountTable.providerId, "credential")
          )
        )
        .limit(1);

      if (!existingAccount) {
        // Create credential account
        await pgDb.insert(AccountTable).values({
          userId: updatedUser.id,
          accountId: updatedUser.id,
          providerId: "credential",
          password: await hashPassword(password),
        });
        console.log(`✅ Created credential account for existing user`);
      }
      
      console.log(`✅ Updated existing user to superadmin role:`);
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create new superadmin user
    const [newUser] = await pgDb
      .insert(UserTable)
      .values({
        email,
        password: hashedPassword,
        name,
        role: USER_ROLES.SUPERADMIN,
        emailVerified: true, // Auto-verify for seed users
        tenantId: null, // Superadmins don't belong to a tenant
      })
      .returning();

    // Create credential account for Better Auth
    await pgDb.insert(AccountTable).values({
      userId: newUser.id,
      accountId: newUser.id,
      providerId: "credential",
      password: hashedPassword,
    });

    console.log(`✅ Successfully created superadmin user:`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`\n🔐 You can now sign in with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error("❌ Error creating superadmin user:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedSuperAdmin();
