import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Eye, Megaphone, ShieldAlert, ShieldEllipsis } from "lucide-react";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  if (profile?.role === "visitor") {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
            <p className="text-text-muted">Welcome back, {profile.full_name}</p>
          </div>
        </div>

        <Card className="border-secondary/20 bg-gradient-to-r from-secondary-light/20 to-transparent shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="rounded-xl bg-secondary-light p-3 text-secondary shrink-0">
                <ShieldEllipsis className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="text-lg font-bold text-text">Become a Fundraiser</h2>
                <p className="text-sm text-text-muted max-w-full">
                  To start creating campaigns, posting updates, and raising funds on HaddaICaawi, you need to apply for a Fundraiser account. Our admin team will verify your identity.
                </p>

                {profile.verification_status === "unverified" && (
                  <div className="pt-2">
                    <Link href="/dashboard/verification" className="block w-full sm:w-auto">
                      <Button className="w-full sm:w-auto">Submit Fundraiser Request</Button>
                    </Link>
                  </div>
                )}

                {profile.verification_status === "pending" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800 border border-yellow-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    Your fundraiser request is under review. You&apos;ll be notified automatically once approved.
                  </div>
                )}


                {profile.verification_status === "rejected" && (
                  <div className="space-y-3 pt-2">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 border border-red-200">
                      <ShieldAlert className="h-4 w-4" />
                      Your previous request was rejected by the admin.
                    </div>
                    <p className="text-xs text-text-muted">
                      Please ensure your ID document is clear, legible, and valid, then try submitting your request again.
                    </p>
                    <Link href="/dashboard/verification" className="block w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">Submit New Request</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fundraiser dashboard (existing campaign and donations metrics)
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("creator_id", profile!.id);

  const campaignIds = campaigns?.map((c) => c.id) || [];

  const { data: donations } = campaignIds.length
    ? await supabase
        .from("donations")
        .select("amount, status")
        .in("campaign_id", campaignIds)
    : { data: [] };

  const totalRaised = campaigns?.reduce((sum, c) => sum + Number(c.raised_amount), 0) || 0;
  const totalDonors = campaigns?.reduce((sum, c) => sum + c.donor_count, 0) || 0;
  const totalViews = campaigns?.reduce((sum, c) => sum + c.view_count, 0) || 0;
  const pendingDonations = donations?.filter((d) => d.status === "pending_verification").length || 0;

  const { data: withdrawals } = campaignIds.length
    ? await supabase
        .from("withdrawal_requests")
        .select("amount, status")
        .in("campaign_id", campaignIds)
        .eq("status", "paid")
    : { data: [] };

  const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  const availableBalance = totalRaised - totalWithdrawn;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted">Welcome back, {profile?.full_name}</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Create Campaign</Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Raised" value={formatCurrency(totalRaised)} icon={DollarSign} />
        <StatCard title="Available Balance" value={formatCurrency(availableBalance)} icon={DollarSign} subtitle={`${pendingDonations} pending donations`} />
        <StatCard title="Total Donors" value={totalDonors} icon={Users} />
        <StatCard title="Campaign Views" value={totalViews} icon={Eye} />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 hover:border-secondary hover:bg-secondary-light/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Megaphone className="h-5 w-5 text-primary group-hover:text-secondary transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-secondary transition-colors truncate">{campaign.title}</p>
                      <p className="text-sm text-text-muted">
                        {formatCurrency(campaign.raised_amount)} of {formatCurrency(campaign.goal_amount)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(campaign.status)} shrink-0>
                    {campaign.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <p>No campaigns yet</p>
              <Link href="/dashboard/campaigns/new" className="mt-4 inline-block">
                <Button>Create Your First Campaign</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

