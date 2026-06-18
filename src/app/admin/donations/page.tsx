"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { verifyDonationAction } from "@/app/actions/platform";

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Record<string, unknown>[]>([]);

  const load = () => {
    const supabase = createClient();
    supabase
      .from("donations")
      .select("*, campaigns(title)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setDonations(data || []));
  };

  useEffect(() => { load(); }, []);

  const verify = async (id: string, status: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const result = await verifyDonationAction(id, status, user.id);
    
    if (result.error) {
      alert("Failed to verify donation: " + result.error);
    } else {
      alert(`Donation ${status} successfully!`);
      load();
    }
  };


  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text animate-slide-up" style={{ animationDelay: "0.1s" } as React.CSSProperties}>Manage Donations</h1>
      <div className="mt-6 space-y-3">
        {donations.map((d, index) => (
          <div key={d.id as string} className="cursor-pointer animate-slide-in-right" style={{ animationDelay: `${0.2 + index * 0.05}s` } as React.CSSProperties} onClick={() => window.location.href = `/admin/donations/${d.id as string}`}>
            <Card className="hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{d.donor_name as string} · {formatCurrency(d.amount as number)}</p>
                  <p className="text-sm text-text-muted">
                    {(d.campaigns as { title: string })?.title} · {formatDate(d.created_at as string)}
                  </p>
                  <p className="text-sm text-text-muted">Phone: {d.donor_phone as string}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge className={getStatusColor(d.status as string)}>{(d.status as string).replace("_", " ")}</Badge>
                  {d.status === "pending_verification" && (
                    <>
                      <Button size="sm" onClick={() => verify(d.id as string, "verified")}>Verify</Button>
                      <Button size="sm" variant="danger" onClick={() => verify(d.id as string, "rejected")}>Reject</Button>
                    </>
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
