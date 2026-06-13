import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireRole(roles: string[]) {
  const profile = await getProfile();
  if (!profile || !roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireFundraiser() {
  return requireRole(["fundraiser", "admin"]);
}

export async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });
}
