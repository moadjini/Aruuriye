"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { reviewVerificationAction } from "@/app/actions/platform";

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);

  const load = () => {
    const supabase = createClient();
    supabase
      .from("verification_requests")
      .select("*, profiles!verification_requests_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading verification requests:", JSON.stringify(error));
          alert("Failed to load verification requests. Please check console for details.");
        } else {
          setRequests(data || []);
        }
      });
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, userId: string, status: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    // Get the requested level from the verification request
    const { data: request } = await supabase
      .from("verification_requests")
      .select("requested_level")
      .eq("id", id)
      .maybeSingle();

    const level = request?.requested_level || "level_1";

    const result = await reviewVerificationAction(id, userId, status, level, user.id);
    
    if (result.error) {
      alert("Failed to review verification: " + result.error);
    } else {
      alert(`Verification ${status} successfully!`);
      load();
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Verification Requests</h1>
      <div className="mt-6 space-y-3">
        {requests.map((r) => (
          <div key={r.id as string} className="cursor-pointer" onClick={() => window.location.href = `/admin/verification/${r.id as string}`}>
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{(r.profiles as { full_name: string })?.full_name}</p>
                  <p className="text-sm text-text-muted">
                    Document: {r.document_type as string}
                  </p>
                  {(r.document_url as string) && (
                    <a href={r.document_url as string} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                      View Document
                    </a>
                  )}
                  <p className="text-xs text-text-muted mt-1">{formatDate(r.created_at as string)}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge className="bg-gray-100">{r.status as string}</Badge>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => review(r.id as string, r.user_id as string, "verified")}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => review(r.id as string, r.user_id as string, "rejected")}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
        {requests.length === 0 && <p className="text-center py-12 text-text-muted">No verification requests</p>}
      </div>
    </div>
  );
}
