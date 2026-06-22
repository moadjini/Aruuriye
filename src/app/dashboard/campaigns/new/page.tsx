"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { campaignSchema, type CampaignInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { createCampaignAction } from "@/app/actions/platform";
import { ImageCropper } from "@/components/campaigns/image-cropper";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignInput>({ resolver: zodResolver(campaignSchema) });


  useEffect(() => {
    const supabase = createClient();
    supabase.from("categories").select("id, name").then(({ data }) => {
      setCategories(
        (data || []).map((c) => ({ value: c.id, label: c.name }))
      );
    });
  }, []);

  const onSubmit = async (data: CampaignInput) => {
    if (!croppedFile) {
      setImageError("Cover photo is required. Please upload and crop an image.");
      return;
    }

    setLoading(true);
    setError("");
    setImageError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload Cover Image to Supabase storage
      const ext = croppedFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      
      const { data: upload, error: uploadError } = await supabase.storage
        .from("campaign-covers")
        .upload(path, croppedFile);

      if (uploadError) {
        setError("Failed to upload cover photo: " + uploadError.message);
        setLoading(false);
        return;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("campaign-covers")
        .getPublicUrl(path);

      // 2. Call server action to create campaign
      const res = await createCampaignAction({
        creator_id: user.id,
        title: data.title,
        description: data.description,
        story: data.story,
        goal_amount: Number(data.goal_amount),
        category_id: data.category_id,
        location: data.location,
        cover_image_url: publicUrl,
        end_date: data.end_date || null,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      router.push(`/dashboard/campaigns/${res.campaign.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
      setImageError("");
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
    setCroppedFile(croppedFile);
    setShowCropper(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImagePreview(null);
    setCoverFile(null);
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Let&apos;s Create Your Campaign</h1>
      <p className="mt-1 text-text-muted">Tell your story and start raising funds for your cause</p>

      <Card className="mt-6 shadow-sm border border-gray-150 animate-slide-up">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="What's your campaign about?" placeholder="Give your campaign a clear, descriptive title" {...register("title")} error={errors.title?.message} />
            <Textarea label="Briefly describe your campaign" placeholder="In one sentence, what are you raising money for?" {...register("description")} error={errors.description?.message} />
            <Textarea label="Tell your full story" placeholder="Share the details of your situation, why this matters, and how the funds will help" {...register("story")} />
            
            {/* Cover Photo Upload Field */}
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Add a cover photo *</label>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-secondary-light file:text-secondary hover:file:bg-secondary/20 file:cursor-pointer"
                />
                <p className="text-[10px] text-text-muted">Choose a photo that captures your campaign. Supports JPG, PNG, GIF up to 5MB. Image will be cropped to 16:9 ratio.</p>
                {croppedFile && <p className="text-xs text-green-600 mt-0.5">✓ Image cropped and ready</p>}
                {imageError && <p className="text-xs text-red-600 mt-0.5">{imageError}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="How much do you need to raise?" type="number" min="10" placeholder="Enter amount in USD" {...register("goal_amount")} error={errors.goal_amount?.message} />
              <Select label="Choose a category" options={[{ value: "", label: "Select category" }, ...categories]} {...register("category_id")} error={errors.category_id?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Where is this campaign located?" placeholder="City, region" {...register("location")} error={errors.location?.message} />
              <Input label="When should it end?" type="date" {...register("end_date")} />
            </div>
            {error && <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Submit for Review</Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Your campaign will be reviewed by our team before going live. This helps ensure all campaigns are legitimate and trustworthy.
            </p>
          </form>
        </CardContent>
      </Card>

      {showCropper && imagePreview && (
        <ImageCropper
          image={imagePreview}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}

