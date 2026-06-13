import { requireAuth, getProfile } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const profile = await getProfile();

  if (!profile) redirect("/auth/login");
  if (profile.role === "admin") redirect("/admin");
  if (profile.is_banned) redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role={profile.role} />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
