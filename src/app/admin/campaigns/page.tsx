"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updateCampaignStatusAction } from "@/app/actions/platform";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [filter, setFilter] = useState("pending_review");

  const load = useCallback(() => {
    const supabase = createClient();
    let query = supabase
      .from("campaigns")
      .select("*, profiles(full_name), categories(name)")
      .order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("status", filter);
    query.then(({ data }) => setCampaigns(data || []));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

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

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const { error } = await supabase
      .from("campaigns")
      .update({ is_featured: !currentFeatured })
      .eq("id", id);

    if (error) {
      alert("Failed to update featured status: " + error.message);
    } else {
      alert(`Campaign ${!currentFeatured ? "featured" : "unfeatured"} successfully!`);
      load();
    }
  };


  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text animate-slide-up" style={{ animationDelay: "0.1s" } as React.CSSProperties}>Manage Campaigns</h1>
      <div className="mt-4 flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: "0.2s" } as React.CSSProperties}>
        {["pending_review", "active", "frozen", "rejected", "all"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "primary" : "outline"} onClick={() => setFilter(f)}>
            {f.replace("_", " ")}
          </Button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {campaigns.map((c, index) => (
          <div key={c.id as string} className="cursor-pointer animate-slide-in-right" style={{ animationDelay: `${0.3 + index * 0.05}s` } as React.CSSProperties} onClick={() => window.location.href = `/admin/campaigns/${c.id as string}`}>
            <Card className="hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.title as string}</h3>
                    <Badge className={getStatusColor(c.status as string)}>{c.status as string}</Badge>
                    {(c.is_featured as boolean) && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    {(c.profiles as { full_name: string })?.full_name} · {(c.categories as { name: string })?.name} · {formatDate(c.created_at as string)}
                  </p>
                  <p className="text-sm mt-1">Goal: {formatCurrency(c.goal_amount as number)}</p>
                </div>
                <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant={c.is_featured ? "secondary" : "outline"} onClick={() => toggleFeatured(c.id as string, c.is_featured as boolean)}>
                    {c.is_featured ? "Unfeature" : "Feature"}
                  </Button>
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
