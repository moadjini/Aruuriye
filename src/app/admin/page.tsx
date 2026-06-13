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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
      <p className="text-text-muted">Platform analytics and management</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Donations" value={formatCurrency(totalDonations)} icon={DollarSign} />
        <StatCard title="Total Withdrawals" value={formatCurrency(totalWithdrawals)} icon={ArrowDownToLine} />
        <StatCard title="Total Campaigns" value={totalCampaigns || 0} icon={Megaphone} />
        <StatCard title="Total Users" value={totalUsers || 0} icon={Users} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Reviews" value={pendingCampaigns || 0} icon={FileCheck} subtitle="Campaigns awaiting approval" />
        <StatCard title="Verified Campaigns" value={verifiedCampaigns || 0} icon={Megaphone} />
        <StatCard title="Fraud Reports" value={pendingReports || 0} icon={Flag} subtitle="Needs investigation" />
        <StatCard title="Pending Verifications" value={pendingVerifications || 0} icon={FileCheck} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <PendingCampaignsCard />
        <PendingDonationsCard />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <PendingVerificationsCard />
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
                className="group flex justify-between text-sm border-b border-gray-100 pb-2 hover:border-secondary hover:bg-secondary-light/20 px-2 py-1 rounded transition-all cursor-pointer"
              >
                <span className="font-medium group-hover:text-secondary transition-colors">{c.title}</span>
                <span className="text-text-muted">{profile?.full_name}</span>
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
    .select("id, donor_name, amount, transaction_reference, campaigns(title)")
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
                className="group flex justify-between text-sm border-b border-gray-100 pb-2 hover:border-secondary hover:bg-secondary-light/20 px-2 py-1 rounded transition-all cursor-pointer"
              >
                <div>
                  <span className="font-medium group-hover:text-secondary transition-colors">{d.donor_name}</span>
                  <span className="text-text-muted ml-2">{campaign?.title}</span>
                </div>
                <span className="font-semibold text-primary">{formatCurrency(d.amount)}</span>
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
                className="group flex justify-between text-sm border-b border-gray-100 pb-2 hover:border-secondary hover:bg-secondary-light/20 px-2 py-1 rounded transition-all cursor-pointer"
              >
                <div>
                  <span className="font-medium group-hover:text-secondary transition-colors">{profile?.full_name || profile?.email}</span>
                  <span className="text-text-muted ml-2">{v.requested_level}</span>
                </div>
                <span className="text-xs text-text-muted">{v.document_type}</span>
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
                className="group flex justify-between text-sm border-b border-gray-100 pb-2 hover:border-secondary hover:bg-secondary-light/20 px-2 py-1 rounded transition-all cursor-pointer"
              >
                <div>
                  <span className="font-medium group-hover:text-secondary transition-colors">{profile?.full_name}</span>
                  <span className="text-text-muted ml-2">{w.payment_method}</span>
                </div>
                <span className="font-semibold text-primary">{formatCurrency(w.amount)}</span>
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
