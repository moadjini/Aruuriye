"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { processWithdrawalAction } from "@/app/actions/platform";

interface WithdrawalWithBalance {
  id: string;
  full_name: string;
  amount: number;
  payment_method: string;
  phone_number: string;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  campaign_id: string;
  campaigns: { title: string };
  profiles: { full_name: string };
  available_balance?: number;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithBalance[]>([]);

  const load = async () => {
    const supabase = createClient();
    const { data: withdrawalsData, error } = await supabase
      .from("withdrawal_requests")
      .select("*, campaigns(title), profiles!withdrawal_requests_fundraiser_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading withdrawal requests:", JSON.stringify(error));
      alert("Failed to load withdrawal requests. Please check console for details.");
      return;
    }

    // Calculate available balance for each withdrawal
    const withdrawalsWithBalance = await Promise.all(
      (withdrawalsData || []).map(async (w) => {
        const { data: donations } = await supabase
          .from("donations")
          .select("amount")
          .eq("campaign_id", w.campaign_id)
          .eq("status", "verified");

        const totalRaised = donations?.reduce((sum, d) => sum + (d.amount as number), 0) || 0;

        const { data: withdrawals } = await supabase
          .from("withdrawal_requests")
          .select("amount")
          .eq("campaign_id", w.campaign_id)
          .in("status", ["pending", "approved", "completed"]);

        const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + (w.amount as number), 0) || 0;

        return {
          ...w,
          available_balance: totalRaised - totalWithdrawn,
        };
      })
    );

    setWithdrawals(withdrawalsWithBalance);
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
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text animate-slide-up" style={{ animationDelay: "0.1s" } as React.CSSProperties}>Manage Withdrawals</h1>
      <div className="mt-6 space-y-3">
        {withdrawals.map((w, index) => (
          <div key={w.id} className="cursor-pointer animate-slide-in-right" style={{ animationDelay: `${0.2 + index * 0.05}s` } as React.CSSProperties} onClick={() => window.location.href = `/admin/withdrawals/${w.id}`}>
            <Card className="hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{w.full_name} · {formatCurrency(w.amount)}</p>
                  <p className="text-sm text-text-muted">
                    {(w.campaigns as { title: string })?.title} · {w.payment_method} · {w.phone_number}
                  </p>
                  <p className="text-sm">Fee: {formatCurrency(w.platform_fee)} · Net: {formatCurrency(w.net_amount)}</p>
                  <p className="text-sm font-semibold text-secondary">Available Balance: {formatCurrency(w.available_balance || 0)}</p>
                  <p className="text-xs text-text-muted">{formatDate(w.created_at)}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge className={getStatusColor(w.status)}>{w.status}</Badge>
                  {w.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => process(w.id, "approved")}>Approve</Button>
                      <Button size="sm" onClick={() => process(w.id, "paid")}>Mark Paid</Button>
                      <Button size="sm" variant="danger" onClick={() => process(w.id, "rejected")}>Reject</Button>
                    </>
                  )}
                  {w.status === "approved" && (
                    <Button size="sm" onClick={() => process(w.id, "paid")}>Mark Paid</Button>
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
