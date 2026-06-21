"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface NotificationBadgeProps {
  profile?: Profile | null;
}

export function NotificationBadge({ profile }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (!profile) return;

    const supabase = createClient();

    // 1. Fetch initial unread count
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false)
      .then(({ count }) => {
        setUnreadCount(count || 0);
      });

    // 2. Subscribe to new notifications in real-time
    const uniqueChannelName = `notifications-${profile.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          // Increment unread count
          setUnreadCount((prev) => prev + 1);

          // Show elegant toast alert
          setToast({
            title: payload.new.title,
            message: payload.new.message,
          });
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Toast auto-dismissal
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!profile) return null;

  const notificationsPath = profile.role === "admin" ? "/admin/notifications" : "/dashboard/notifications";

  return (
    <>
      {/* Bell Icon & Unread Badge */}
      <Link
        href={notificationsPath}
        className="relative flex items-center justify-center rounded-full p-2 text-text-muted hover:bg-gray-100 hover:text-text transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white animate-fade-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {/* Slide-in Top-Right Toast Alert */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 flex w-full max-w-sm overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl animate-fade-in transition-all duration-300 transform translate-y-0">
          {/* Accent border stripe */}
          <div className="w-1.5 bg-secondary shrink-0" />
          
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans font-bold text-sm text-text leading-tight">{toast.title}</p>
                <p className="mt-1 font-sans text-xs text-text-muted leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="rounded-lg p-1 text-text-muted hover:bg-gray-100 hover:text-text transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Quick action link to notifications */}
            <div className="mt-2.5 flex justify-end">
              <Link
                href={notificationsPath}
                onClick={() => setToast(null)}
                className="text-[10px] font-bold text-secondary hover:underline uppercase tracking-wider"
              >
                View Notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
