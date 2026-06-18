"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { VerificationBadge } from "@/components/ui/verification-badge";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);

  const load = () => {
    const supabase = createClient();
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setUsers(data || []));
  };

  useEffect(() => { load(); }, []);

  const banUser = async (id: string, ban: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ is_banned: ban, ban_reason: ban ? "Banned by admin" : null }).eq("id", id);
    if (user) {
      await supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: ban ? "ban_user" : "unban_user",
        entity_type: "user",
        entity_id: id,
      });
      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: id,
        title: ban ? "Account Suspended" : "Account Restored",
        message: ban ? "Your account has been suspended by an administrator. Please contact support." : "Your account has been restored.",
        type: ban ? "error" : "success",
      });
    }
    load();
  };

  const changeRole = async (id: string, role: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({ role }).eq("id", id);
    
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action: `role_change_${role}`,
      entity_type: "user",
      entity_id: id,
      details: { new_role: role },
    });

    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: id,
      title: "Role Updated",
      message: `Your account role has been changed to ${role}.`,
      type: "info",
    });

    load();
  };

  const verifyUser = async (id: string, level: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    try {
      // Use the server action to verify user
      const { adminVerifyUserAction } = await import("@/app/actions/platform");
      const result = await adminVerifyUserAction(id, level, user.id);
      
      if (result.error) {
        alert("Failed to verify user: " + result.error);
      } else {
        alert(`User verified to ${level} successfully!`);
        load();
      }
    } catch (error: any) {
      alert("Error verifying user: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Manage Users</h1>
      <div className="mt-6 space-y-3">
        {users.map((u) => {
          return (
            <Card key={u.id as string} className="transition-all duration-300 hover:shadow-premium-hover animate-slide-in-right">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text">{u.full_name as string || u.email as string}</p>
                    <Badge className="bg-slate-100 text-text text-xs">{u.role as string}</Badge>
                    <VerificationBadge level={u.verification_level as string} />
                    {(u.is_banned as boolean) && <Badge className="bg-red-100 text-red-700 text-xs">Banned</Badge>}
                  </div>
                  <p className="text-sm text-text-muted mt-1">{u.email as string} · {u.city as string} · {formatDate(u.created_at as string)}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(u.verification_level as string) === "none" && (
                    <Button size="sm" variant="outline" onClick={() => verifyUser(u.id as string, "level_1")}>Verify</Button>
                  )}
                  {(u.verification_level as string) !== "none" && (
                    <Button size="sm" variant="outline" onClick={() => verifyUser(u.id as string, "none")}>Unverify</Button>
                  )}
                  {(u.role as string) === "visitor" && (
                    <Button size="sm" variant="secondary" onClick={() => changeRole(u.id as string, "fundraiser")}>Make Fundraiser</Button>
                  )}
                  {(u.role as string) === "fundraiser" && (
                    <Button size="sm" variant="outline" onClick={() => changeRole(u.id as string, "visitor")}>Make Visitor</Button>
                  )}
                  {(u.is_banned as boolean) ? (
                    <Button size="sm" onClick={() => banUser(u.id as string, false)}>Unban</Button>
                  ) : (
                    <Button size="sm" variant="danger" onClick={() => banUser(u.id as string, true)}>Ban</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

