import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Plain `dotenv/config` only loads `.env`, not `.env.local` — load it
// explicitly so `npm run db:push` picks up local credentials.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder",
  },
});
