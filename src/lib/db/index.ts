import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __novaMedtecDbClient: ReturnType<typeof postgres> | undefined;
}

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function createClient() {
  if (global.__novaMedtecDbClient) return global.__novaMedtecDbClient;

  const connectionString = isDbConfigured()
    ? (process.env.DATABASE_URL as string)
    : "postgres://placeholder";

  global.__novaMedtecDbClient = postgres(connectionString, {
    prepare: false,
    connect_timeout: isDbConfigured() ? 10 : 1,
  });
  return global.__novaMedtecDbClient;
}

export const db = drizzle(createClient(), { schema });
