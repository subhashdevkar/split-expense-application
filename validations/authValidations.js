import z, { email } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email format").trim(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Invalid phone number")
    .trim(),
  name: z.string().min(3).trim(),
  password: z.string().min(5).trim(),
});

export const loginSchema = z.object({
  loginId: z
    .string()
    .refine(
      (value) =>
        /^[0-9]{10}$/.test(value) ||
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
      "Enter a valid email or phone number"
    )
    .trim(),
  password: z.string().min(5).trim(),
});

export const sendOtpSchema = z.object({
  loginId: z
    .string()
    .refine(
      (value) =>
        /^[0-9]{10}$/.test(value) ||
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
      "Enter a valid email or phone number"
    )
    .trim(),
});

export const resetPasswordSchema = z.object({
  loginId: z
    .string()
    .refine(
      (value) =>
        /^[0-9]{10}$/.test(value) ||
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
      "Enter a valid email or phone number"
    )
    .trim(),
  otp: z.string().length(6).trim(),
  newPassword: z.string().min(5).trim(),
});

export const verifyEmailSchema = z.object({
  email: z.email(),
  otp: z.string().length(6),
});
