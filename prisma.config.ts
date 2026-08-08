import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migration URL (direct connection, bypasses pgbouncer)
    url: process.env["DIRECT_URL"],
  },
});
