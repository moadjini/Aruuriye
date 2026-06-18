"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);

  const load = () => {
    const supabase = createClient();
    supabase
      .from("reports")
      .select("*, campaigns(title, slug), profiles(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading reports:", JSON.stringify(error, null, 2));
          console.error("Error details:", error.message, error.code, error.hint);
        } else {
          setReports(data || []);
        }
      });
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: string, freezeCampaign?: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("reports").update({
      status,
      investigated_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", id);

    if (freezeCampaign && status === "resolved") {
      await supabase.from("campaigns").update({ status: "frozen" }).eq("id", freezeCampaign);
    }
    load();
  };

  return (
    <div className="w-full animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Fraud Reports</h1>
      <div className="mt-6 space-y-3">
        {reports.map((r, index) => (
          <div key={r.id as string} style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}>
            <Card className="transition-all duration-300 hover:shadow-premium-hover animate-slide-in-right">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-700">{(r.reason as string).replace("_", " ")}</Badge>
                    <Badge className="bg-gray-100">{r.status as string}</Badge>
                  </div>
                  <p className="font-medium mt-2">{(r.campaigns as { title: string })?.title}</p>
                  <p className="text-sm text-text-muted mt-1">{r.description as string}</p>
                  <p className="text-xs text-text-muted mt-2">
                    Reported by {(r.profiles as { full_name: string })?.full_name || "Anonymous"} · {formatDate(r.created_at as string)}
                  </p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={() => resolve(r.id as string, "resolved", r.campaign_id as string)}>
                      Freeze Campaign
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resolve(r.id as string, "dismissed")}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
        {reports.length === 0 && <p className="text-center py-12 text-text-muted animate-fade-in">No reports</p>}
      </div>
    </div>
  );
}
