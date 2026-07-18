import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://fastlane:fastlane@localhost:5432/fastlane";

const globalForDb = globalThis as unknown as {
  fastlanePool?: Pool;
};

export const pool =
  globalForDb.fastlanePool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.fastlanePool = pool;
}

export const db = drizzle(pool, { schema });
