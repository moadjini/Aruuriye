export const APP_NAME = "HaddaICaawi";
export const APP_TAGLINE = "Somalia's trusted crowdfunding platform";
export const PRIMARY_COLOR = "#2563EB";
export const ACCENT_COLOR = "#DBEAFE";
export const TEXT_COLOR = "#1F2937";

export const CATEGORIES = [
  { name: "Medical", slug: "medical", icon: "heart-pulse" },
  { name: "Education", slug: "education", icon: "graduation-cap" },
  { name: "Business", slug: "business", icon: "briefcase" },
  { name: "Emergency Relief", slug: "emergency-relief", icon: "alert-triangle" },
  { name: "Community Projects", slug: "community-projects", icon: "users" },
  { name: "Charity", slug: "charity", icon: "hand-heart" },
  { name: "Mosque Projects", slug: "mosque-projects", icon: "building" },
] as const;

export const REPORT_REASONS = [
  { value: "fake_campaign", label: "Fake Campaign" },
  { value: "misleading_information", label: "Misleading Information" },
  { value: "duplicate_campaign", label: "Duplicate Campaign" },
  { value: "suspicious_activity", label: "Suspicious Activity" },
] as const;

export const PAYMENT_METHODS = [
  { value: "evc_plus", label: "EVC Plus" },
  { value: "zaad", label: "Zaad" },
  { value: "sahal", label: "Sahal Pay" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 5);
export const EVC_BUSINESS_NUMBER =
  process.env.NEXT_PUBLIC_EVC_BUSINESS_NUMBER || "61XXXXXXX";
