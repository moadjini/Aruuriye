"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { processWithdrawalAction } from "@/app/actions/platform";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Record<string, unknown>[]>([]);

  const load = () => {
    const supabase = createClient();
    supabase
      .from("withdrawal_requests")
      .select("*, campaigns(title), profiles!withdrawal_requests_fundraiser_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading withdrawal requests:", JSON.stringify(error));
          alert("Failed to load withdrawal requests. Please check console for details.");
        } else {
          setWithdrawals(data || []);
        }
      });
  };

  useEffect(() => { load(); }, []);

  const process = async (id: string, status: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to perform this action");
      return;
    }

    const result = await processWithdrawalAction(id, status, user.id);
    
    if (result.error) {
      alert("Failed to process withdrawal: " + result.error);
    } else {
      alert(`Withdrawal ${status} successfully!`);
      load();
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Manage Withdrawals</h1>
      <div className="mt-6 space-y-3">
        {withdrawals.map((w) => (
          <div key={w.id as string} className="cursor-pointer" onClick={() => window.location.href = `/admin/withdrawals/${w.id as string}`}>
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{w.full_name as string} · {formatCurrency(w.amount as number)}</p>
                  <p className="text-sm text-text-muted">
                    {(w.campaigns as { title: string })?.title} · {w.payment_method as string} · {w.phone_number as string}
                  </p>
                  <p className="text-sm">Fee: {formatCurrency(w.platform_fee as number)} · Net: {formatCurrency(w.net_amount as number)}</p>
                  <p className="text-xs text-text-muted">{formatDate(w.created_at as string)}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge className={getStatusColor(w.status as string)}>{w.status as string}</Badge>
                  {w.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => process(w.id as string, "approved")}>Approve</Button>
                      <Button size="sm" onClick={() => process(w.id as string, "paid")}>Mark Paid</Button>
                      <Button size="sm" variant="danger" onClick={() => process(w.id as string, "rejected")}>Reject</Button>
                    </>
                  )}
                  {w.status === "approved" && (
                    <Button size="sm" onClick={() => process(w.id as string, "paid")}>Mark Paid</Button>
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
