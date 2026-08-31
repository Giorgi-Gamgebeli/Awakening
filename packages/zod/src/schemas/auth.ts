import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required.")
    .pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must have at least 8 characters."),
});

export const registerSchema = z
  .object({
    userName: z
      .string()
      .trim()
      .min(1, "Username is required.")
      .min(10, "Username must have at least 10 characters.")
      .max(32, "Username must be 32 characters or fewer.")
      .regex(/^\w+$/, "Use letters, numbers, or underscores only."),
    displayName: z
      .string()
      .trim()
      .min(1, "Display name is required.")
      .max(32, "Display name must be 32 characters or fewer."),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .pipe(z.email("Enter a valid email address.")),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must have at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
