"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";
import { Logo } from "@/components/layout/logo";
import { NotificationBadge } from "@/components/layout/notification-badge";

interface HeaderProps {
  profile?: Profile | null;
}

export function Header({ profile }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/campaigns" className="text-sm font-semibold text-text-muted hover:text-secondary transition-colors">
            Explore
          </Link>
          {profile ? (
            <>
              <NotificationBadge profile={profile} />
              <Link href={profile.role === "admin" ? "/admin" : "/dashboard"}>
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Sign Out</Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Start Fundraising</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          {profile && <NotificationBadge profile={profile} />}
          <button className="p-2 text-text hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 sm:hidden animate-fade-in shadow-lg">
          <div className="flex flex-col gap-3 font-medium">
            <Link href="/campaigns" onClick={() => setMobileOpen(false)} className="py-2 text-text hover:text-secondary">
              Explore Campaigns
            </Link>
            {profile ? (
              <>
                <Link href={profile.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setMobileOpen(false)} className="py-2 text-text hover:text-secondary">
                  Dashboard
                </Link>
                <Link href="/dashboard/notifications" onClick={() => setMobileOpen(false)} className="py-2 text-text hover:text-secondary">
                  Notifications
                </Link>
                <button onClick={handleLogout} className="text-left text-red-600 py-2">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Start Fundraising</Button>
                </Link>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

