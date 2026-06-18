import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { DollarSign, Megaphone, Users, Flag, FileCheck, ArrowDownToLine } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalCampaigns },
    { count: pendingCampaigns },
    { count: verifiedCampaigns },
    { data: donations },
    { data: withdrawals },
    { count: pendingReports },
    { count: pendingVerifications },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "verified"),
    supabase.from("donations").select("amount").eq("status", "verified"),
    supabase.from("withdrawal_requests").select("amount").eq("status", "pending"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const totalDonations = donations?.reduce((s, d) => s + Number(d.amount), 0) || 0;
  const totalWithdrawals = withdrawals?.reduce((s, w) => s + Number(w.amount), 0) || 0;
  
  // Calculate platform earnings (5% of verified donations)
  const platformEarnings = totalDonations * 0.05;
  
  // Calculate today's earnings
  const today = new Date().toISOString().split('T')[0];
  const { data: todayDonations } = await supabase
    .from("donations")
    .select("amount")
    .eq("status", "verified")
    .gte("created_at", today);
  const todayEarnings = todayDonations?.reduce((s, d) => s + Number(d.amount), 0) * 0.05 || 0;

  return (
    <div className="w-full animate-fade-in">
      <h1 className="text-2xl font-bold text-text animate-slide-up" style={{ animationDelay: "0.1s" } as React.CSSProperties}>Admin Dashboard</h1>
      <p className="text-text-muted animate-slide-up" style={{ animationDelay: "0.2s" } as React.CSSProperties}>Platform analytics and management</p>

      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up" style={{ animationDelay: "0.3s" } as React.CSSProperties}>
          <StatCard title="Total Donations" value={formatCurrency(totalDonations)} icon={DollarSign} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" } as React.CSSProperties}>
          <StatCard title="Total Withdrawals" value={formatCurrency(totalWithdrawals)} icon={ArrowDownToLine} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.5s" } as React.CSSProperties}>
          <StatCard title="Total Campaigns" value={totalCampaigns || 0} icon={Megaphone} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.6s" } as React.CSSProperties}>
          <StatCard title="Total Users" value={totalUsers || 0} icon={Users} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up" style={{ animationDelay: "0.7s" } as React.CSSProperties}>
          <StatCard title="Platform Earnings" value={formatCurrency(platformEarnings)} icon={DollarSign} subtitle="5% of verified donations" className="bg-secondary-light/30 border-secondary/20" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.8s" } as React.CSSProperties}>
          <StatCard title="Today's Earnings" value={formatCurrency(todayEarnings)} icon={DollarSign} subtitle="5% of today's verified donations" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "0.9s" } as React.CSSProperties}>
          <StatCard title="Pending Reviews" value={pendingCampaigns || 0} icon={FileCheck} subtitle="Campaigns awaiting approval" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "1.0s" } as React.CSSProperties}>
          <StatCard title="Verified Campaigns" value={verifiedCampaigns || 0} icon={Megaphone} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-slide-up" style={{ animationDelay: "1.1s" } as React.CSSProperties}>
          <StatCard title="Fraud Reports" value={pendingReports || 0} icon={Flag} subtitle="Needs investigation" />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "1.2s" } as React.CSSProperties}>
          <StatCard title="Pending Verifications" value={pendingVerifications || 0} icon={FileCheck} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <PendingCampaignsCard />
        <PendingDonationsCard />
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <PendingReportsCard />
        <PendingWithdrawalsCard />
      </div>
    </div>
  );
}

async function PendingCampaignsCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("id, title, created_at, profiles(full_name)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader><CardTitle>Pending Campaign Reviews</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((c) => {
              const profile = c.profiles as unknown as { full_name: string } | null;
              return (
              <Link
                key={c.id}
                href={`/admin/campaigns/${c.id}`}
                className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm border-b border-gray-100 pb-2 px-2 py-1 rounded transition-all cursor-pointer hover:bg-gray-50"
              >
                <span className="font-medium group-hover:text-secondary transition-colors truncate">{c.title}</span>
                <span className="text-text-muted shrink-0">{profile?.full_name}</span>
              </Link>
            );})}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No pending reviews</p>
        )}
      </CardContent>
    </Card>
  );
}

async function PendingDonationsCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("id, donor_name, amount, campaigns(title)")
    .eq("status", "pending_verification")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader><CardTitle>Pending Donation Verifications</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((d) => {
              const campaign = d.campaigns as unknown as { title: string } | null;
              return (
              <Link
                key={d.id}
                href={`/admin/donations/${d.id}`}
                className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm border-b border-gray-100 pb-2 px-2 py-1 rounded transition-all cursor-pointer hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium group-hover:text-secondary transition-colors block">{d.donor_name}</span>
                  <span className="text-text-muted text-xs block">{campaign?.title}</span>
                </div>
                <span className="font-semibold text-primary shrink-0">{formatCurrency(d.amount)}</span>
              </Link>
            );})}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No pending donations</p>
        )}
      </CardContent>
    </Card>
  );
}

async function PendingVerificationsCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("verification_requests")
    .select("id, requested_level, document_type, created_at, profiles!verification_requests_user_id_fkey(full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader><CardTitle>Pending Verification Requests</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((v) => {
              const profile = v.profiles as unknown as { full_name: string; email: string } | null;
              return (
              <Link
                key={v.id}
                href={`/admin/verification/${v.id}`}
                className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm border-b border-gray-100 pb-2 px-2 py-1 rounded transition-all cursor-pointer hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium group-hover:text-secondary transition-colors block">{profile?.full_name || profile?.email}</span>
                  <span className="text-text-muted text-xs block">Blue Checkmark Request</span>
                </div>
                <span className="text-xs text-text-muted shrink-0">{v.document_type}</span>
              </Link>
            );})}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No pending verifications</p>
        )}
      </CardContent>
    </Card>
  );
}

async function PendingReportsCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, reason, created_at, campaigns(title), profiles(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader><CardTitle>Pending Fraud Reports</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((r) => {
              const campaign = r.campaigns as unknown as { title: string } | null;
              const profile = r.profiles as unknown as { full_name: string } | null;
              return (
              <Link
                key={r.id}
                href={`/admin/reports`}
                className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm border-b border-gray-100 pb-2 px-2 py-1 rounded transition-all cursor-pointer hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium group-hover:text-secondary transition-colors block">{campaign?.title}</span>
                  <span className="text-text-muted text-xs block">{(r.reason as string).replace("_", " ")}</span>
                </div>
                <span className="text-text-muted text-xs shrink-0">{profile?.full_name || "Anonymous"}</span>
              </Link>
            );})}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No pending reports</p>
        )}
      </CardContent>
    </Card>
  );
}

async function PendingWithdrawalsCard() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("withdrawal_requests")
    .select("id, amount, payment_method, phone_number, created_at, profiles!withdrawal_requests_fundraiser_id_fkey(full_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader><CardTitle>Pending Withdrawal Requests</CardTitle></CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((w) => {
              const profile = w.profiles as unknown as { full_name: string } | null;
              return (
              <Link
                key={w.id}
                href={`/admin/withdrawals/${w.id}`}
                className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm border-b border-gray-100 pb-2 px-2 py-1 rounded transition-all cursor-pointer hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium group-hover:text-secondary transition-colors block">{profile?.full_name}</span>
                  <span className="text-text-muted text-xs block">{w.payment_method}</span>
                </div>
                <span className="font-semibold text-primary shrink-0">{formatCurrency(w.amount)}</span>
              </Link>
            );})}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No pending withdrawals</p>
        )}
      </CardContent>
    </Card>
  );
}
