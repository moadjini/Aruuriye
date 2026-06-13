import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { calculateProgress } from "@/lib/utils";

export default async function MyCampaignsPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, categories(name)")
    .eq("creator_id", profile!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">My Campaigns</h1>
        <Link href="/dashboard/campaigns/new"><Button>Create Campaign</Button></Link>
      </div>

      <div className="mt-6 space-y-4">
        {campaigns?.map((campaign) => (
          <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`}>
            <Card hover className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{campaign.title}</h3>
                  <Badge className={getStatusColor(campaign.status)}>{campaign.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-text-muted">{campaign.categories?.name} · {campaign.location}</p>
                <div className="mt-3 max-w-md">
                  <ProgressBar value={calculateProgress(campaign.raised_amount, campaign.goal_amount)} />
                  <p className="mt-1 text-sm">
                    <span className="font-semibold text-primary">{formatCurrency(campaign.raised_amount)}</span>
                    <span className="text-text-muted"> of {formatCurrency(campaign.goal_amount)}</span>
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {(!campaigns || campaigns.length === 0) && (
          <div className="text-center py-12 text-text-muted">
            <p>No campaigns yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
