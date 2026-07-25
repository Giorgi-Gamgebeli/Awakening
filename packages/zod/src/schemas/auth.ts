import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required.")
    .min(3, "Username must have at least 3 characters."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must have at least 8 characters."),
});
