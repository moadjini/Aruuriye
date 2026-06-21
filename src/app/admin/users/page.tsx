"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { VerificationBadge } from "@/components/ui/verification-badge";
import Image from "next/image";

interface UserExtended extends Record<string, unknown> {
  id: string;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  city: string | null;
  role: string;
  verification_level: string;
  verification_status: string;
  is_banned: boolean;
  created_at: string;
  total_campaigns?: number;
  total_donations?: number;
  total_raised?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserExtended[]>([]);

  const load = async () => {
    const supabase = createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) return;

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id")
          .eq("creator_id", profile.id);

        const { data: donations } = await supabase
          .from("donations")
          .select("amount")
          .eq("donor_id", profile.id)
          .eq("status", "verified");

        const totalRaised = donations?.reduce((sum, d) => sum + (d.amount as number), 0) || 0;

        return {
          ...profile,
          total_campaigns: campaigns?.length || 0,
          total_donations: donations?.length || 0,
          total_raised: totalRaised,
        } as UserExtended;
      })
    );

    setUsers(usersWithStats);
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

  const verifyUser = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    try {
      // Use the server action to verify user
      const { adminVerifyUserAction } = await import("@/app/actions/platform");
      const result = await adminVerifyUserAction(id, "verified", user.id);
      
      if (result.error) {
        alert("Failed to verify user: " + result.error);
      } else {
        alert(`User verified successfully!`);
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
            <Card key={u.id} className="transition-all duration-300 hover:shadow-premium-hover animate-slide-in-right">
              <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {(u.avatar_url as string) && (
                      <div 
                        className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer hover:scale-105 transition-transform relative"
                        onClick={() => window.open(u.avatar_url as string, '_blank')}
                      >
                        <Image 
                          src={u.avatar_url as string} 
                          alt={u.full_name || "Profile"} 
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="font-medium text-text">{u.full_name || u.email}</p>
                        <Badge className="bg-slate-100 text-text text-xs">{u.role}</Badge>
                        <VerificationBadge level={u.verification_level} />
                        {u.is_banned && <Badge className="bg-red-100 text-red-700 text-xs">Banned</Badge>}
                      </div>
                      <p className="text-sm text-text-muted">{u.email}</p>
                      {u.phone_number && <p className="text-sm text-text-muted">{u.phone_number}</p>}
                      <p className="text-xs text-text-muted mt-1">
                        {u.city} · Joined {formatDate(u.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {u.verification_level === "none" && (
                      <Button size="sm" variant="outline" onClick={() => verifyUser(u.id)}>Verify</Button>
                    )}
                    {u.verification_level !== "none" && (
                      <Button size="sm" variant="outline" onClick={() => verifyUser(u.id)}>Unverify</Button>
                    )}
                    {u.role === "visitor" && (
                      <Button size="sm" variant="secondary" onClick={() => changeRole(u.id, "fundraiser")}>Make Fundraiser</Button>
                    )}
                    {u.role === "fundraiser" && (
                      <Button size="sm" variant="outline" onClick={() => changeRole(u.id, "visitor")}>Make Visitor</Button>
                    )}
                    {u.is_banned ? (
                      <Button size="sm" onClick={() => banUser(u.id, false)}>Unban</Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => banUser(u.id, true)}>Ban</Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary">{u.total_campaigns || 0}</p>
                    <p className="text-xs text-text-muted">Campaigns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary">{u.total_donations || 0}</p>
                    <p className="text-xs text-text-muted">Donations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary">${(u.total_raised || 0).toLocaleString()}</p>
                    <p className="text-xs text-text-muted">Total Raised</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

