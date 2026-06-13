"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { withdrawalSchema, type WithdrawalInput } from "@/lib/validations";
import { PAYMENT_METHODS, PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, calculatePlatformFee, formatDate, getStatusColor } from "@/lib/utils";

export default function WithdrawalsPage() {
  const [campaigns, setCampaigns] = useState<{ id: string; title: string; raised_amount: number }[]>([]);
  const [withdrawals, setWithdrawals] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<WithdrawalInput>({
    resolver: zodResolver(withdrawalSchema),
  });

  const amount = watch("amount") || 0;
  const fee = calculatePlatformFee(Number(amount), PLATFORM_FEE_PERCENT);
  const net = Number(amount) - fee;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("campaigns").select("id, title, raised_amount").eq("creator_id", user.id).in("status", ["active", "verified"]).then(({ data }) => setCampaigns(data || []));
      supabase.from("withdrawal_requests").select("*").eq("fundraiser_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setWithdrawals(data || []));
    });
  }, []);

  const onSubmit = async (data: WithdrawalInput) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("withdrawal_requests").insert({
      campaign_id: data.campaign_id,
      fundraiser_id: user.id,
      full_name: data.full_name,
      phone_number: data.phone_number,
      payment_method: data.payment_method,
      amount: data.amount,
      platform_fee: fee,
      net_amount: net,
    });

    setShowForm(false);
    setLoading(false);
    window.location.reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Withdrawals</h1>
        <Button onClick={() => setShowForm(!showForm)}>Request Withdrawal</Button>
      </div>

      {showForm && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Request Withdrawal</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <Select
                label="Campaign"
                options={[{ value: "", label: "Select campaign" }, ...campaigns.map((c) => ({ value: c.id, label: `${c.title} (${formatCurrency(c.raised_amount)})` }))]}
                {...register("campaign_id")}
                error={errors.campaign_id?.message}
              />
              <Input label="Full Name" {...register("full_name")} error={errors.full_name?.message} />
              <Input label="Phone Number" {...register("phone_number")} error={errors.phone_number?.message} />
              <Select
                label="Payment Method"
                options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
                {...register("payment_method")}
              />
              <Input label="Amount ($)" type="number" {...register("amount")} error={errors.amount?.message} />
              {amount > 0 && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span>Amount</span><span>{formatCurrency(Number(amount))}</span></div>
                  <div className="flex justify-between text-text-muted"><span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span><span>-{formatCurrency(fee)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1"><span>You Receive</span><span className="text-primary">{formatCurrency(net)}</span></div>
                </div>
              )}
              <Button type="submit" loading={loading}>Submit Request</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 space-y-3">
        {withdrawals.map((w) => (
          <Card key={w.id as string}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{formatCurrency(w.amount as number)}</p>
                <p className="text-sm text-text-muted">{formatDate(w.created_at as string)} · Net: {formatCurrency(w.net_amount as number)}</p>
              </div>
              <Badge className={getStatusColor(w.status as string)}>{w.status as string}</Badge>
            </div>
          </Card>
        ))}
        {withdrawals.length === 0 && <p className="text-center py-8 text-text-muted">No withdrawal requests yet</p>}
      </div>
    </div>
  );
}
