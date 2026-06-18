"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updateCampaignStatusAction } from "@/app/actions/platform";

export default function AdminCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("campaigns")
      .select("*, profiles(full_name, email, phone_number, city), categories(name)")
      .eq("id", resolvedParams.id)
      .single()
      .then(({ data }) => setCampaign(data));
  }, [resolvedParams.id]);

  const handleStatusChange = async (status: string, reason?: string) => {
    setActionLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      setActionLoading(false);
      return;
    }

    const result = await updateCampaignStatusAction(resolvedParams.id, status, reason || null, user.id);
    
    if (result.error) {
      alert("Failed to update campaign status: " + result.error);
    } else {
      alert(`Campaign ${status} successfully!`);
      router.push("/admin/campaigns");
    }
    
    setActionLoading(false);
  };

  if (!campaign) return <div className="text-center py-12">Loading...</div>;

  const profile = campaign.profiles as Record<string, string> | null;
  const category = campaign.categories as Record<string, string> | null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Campaign Review</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Details */}
        <Card>
          <CardHeader><CardTitle>Campaign Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Title</label>
              <p className="font-semibold">{campaign.title as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Description</label>
              <p className="text-sm">{campaign.description as string}</p>
            </div>
            {(campaign.story as string | undefined) && (
              <div>
                <label className="text-sm font-medium text-text-muted">Full Story</label>
                <p className="text-sm whitespace-pre-wrap">{campaign.story as string}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-muted">Goal Amount</label>
                <p className="font-semibold">{formatCurrency(campaign.goal_amount as number)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-muted">Raised Amount</label>
                <p className="font-semibold">{formatCurrency(campaign.raised_amount as number)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-muted">Category</label>
                <p>{category?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-text-muted">Location</label>
                <p>{campaign.location as string}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Status</label>
              <Badge className={getStatusColor(campaign.status as string)}>{campaign.status as string}</Badge>
            </div>
            {(campaign.cover_image_url as string | undefined) && (
              <div>
                <label className="text-sm font-medium text-text-muted">Cover Image</label>
                <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden">
                  <Image src={campaign.cover_image_url as string} alt="Campaign cover" fill className="object-cover" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creator Information */}
        <Card>
          <CardHeader><CardTitle>Creator Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Full Name</label>
              <p className="font-semibold">{profile?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Email</label>
              <p>{profile?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Phone Number</label>
              <p>{profile?.phone_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">City</label>
              <p>{profile?.city}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Created At</label>
              <p>{formatDate(campaign.created_at as string)}</p>
            </div>
            {(campaign.end_date as string | undefined) && (
              <div>
                <label className="text-sm font-medium text-text-muted">End Date</label>
                <p>{formatDate(campaign.end_date as string)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <CardHeader><CardTitle>Review Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {campaign.status === "pending_review" && (
              <>
                <Button onClick={() => handleStatusChange("active")} loading={actionLoading}>Approve Campaign</Button>
                <Button variant="danger" onClick={() => handleStatusChange("rejected", "Does not meet guidelines")} loading={actionLoading}>Reject Campaign</Button>
              </>
            )}
            {campaign.status === "active" && (
              <Button variant="danger" onClick={() => handleStatusChange("frozen")} loading={actionLoading}>Freeze Campaign</Button>
            )}
            {campaign.status === "frozen" && (
              <Button onClick={() => handleStatusChange("active")} loading={actionLoading}>Unfreeze Campaign</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
