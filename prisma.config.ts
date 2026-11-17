import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(projectRoot, ".env") });

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const databaseUrl = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : new URL("postgresql://localhost");
if (!process.env.DATABASE_URL) {
  databaseUrl.hostname = required("DB_HOST");
  databaseUrl.port = required("DB_PORT");
  databaseUrl.username = required("DB_USER");
  databaseUrl.password = required("DB_PASSWORD");
  databaseUrl.pathname = `/${encodeURIComponent(required("DB_NAME"))}`;
}
if (!databaseUrl.searchParams.has("schema")) {
  databaseUrl.searchParams.set("schema", "public");
}

export default defineConfig({
  schema: path.join(projectRoot, "prisma", "schema.prisma"),
  datasource: { url: databaseUrl.toString() }
});
