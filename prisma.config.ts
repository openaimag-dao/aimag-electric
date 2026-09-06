// prisma.config.ts opts out of Prisma's built-in .env auto-loading (see
// https://pris.ly/prisma-config) — load it ourselves so DATABASE_URL still
// resolves for CLI commands (migrate, db push, seed, studio) run outside
// Next's own env loading.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
