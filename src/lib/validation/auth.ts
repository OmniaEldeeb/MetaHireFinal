import { z } from "zod";

const password = z.string().min(8, "Use at least 8 characters");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const candidateSchema = z
  .object({
    name: z.string().min(1, "Enter your name").max(255),
    email: z.string().email("Enter a valid email"),
    phone: z
      .string()
      .optional()
      .or(z.literal("")),
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
export type CandidateValues = z.infer<typeof candidateSchema>;

export const companySchema = z
  .object({
    name: z.string().min(1, "Enter your name"),
    email: z.string().email("Enter a valid email"),
    company_name: z.string().min(1, "Enter your company name"),
    industry: z.string().optional().or(z.literal("")),
    headquarters: z.string().optional().or(z.literal("")),
    website: z
      .string()
      .url("Enter a valid URL (https://…)")
      .optional()
      .or(z.literal("")),
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
export type CompanyValues = z.infer<typeof companySchema>;

export const identifierSchema = z.object({
  identifier: z.string().min(1, "Enter your email or phone"),
});
export type IdentifierValues = z.infer<typeof identifierSchema>;

export const otpSchema = z.object({
  otp: z.string().min(4, "Enter the code from your email"),
});
export type OtpValues = z.infer<typeof otpSchema>;

export const newPasswordSchema = z
  .object({
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
