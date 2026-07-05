import { createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { resolveReportAction } from "@/app/actions/platform";

export default async function AdminReportsPage() {
  const supabase = await createServiceClient();
  const { data: reports, error } = await supabase
    .from("reports")
    .select("*, campaigns(title, slug), reporter:profiles!reports_reporter_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error.message || error);
  }

  return (
    <div className="w-full animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Fraud Reports</h1>
      <div className="mt-6 space-y-3">
        {reports?.map((r, index) => (
          <div key={r.id} style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}>
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
                    Reported by {(r.reporter as { full_name: string })?.full_name || "Anonymous"} · {formatDate(r.created_at as string)}
                  </p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <form action={resolveReportAction}>
                      <input type="hidden" name="id" value={r.id as string} />
                      <input type="hidden" name="status" value="resolved" />
                      <input type="hidden" name="freezeCampaign" value={r.campaign_id as string} />
                      <Button size="sm" variant="danger" type="submit">
                        Freeze Campaign
                      </Button>
                    </form>
                    <form action={resolveReportAction}>
                      <input type="hidden" name="id" value={r.id as string} />
                      <input type="hidden" name="status" value="dismissed" />
                      <Button size="sm" variant="outline" type="submit">
                        Dismiss
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
        {(!reports || reports.length === 0) && <p className="text-center py-12 text-text-muted animate-fade-in">No reports</p>}
      </div>
    </div>
  );
}
