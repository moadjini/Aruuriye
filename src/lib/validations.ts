import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone_number: z.string().min(9, "Valid phone number required"),
    city: z.string().min(2, "City is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export const profileSchema = z.object({
  full_name: z.string().min(2),
  phone_number: z.string().min(9),
  city: z.string().min(2),
});

export const campaignSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100),
  description: z.string().min(50, "Description must be at least 50 characters"),
  story: z.string().optional(),
  goal_amount: z.coerce.number().min(10, "Minimum goal is $10"),
  category_id: z.string().uuid("Select a category"),
  location: z.string().min(2, "Location is required"),
  end_date: z.string().optional(),
});

export const donationSchema = z.object({
  donor_name: z.string().min(2, "Name is required"),
  donor_phone: z.string().min(9, "Valid phone number required"),
  amount: z.coerce.number().min(1, "Minimum donation is $1"),
  message: z.string().optional(),
  is_anonymous: z.boolean().optional(),
});

export const withdrawalSchema = z.object({
  campaign_id: z.string().uuid(),
  full_name: z.string().min(2),
  phone_number: z.string().min(9),
  payment_method: z.enum(["evc_plus", "zaad", "sahal", "bank_transfer"]),
  amount: z.coerce.number().min(10, "Minimum withdrawal is $10"),
});

export const reportSchema = z.object({
  campaign_id: z.string().uuid(),
  reason: z.enum([
    "fake_campaign",
    "misleading_information",
    "duplicate_campaign",
    "suspicious_activity",
  ]),
  description: z.string().min(20, "Please provide more details"),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export const updateSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
