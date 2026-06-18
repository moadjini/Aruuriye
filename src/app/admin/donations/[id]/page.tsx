"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { verifyDonationAction } from "@/app/actions/platform";

export default function AdminDonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [donation, setDonation] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("donations")
      .select("*, campaigns(title, description, cover_image_url, profiles(full_name))")
      .eq("id", resolvedParams.id)
      .single()
      .then(({ data }) => setDonation(data));
  }, [resolvedParams.id]);

  const handleVerify = async (status: string) => {
    setActionLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      setActionLoading(false);
      return;
    }

    const result = await verifyDonationAction(resolvedParams.id, status, user.id);
    
    if (result.error) {
      alert("Failed to verify donation: " + result.error);
    } else {
      alert(`Donation ${status} successfully!`);
      router.push("/admin/donations");
    }
    
    setActionLoading(false);
  };

  if (!donation) return <div className="text-center py-12">Loading...</div>;

  const campaign = donation.campaigns as Record<string, unknown> | null;
  const campaignProfile = campaign?.profiles as Record<string, string> | null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Donation Review</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donation Details */}
        <Card>
          <CardHeader><CardTitle>Donation Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Donor Name</label>
              <p className="font-semibold">{donation.donor_name as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Donor Phone</label>
              <p>{donation.donor_phone as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Amount</label>
              <p className="font-semibold text-2xl text-primary">{formatCurrency(donation.amount as number)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Message</label>
              <p className="text-sm">{donation.message as string || "No message provided"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Anonymous</label>
              <p>{donation.is_anonymous ? "Yes" : "No"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Status</label>
              <Badge className={getStatusColor(donation.status as string)}>{String(donation.status).replace("_", " ")}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Created At</label>
              <p>{formatDate(String(donation.created_at))}</p>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Information */}
        <Card>
          <CardHeader><CardTitle>Campaign Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Campaign Title</label>
              <p className="font-semibold">{campaign?.title as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Campaign Description</label>
              <p className="text-sm">{campaign?.description as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Campaign Creator</label>
              <p>{campaignProfile?.full_name}</p>
            </div>
            {(campaign?.cover_image_url as string | undefined) && campaign && (
              <div>
                <label className="text-sm font-medium text-text-muted">Campaign Cover</label>
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden">
                  <Image src={campaign.cover_image_url as string} alt="Campaign cover" fill className="object-cover" />
                </div>
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
            {donation.status === "pending_verification" && (
              <>
                <Button onClick={() => handleVerify("verified")} loading={actionLoading}>Verify Donation</Button>
                <Button variant="danger" onClick={() => handleVerify("rejected")} loading={actionLoading}>Reject Donation</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
