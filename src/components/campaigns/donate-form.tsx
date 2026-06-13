"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { donationSchema, type DonationInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { submitDonationAction } from "@/app/actions/platform";

interface DonateFormProps {
  campaignId: string;
  campaignTitle: string;
}

export function DonateForm({ campaignId, campaignTitle }: DonateFormProps) {
  const [step, setStep] = useState<"amount" | "submit" | "success">("amount");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<DonationInput>({ resolver: zodResolver(donationSchema) });

  const amount = watch("amount");

  const onSubmit = async (data: DonationInput) => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await submitDonationAction({
      campaign_id: campaignId,
      donor_id: user?.id || null,
      donor_name: data.donor_name,
      donor_phone: data.donor_phone,
      amount: Number(data.amount),
      transaction_reference: "",
      message: data.message,
      is_anonymous: data.is_anonymous || false,
    });

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setStep("success");
    setLoading(false);
  };

  if (step === "success") {
    return (
      <div className="mt-4 rounded-lg bg-green-50 p-5 text-center border border-green-200">
        <Check className="mx-auto h-8 w-8 text-green-600 animate-fade-in" />
        <h3 className="mt-2 font-semibold text-green-800">Donation Submitted!</h3>
        <p className="mt-1 text-sm text-green-700">
          Your donation is pending verification. The fundraiser will be notified once confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {step === "amount" && (
        <div className="space-y-4">
          <Input
            label="Donation Amount ($)"
            type="number"
            min="1"
            step="0.01"
            {...register("amount")}
            error={errors.amount?.message}
          />
          <div className="grid grid-cols-3 gap-2">
            {[10, 25, 50, 100, 250, 500].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setValue("amount", val);
                  trigger("amount");
                }}
                className={`rounded-lg border py-2 text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                  amount === val
                    ? "border-secondary bg-secondary-light/50 text-secondary"
                    : "border-gray-200 hover:border-secondary hover:bg-secondary-light/40"
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
          <Button className="w-full mt-2" onClick={() => setStep("submit")} disabled={!amount || amount <= 0}>
            Continue to Submit
          </Button>
        </div>
      )}

      {step === "submit" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("amount", { valueAsNumber: true })} />
          <Input label="Your Name" {...register("donor_name")} error={errors.donor_name?.message} />
          <Input label="Phone Number" {...register("donor_phone")} error={errors.donor_phone?.message} />
          <Textarea label="Message (optional)" {...register("message")} />
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none">
            <input type="checkbox" {...register("is_anonymous")} className="rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer" />
            Donate anonymously
          </label>
          {error && <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3">{error}</p>}
          <Button type="submit" className="w-full animate-fade-in" loading={loading}>
            Submit Donation
          </Button>
          <Button variant="ghost" className="w-full cursor-pointer" type="button" onClick={() => setStep("amount")}>
            Back
          </Button>
        </form>
      )}
    </div>
  );
}

