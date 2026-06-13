export type UserRole = "visitor" | "fundraiser" | "admin";
export type VerificationLevel = "none" | "level_1" | "level_2" | "level_3";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "verified"
  | "active"
  | "frozen"
  | "completed"
  | "rejected";
export type DonationStatus = "pending_verification" | "verified" | "rejected";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type ReportReason =
  | "fake_campaign"
  | "misleading_information"
  | "duplicate_campaign"
  | "suspicious_activity";
export type PaymentMethod = "evc_plus" | "zaad" | "sahal" | "bank_transfer";
export type DocumentType =
  | "national_id"
  | "student_id"
  | "medical_report"
  | "organization_doc"
  | "campaign_supporting"
  | "receipt"
  | "proof_of_impact";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  city: string | null;
  avatar_url: string | null;
  role: UserRole;
  verification_level: VerificationLevel;
  verification_status: VerificationStatus;
  is_banned: boolean;
  ban_reason: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface Campaign {
  id: string;
  creator_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  story: string | null;
  goal_amount: number;
  raised_amount: number;
  location: string;
  cover_image_url: string | null;
  status: CampaignStatus;
  is_featured: boolean;
  is_anonymous_donations: boolean;
  rejection_reason: string | null;
  view_count: number;
  donor_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  categories?: Category;
}

export interface Donation {
  id: string;
  campaign_id: string;
  donor_id: string | null;
  donor_name: string;
  donor_phone: string;
  amount: number;
  transaction_reference: string;
  payment_method: PaymentMethod;
  status: DonationStatus;
  is_anonymous: boolean;
  message: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  campaign_id: string;
  fundraiser_id: string;
  full_name: string;
  phone_number: string;
  payment_method: PaymentMethod;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: WithdrawalStatus;
  created_at: string;
}

export interface CampaignUpdate {
  id: string;
  campaign_id: string;
  author_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  campaign_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
