import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

// Password validation - 8+ chars, uppercase, number
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password must be less than 72 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

// Phone validation - international format
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format" })
  .optional()
  .or(z.literal(''));

// Authentication schemas
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

// Profile validation
export const profileSchema = z.object({
  first_name: z.string().trim().max(100, { message: "First name must be less than 100 characters" }).optional(),
  last_name: z.string().trim().max(100, { message: "Last name must be less than 100 characters" }).optional(),
  phone: phoneSchema,
  date_of_birth: z.string().optional(),
});

// Address validation
export const addressSchema = z.object({
  full_name: z.string().trim().min(1, { message: "Full name is required" }).max(200, { message: "Name must be less than 200 characters" }),
  address_line1: z.string().trim().min(1, { message: "Address is required" }).max(200, { message: "Address must be less than 200 characters" }),
  address_line2: z.string().trim().max(200, { message: "Address line 2 must be less than 200 characters" }).optional().or(z.literal('')),
  city: z.string().trim().min(1, { message: "City is required" }).max(100, { message: "City must be less than 100 characters" }),
  state: z.string().trim().min(1, { message: "State/Province is required" }).max(100, { message: "State must be less than 100 characters" }),
  postal_code: z.string().trim().min(1, { message: "Postal code is required" }).max(20, { message: "Postal code must be less than 20 characters" }),
  country: z.string().trim().min(1, { message: "Country is required" }).max(100, { message: "Country must be less than 100 characters" }),
  phone: phoneSchema,
  address_type: z.enum(['shipping', 'billing', 'both'], { message: "Invalid address type" }),
});

// Payment method validation
export const paymentMethodSchema = z.object({
  payment_type: z.enum(['card', 'bank_transfer', 'paypal'], { message: "Invalid payment type" }),
  card_last_four: z.string().regex(/^\d{4}$/, { message: "Must be 4 digits" }).optional(),
  card_brand: z.string().max(50).optional(),
  card_exp_month: z.number().min(1).max(12).optional(),
  card_exp_year: z.number().min(new Date().getFullYear()).optional(),
});

// Order issue validation
export const orderIssueSchema = z.object({
  issue_type: z.enum(['damaged', 'missing_items', 'wrong_item', 'quality', 'other'], { message: "Please select an issue type" }),
  description: z.string().trim().min(10, { message: "Description must be at least 10 characters" }).max(1000, { message: "Description must be less than 1000 characters" }),
});

// Order tracking validation
export const orderTrackingSchema = z.object({
  orderNumber: z.string().trim().min(1, { message: "Order number is required" }),
  email: emailSchema,
});
