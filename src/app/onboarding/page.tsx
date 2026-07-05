"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { updateProfileAction } from "@/app/actions/platform";
import { User, MapPin, Phone } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user already has profile info
    const checkProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone_number, city")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && profile.full_name && profile.phone_number) {
        // User already has profile info, redirect to campaigns
        router.push("/campaigns");
      } else if (profile) {
        // Pre-fill existing data
        setFullName(profile.full_name || "");
        setPhone(profile.phone_number || "");
        setCity(profile.city || "");
      }
    };

    checkProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const result = await updateProfileAction({
      full_name: fullName,
      phone_number: phone,
      city: city,
    });

    if (result.error) {
      setError("Failed to update profile. Please try again.");
      setLoading(false);
      return;
    }

    // Redirect to campaigns after successful onboarding
    router.push("/campaigns");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-light/20 to-indigo-50/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Complete Your Profile</h1>
          <p className="text-text-muted">
            Welcome to Aruuriye! Please provide a few details to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="City"
            placeholder="Enter your city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Complete Profile
          </Button>
        </form>

        <p className="text-xs text-text-muted text-center mt-6">
          You can update this information later in your profile settings.
        </p>
      </Card>
    </div>
  );
}
