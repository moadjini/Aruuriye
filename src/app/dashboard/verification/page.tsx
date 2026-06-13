"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getVerificationBadge } from "@/lib/utils";
import { Shield } from "lucide-react";

const DOC_TYPES = [
  { value: "national_id", label: "National ID" },
  { value: "student_id", label: "Student ID" },
  { value: "medical_report", label: "Medical Report" },
  { value: "organization_doc", label: "Organization Document" },
];

const LEVELS = [
  { value: "level_1", label: "Level 1 - Phone Verified" },
  { value: "level_2", label: "Level 2 - Identity Verified" },
  { value: "level_3", label: "Level 3 - Trusted Fundraiser" },
];

export default function VerificationPage() {
  const [level, setLevel] = useState("level_2");
  const [docType, setDocType] = useState("national_id");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { data: upload, error: uploadError } = await supabase.storage.from("verification-docs").upload(path, file);

    if (uploadError) {
      alert("Failed to upload document: " + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("verification-docs").getPublicUrl(path);

    // Use the proper server action
    const { submitVerificationRequestAction } = await import("@/app/actions/platform");
    const result = await submitVerificationRequestAction(user.id, level, docType, publicUrl);

    if (result.error) {
      alert("Failed to submit verification: " + result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-text">Verification</h1>
      <p className="mt-1 text-text-muted">Build trust with verified badges</p>

      <div className="mt-6 space-y-3">
        {["level_1", "level_2", "level_3"].map((l) => {
          const badge = getVerificationBadge(l);
          return (
            <div key={l} className="flex items-center gap-3 rounded-lg border p-4">
              <Shield className="h-5 w-5 text-primary" />
              <Badge className={badge.color}>{badge.label}</Badge>
            </div>
          );
        })}
      </div>

      {success ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center">
            <p className="text-green-600 font-medium">Verification request submitted!</p>
            <p className="text-sm text-text-muted mt-1">Our team will review your documents.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader><CardTitle>Submit Verification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select label="Verification Level" options={LEVELS} value={level} onChange={(e) => setLevel(e.target.value)} />
            <Select label="Document Type" options={DOC_TYPES} value={docType} onChange={(e) => setDocType(e.target.value)} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Upload Document</label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary/20"
              />
              {file && <p className="text-xs text-text-muted mt-1">Selected: {file.name}</p>}
            </div>
            <Button onClick={handleSubmit} loading={loading} disabled={!file}>Submit for Review</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
