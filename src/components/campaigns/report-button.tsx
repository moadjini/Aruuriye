"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { REPORT_REASONS } from "@/lib/constants";
import { submitReportAction } from "@/app/actions/platform";
import { createClient } from "@/lib/supabase/client";

export function ReportButton({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason || description.length < 20) return;
    setLoading(true);
    setError("");
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await submitReportAction(
      campaignId,
      user?.id || null,
      reason,
      description
    );

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return <p className="text-sm text-green-600">Report submitted. Thank you.</p>;
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" /> Report Campaign
      </Button>
    );
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-gray-200 p-4 space-y-3">
      <h3 className="font-semibold text-sm">Report this Campaign</h3>
      <Select
        options={[{ value: "", label: "Select reason" }, ...REPORT_REASONS.map((r) => ({ value: r.value, label: r.label }))] }
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Textarea
        placeholder="Describe the issue (min 20 characters)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} loading={loading} disabled={!reason || description.length < 20}>
          Submit Report
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
