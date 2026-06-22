"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, ArrowRight, Info, Home } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [step, setStep] = useState<"amount" | "submit" | "success">("amount");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [evcNumber, setEvcNumber] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<DonationInput>({ resolver: zodResolver(donationSchema) });

  const amount = watch("amount");

  useEffect(() => {
    const fetchEvcNumber = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "evc_business_number")
        .single();
      if (data) {
        setEvcNumber(data.value);
      }
    };
    fetchEvcNumber();
  }, []);

  const copyEvcNumber = () => {
    navigator.clipboard.writeText(evcNumber);
    alert("EVC number copied to clipboard!");
  };

  const onSubmit = async (data: DonationInput) => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const res = await submitDonationAction({
        campaign_id: campaignId,
        donor_id: user?.id || null,
        donor_name: data.donor_name,
        donor_phone: data.donor_phone,
        amount: Number(data.amount),
        message: data.message,
        is_anonymous: data.is_anonymous || false,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      setStep("success");
    } catch (err) {
      console.error("Donation error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-text mb-2">Thank You for Your Donation!</h3>
          <p className="text-text-muted mb-4">
            Your donation of <span className="font-semibold text-secondary">${amount}</span> has been submitted successfully.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong><br />
              Your donation will be reviewed by our team. Once verified, it will appear on the campaign progress and the fundraiser will be notified.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setStep("amount")}
              className="flex-1"
            >
              Make Another Donation
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 animate-fade-in">
      {step === "amount" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">1</div>
            <span className="text-sm font-medium">Choose your donation amount</span>
          </div>
          <Input
            label="How much would you like to give?"
            type="number"
            min="1"
            step="0.01"
            placeholder="Enter amount"
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
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === "submit" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("amount", { valueAsNumber: true })} />

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">2</div>
            <span className="text-sm font-medium">Complete your donation</span>
          </div>

          {/* EVC Payment Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Here&apos;s how to donate</h4>
                <p className="text-sm text-blue-800">
                  Transfer <strong>${amount}</strong> to the EVC Plus number below. This is a secure payment method used in Somalia.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border border-blue-300 rounded-lg p-3 mb-3">
              <span className="text-xl font-bold text-blue-900 flex-1">{evcNumber}</span>
              <button
                type="button"
                onClick={copyEvcNumber}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-white/50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>After transferring:</strong> Please fill in your details below so we can verify your donation and add it to the campaign progress.
              </p>
            </div>
          </div>

          <Input label="Your name" placeholder="Enter your full name" {...register("donor_name")} error={errors.donor_name?.message} />
          <Input label="Your phone number" placeholder="For donation verification" {...register("donor_phone")} error={errors.donor_phone?.message} />
          <Textarea label="Add a message (optional)" placeholder="Share a few words of encouragement..." {...register("message")} />
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none">
            <input type="checkbox" {...register("is_anonymous")} className="rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer" />
            I&apos;d like to donate anonymously
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

