import { z } from "zod";

// Zod schema for signin form validation
export const signInSchema = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .max(100, { message: "Email must be less than 100 characters" }),
  password: z.string()
    .min(1, { message: "Password is required" }),
  rememberMe: z.boolean().default(false),
});

export type SignInFormData = z.infer<typeof signInSchema>;