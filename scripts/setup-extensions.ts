import "load-env";
import { pgDb } from "../src/lib/db/pg/db.pg";
import { sql } from "drizzle-orm";

async function setupExtensions() {
  try {
    console.log("🔧 Setting up PostgreSQL extensions...");

    // Enable pgvector extension for vector embeddings
    try {
      await pgDb.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
      console.log("✅ pgvector extension enabled");
    } catch (error: any) {
      if (error?.code === "42501" || error?.hint?.includes("superuser")) {
        console.warn(
          "⚠️  pgvector extension requires superuser privileges - skipping"
        );
        console.warn(
          "   This is required for vector embeddings. Ask your database administrator to enable it:"
        );
        console.warn(
          "   psql -U postgres -d your_database -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
        );
      } else {
        throw error;
      }
    }

    // Enable uuid-ossp for UUID generation (if needed)
    try {
      await pgDb.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      console.log("✅ uuid-ossp extension enabled");
    } catch (error: any) {
      if (error?.code === "42501" || error?.hint?.includes("superuser")) {
        console.warn(
          "⚠️  uuid-ossp extension requires superuser privileges - skipping"
        );
      } else {
        throw error;
      }
    }

    console.log("✅ Extension setup attempt completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up extensions:", error);
    console.error("\nIf you see 'permission denied to create extension':");
    console.error(
      "1. Contact your database administrator to enable the extensions"
    );
    console.error(
      "2. Or if you have superuser access, run as a superuser user:"
    );
    console.error("   psql -U postgres -d your_database");
    console.error("   CREATE EXTENSION IF NOT EXISTS vector;");
    console.error("   CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
    process.exit(1);
  }
}

setupExtensions();
