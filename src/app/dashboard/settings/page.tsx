"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { VerificationBadge } from "@/components/ui/verification-badge";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, string> | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data);
          reset({ full_name: data.full_name || "", phone_number: data.phone_number || "", city: data.city || "" });
        }
      });
    });
  }, [reset]);

  const onSubmit = async (data: { full_name: string; phone_number: string; city: string }) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
    
    if (error) {
      alert("Failed to update profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
      // Refresh profile data
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data: updatedProfile }) => {
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-text">Settings</h1>
      
      {profile?.verification_level && profile.verification_level !== "none" && (
        <div className="mt-2 flex items-center gap-1.5 bg-secondary-light/45 border border-secondary/5 rounded-lg py-1.5 px-3 w-fit select-none">
          <span className="text-xs text-text-muted">Account Tier:</span>
          <VerificationBadge level={profile.verification_level} showText />
        </div>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" {...register("full_name")} error={errors.full_name?.message as string} />
            <Input label="Phone Number" {...register("phone_number")} error={errors.phone_number?.message as string} />
            <Input label="City" {...register("city")} error={errors.city?.message as string} />
            <Input label="Email" value={profile?.email || ""} disabled />
            <Button type="submit" loading={loading}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

