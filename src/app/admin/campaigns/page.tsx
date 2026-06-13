"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updateCampaignStatusAction } from "@/app/actions/platform";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState("pending_review");

  const load = () => {
    const supabase = createClient();
    let query = supabase
      .from("campaigns")
      .select("*, profiles(full_name), categories(name)")
      .order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("status", filter);
    query.then(({ data }) => setCampaigns(data || []));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const result = await updateCampaignStatusAction(id, status, reason || null, user.id);
    
    if (result.error) {
      alert("Failed to update campaign status: " + result.error);
    } else {
      alert(`Campaign ${status} successfully!`);
      load();
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Manage Campaigns</h1>
      <div className="mt-4 flex gap-2 flex-wrap">
        {["pending_review", "active", "frozen", "rejected", "all"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "primary" : "outline"} onClick={() => setFilter(f)}>
            {f.replace("_", " ")}
          </Button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {campaigns.map((c) => (
          <div key={c.id as string} className="cursor-pointer" onClick={() => window.location.href = `/admin/campaigns/${c.id as string}`}>
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.title as string}</h3>
                    <Badge className={getStatusColor(c.status as string)}>{c.status as string}</Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    {(c.profiles as { full_name: string })?.full_name} · {(c.categories as { name: string })?.name} · {formatDate(c.created_at as string)}
                  </p>
                  <p className="text-sm mt-1">Goal: {formatCurrency(c.goal_amount as number)}</p>
                </div>
                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {c.status === "pending_review" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(c.id as string, "active")}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => updateStatus(c.id as string, "rejected", "Does not meet guidelines")}>Reject</Button>
                    </>
                  )}
                  {c.status === "active" && (
                    <Button size="sm" variant="danger" onClick={() => updateStatus(c.id as string, "frozen")}>Freeze</Button>
                  )}
                  {c.status === "frozen" && (
                    <Button size="sm" onClick={() => updateStatus(c.id as string, "active")}>Unfreeze</Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
