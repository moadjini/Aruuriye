"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getVerificationBadge } from "@/lib/utils";
import { Shield, Camera } from "lucide-react";

const DOC_TYPES = [
  { value: "national_id", label: "National ID" },
];

export default function VerificationPage() {
  const [docType, setDocType] = useState("national_id");
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [facePhotoFile, setFacePhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!nationalIdFile || !facePhotoFile) {
      alert("Please upload both your National ID and a face photo");
      return;
    }

    // Restrict to image files only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(nationalIdFile.type) || !allowedTypes.includes(facePhotoFile.type)) {
      alert("Only JPEG, JPG, and PNG files are allowed");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has completed profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile || !profile.full_name || !profile.avatar_url) {
      alert("Please complete your profile (add your name and profile picture) before requesting verification");
      setLoading(false);
      return;
    }

    // Upload National ID
    const nationalIdExt = nationalIdFile.name.split(".").pop();
    const nationalIdPath = `${user.id}/national_id_${Date.now()}.${nationalIdExt}`;
    const { data: nationalIdUpload, error: nationalIdError } = await supabase.storage.from("verification-docs").upload(nationalIdPath, nationalIdFile);

    if (nationalIdError) {
      alert("Failed to upload National ID: " + nationalIdError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl: nationalIdUrl } } = supabase.storage.from("verification-docs").getPublicUrl(nationalIdPath);

    // Upload Face Photo
    const facePhotoExt = facePhotoFile.name.split(".").pop();
    const facePhotoPath = `${user.id}/face_photo_${Date.now()}.${facePhotoExt}`;
    const { data: facePhotoUpload, error: facePhotoError } = await supabase.storage.from("verification-docs").upload(facePhotoPath, facePhotoFile);

    if (facePhotoError) {
      alert("Failed to upload face photo: " + facePhotoError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl: facePhotoUrl } } = supabase.storage.from("verification-docs").getPublicUrl(facePhotoPath);

    // Combine both URLs with a separator
    const combinedDocumentUrl = `${nationalIdUrl}|||${facePhotoUrl}`;

    // Use the proper server action with single verification level
    // Note: Using "level_1" temporarily until database migration runs to add "verified" to enum
    const { submitVerificationRequestAction } = await import("@/app/actions/platform");
    const result = await submitVerificationRequestAction(user.id, "level_1", docType, combinedDocumentUrl);

    if (result.error) {
      alert("Failed to submit verification: " + result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Verification</h1>
      <p className="mt-1 text-text-muted">Get verified with a blue checkmark</p>

      <div className="mt-6 space-y-3 animate-slide-up">
        <div className="flex items-center gap-3 rounded-lg border p-4 bg-secondary-light/20">
          <Camera className="h-5 w-5 text-secondary" />
          <Badge className="bg-blue-500 text-white">✓ Verified</Badge>
          <span className="text-sm text-text-muted">Single verification level - Blue checkmark badge</span>
        </div>
      </div>

      {success ? (
        <Card className="mt-6 animate-scale-in">
          <CardContent className="pt-6 text-center">
            <p className="text-green-600 font-medium">Verification request submitted!</p>
            <p className="text-sm text-text-muted mt-1">Our team will review your National ID and face photo to verify your identity.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 animate-scale-in">
          <CardHeader><CardTitle>Submit Verification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p className="font-medium">Requirements:</p>
              <ul className="mt-1 list-disc list-inside text-xs">
                <li>Complete your profile (name and profile picture)</li>
                <li>Upload a clear National ID photo</li>
                <li>Upload a clear face photo (selfie) for KYC verification</li>
                <li>Only JPEG, JPG, or PNG files accepted</li>
                <li>Captured photos are allowed</li>
              </ul>
            </div>
            <Select label="Document Type" options={DOC_TYPES} value={docType} onChange={(e) => setDocType(e.target.value)} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Upload National ID</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary/20"
              />
              {nationalIdFile && <p className="text-xs text-text-muted mt-1">Selected: {nationalIdFile.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Upload Face Photo (Selfie)</label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => setFacePhotoFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary/20"
              />
              {facePhotoFile && <p className="text-xs text-text-muted mt-1">Selected: {facePhotoFile.name}</p>}
            </div>
            <Button onClick={handleSubmit} loading={loading} disabled={!nationalIdFile || !facePhotoFile}>Submit for Review</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
