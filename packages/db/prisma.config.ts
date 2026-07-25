import { defineConfig } from "@prisma/config";
import dotenvExpand from "dotenv-expand";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from the monorepo root
dotenvExpand.expand(
  dotenv.config({ path: path.join(__dirname, "../../.env") }),
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
