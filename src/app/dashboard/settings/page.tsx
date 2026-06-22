"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { createServiceClient } from "@/lib/supabase/server";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { User, Camera } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Record<string, string> | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setProfile(data);
          reset({ full_name: data.full_name || "", phone_number: data.phone_number || "", city: data.city || "" });
        }
      });
    });
  }, [reset]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

    if (uploadError) {
      alert("Failed to upload avatar: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

    if (updateError) {
      alert("Failed to update profile: " + updateError.message);
    } else {
      alert("Avatar updated successfully!");
      setProfile({ ...profile, avatar_url: publicUrl });
    }

    setUploading(false);
  };

  const onSubmit = async (data: { full_name: string; phone_number: string; city: string }) => {
    setLoading(true);
    const supabase = await createServiceClient();
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
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data: updatedProfile }) => {
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {profile?.verification_level && profile.verification_level !== "none" && (
        <div className="mt-2 flex items-center gap-1.5 bg-secondary-light/45 border border-secondary/5 rounded-lg py-1.5 px-3 w-fit select-none animate-scale-in">
          <span className="text-xs text-text-muted">Account Tier:</span>
          <VerificationBadge level={profile.verification_level} showText />
        </div>
      )}

      <Card className="mt-6 animate-slide-up">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-20 h-20">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  fill
                  className="rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-secondary-light/50 flex items-center justify-center border-2 border-gray-200">
                  <User className="h-8 w-8 text-secondary" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-secondary text-white p-1.5 rounded-full cursor-pointer hover:bg-secondary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <div>
              <p className="font-medium text-text">{profile?.full_name || "Your Name"}</p>
              <p className="text-sm text-text-muted">{profile?.email}</p>
            </div>
          </div>
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

