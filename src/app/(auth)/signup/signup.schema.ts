import { z } from "zod";

// Zod schema for signup form validation
export const signUpSchema = z.object({
  name: z.string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be less than 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces" }),
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .toLowerCase()
    .max(100, { message: "Email must be less than 100 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password must be less than 100 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;