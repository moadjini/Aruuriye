"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  DollarSign,
  ArrowDownToLine,
  Shield,
  Bell,
  Settings,
  Users,
  BarChart3,
  Flag,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "visitor" | "fundraiser" | "admin";
}

const visitorLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/verification", label: "Become Fundraiser", icon: Shield },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const fundraiserLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "My Campaigns", icon: Megaphone },
  { href: "/dashboard/campaigns/new", label: "Create Campaign", icon: Megaphone },
  { href: "/dashboard/donations", label: "Donations", icon: DollarSign },
  { href: "/dashboard/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
  { href: "/dashboard/verification", label: "Verification", icon: Shield },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Analytics", icon: BarChart3 },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/donations", label: "Donations", icon: DollarSign },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verification", label: "Verification", icon: FileCheck },
  { href: "/admin/reports", label: "Fraud Reports", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links =
    role === "admin"
      ? adminLinks
      : role === "visitor"
      ? visitorLinks
      : fundraiserLinks;


  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
      <nav className="sticky top-16 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || 
            (link.href !== "/dashboard" && link.href !== "/admin" && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-text-muted hover:bg-gray-100 hover:text-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
