import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { z } from "@repo/zod";

const viteEnvironmentSchema = z.object({
  WEB_PORT: z.coerce.number().int().min(1).max(65535),
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = viteEnvironmentSchema.parse(loadEnv(mode, "../../", ""));

  return {
    envDir: "../../",
    plugins: [react(), tailwindcss()],
    server: {
      port: env.WEB_PORT,
      strictPort: true,
    },
  };
});
