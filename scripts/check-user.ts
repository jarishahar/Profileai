import "load-env";
import { pgDb } from "../src/lib/db/pg/db.pg";
import { UserTable } from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";

async function checkUser() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Usage: tsx scripts/check-user.ts <email>");
    process.exit(1);
  }

  try {
    const [user] = await pgDb
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email))
      .limit(1);

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
    console.log(`   Password Hash (first 20 chars): ${user.password?.substring(0, 20)}...`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking user:", error);
    process.exit(1);
  }
}

checkUser();
