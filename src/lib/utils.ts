import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function calculateProgress(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function calculatePlatformFee(amount: number, feePercent: number = 5): number {
  return Math.round(amount * (feePercent / 100) * 100) / 100;
}

export function getVerificationBadge(level: string): { label: string; color: string } {
  const badges: Record<string, { label: string; color: string }> = {
    none: { label: "Unverified", color: "bg-gray-100 text-gray-600" },
    verified: { label: "✓ Verified", color: "bg-blue-500 text-white" },
  };
  return badges[level] || badges.none;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending_review: "bg-yellow-100 text-yellow-700",
    verified: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    frozen: "bg-red-100 text-red-700",
    completed: "bg-purple-100 text-purple-700",
    rejected: "bg-red-100 text-red-700",
    pending_verification: "bg-yellow-100 text-yellow-700",
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    paid: "bg-green-100 text-green-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
