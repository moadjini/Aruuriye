"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { reviewVerificationAction } from "@/app/actions/platform";

export default function AdminVerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("verification_requests")
      .select("*, profiles!verification_requests_user_id_fkey(full_name, email, phone_number, city, role, verification_level)")
      .eq("id", resolvedParams.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading verification request:", error);
        } else {
          console.log("Verification request loaded:", data);
          setRequest(data);
        }
      });
  }, [resolvedParams.id]);

  const handleReview = async (status: string, level: string) => {
    setActionLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      setActionLoading(false);
      return;
    }

    const result = await reviewVerificationAction(resolvedParams.id, request?.user_id as string, status, level, user.id);
    
    if (result.error) {
      alert("Failed to review verification: " + result.error);
    } else {
      alert(`Verification ${status} successfully!`);
      router.push("/admin/verification");
    }
    
    setActionLoading(false);
  };

  if (!request) return <div className="text-center py-12">Loading...</div>;

  const profile = request.profiles as Record<string, string> | null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Verification Request Review</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Details */}
        <Card>
          <CardHeader><CardTitle>Verification Request</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Requested Level</label>
              <p className="font-semibold">{request.requested_level as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Document Type</label>
              <p>{request.document_type as string}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Status</label>
              <Badge className="bg-gray-100">{request.status as string}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Submitted At</label>
              <p>{formatDate(String(request.created_at))}</p>
            </div>
            {(request.document_url as string | undefined) && (request.document_url as string) !== '' && (request.document_url as string) !== 'null' && (
              <div>
                <label className="text-sm font-medium text-text-muted">Document</label>
                <div className="mt-2 flex flex-col gap-2">
                  <a 
                    href={request.document_url as string} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer w-full sm:w-auto"
                  >
                    📄 View Document
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(request.document_url as string);
                      alert("URL copied to clipboard!");
                    }}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Copy URL to clipboard
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-1 break-all">{request.document_url as string}</p>
              </div>
            )}
            {(!(request.document_url as string | undefined) || (request.document_url as string) === '' || (request.document_url as string) === 'null') && (
              <div>
                <label className="text-sm font-medium text-text-muted">Document</label>
                <p className="text-sm text-text-muted mt-2 italic">No document uploaded (admin direct verification)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader><CardTitle>User Information</CardTitle></CardHeader>
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
              <label className="text-sm font-medium text-text-muted">Current Role</label>
              <Badge className="bg-slate-100 text-text">{profile?.role}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Current Verification Level</label>
              <p>{profile?.verification_level || "none"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mt-6">
        <CardHeader><CardTitle>Review Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {request.status === "pending" && (
              <>
                <Button onClick={() => handleReview("verified", request.requested_level as string)} loading={actionLoading}>
                  Approve {request.requested_level as string}
                </Button>
                <Button variant="danger" onClick={() => handleReview("rejected", "none")} loading={actionLoading}>
                  Reject Request
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
