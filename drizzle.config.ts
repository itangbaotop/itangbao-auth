import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite", // 始终生成 SQLite 兼容的 SQL
  driver: "d1-http", 
  dbCredentials: {
    wranglerConfigPath: "./wrangler.toml",
    databaseName: "itangbao-auth",
  },
} satisfies Config;
