"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { processWithdrawalAction } from "@/app/actions/platform";

export default function AdminWithdrawalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [withdrawal, setWithdrawal] = useState<Record<string, unknown> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("withdrawal_requests")
      .select("*, campaigns(title, description, cover_image_url), profiles!withdrawal_requests_fundraiser_id_fkey(full_name, email, phone_number)")
      .eq("id", resolvedParams.id)
      .single()
      .then(({ data }) => setWithdrawal(data));
  }, [resolvedParams.id]);

  const handleProcess = async (status: string) => {
    setActionLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      setActionLoading(false);
      return;
    }

    const result = await processWithdrawalAction(resolvedParams.id, status, user.id);
    
    if (result.error) {
      alert("Failed to process withdrawal: " + result.error);
    } else {
      alert(`Withdrawal ${status} successfully!`);
      router.push("/admin/withdrawals");
    }
    
    setActionLoading(false);
  };

  if (!withdrawal) return <div className="text-center py-12">Loading...</div>;

  const campaign = withdrawal.campaigns as Record<string, unknown> | null;
  const profile = withdrawal.profiles as Record<string, string> | null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Withdrawal Request Review</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Withdrawal Details */}
        <Card>
          <CardHeader><CardTitle>Withdrawal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Requested Amount</label>
              <p className="font-semibold text-2xl text-primary">{formatCurrency(withdrawal.amount as number)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Platform Fee</label>
              <p>{formatCurrency(withdrawal.platform_fee as number)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Net Amount</label>
              <p className="font-semibold text-green-600">{formatCurrency(withdrawal.net_amount as number)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Payment Method</label>
              <p>{withdrawal.payment_method as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Phone Number</label>
              <p>{withdrawal.phone_number as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Status</label>
              <Badge className={getStatusColor(withdrawal.status as string)}>{withdrawal.status as string}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Requested At</label>
              <p>{formatDate(String(withdrawal.created_at))}</p>
            </div>
          </CardContent>
        </Card>

        {/* User & Campaign Information */}
        <Card>
          <CardHeader><CardTitle>User & Campaign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">User Name</label>
              <p className="font-semibold">{profile?.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">User Email</label>
              <p>{profile?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">User Phone</label>
              <p>{profile?.phone_number}</p>
            </div>
            <div className="border-t pt-4">
              <label className="text-sm font-medium text-text-muted">Campaign Title</label>
              <p className="font-semibold">{campaign?.title as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Campaign Description</label>
              <p className="text-sm">{campaign?.description as string}</p>
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
            {withdrawal.status === "pending" && (
              <>
                <Button onClick={() => handleProcess("approved")} loading={actionLoading}>Approve Request</Button>
                <Button onClick={() => handleProcess("paid")} loading={actionLoading}>Mark as Paid</Button>
                <Button variant="danger" onClick={() => handleProcess("rejected")} loading={actionLoading}>Reject Request</Button>
              </>
            )}
            {withdrawal.status === "approved" && (
              <Button onClick={() => handleProcess("paid")} loading={actionLoading}>Mark as Paid</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
