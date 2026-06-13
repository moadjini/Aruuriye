import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export default async function DonationsPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id")
    .eq("creator_id", profile!.id);

  const campaignIds = campaigns?.map((c) => c.id) || [];

  const { data: donations } = campaignIds.length
    ? await supabase
        .from("donations")
        .select("*, campaigns(title)")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Donation History</h1>
      <p className="mt-1 text-text-muted">All donations to your campaigns</p>

      <div className="mt-6 space-y-3">
        {donations?.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{d.is_anonymous ? "Anonymous" : d.donor_name}</p>
                <p className="text-sm text-text-muted">
                  {d.campaigns?.title} · {formatDate(d.created_at)} · Ref: {d.transaction_reference}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{formatCurrency(d.amount)}</p>
                <Badge className={getStatusColor(d.status)}>{d.status.replace("_", " ")}</Badge>
              </div>
            </div>
          </Card>
        ))}
        {(!donations || donations.length === 0) && (
          <p className="text-center py-12 text-text-muted">No donations yet</p>
        )}
      </div>
    </div>
  );
}
