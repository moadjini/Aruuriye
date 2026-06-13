"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    platform_fee_percent: "5",
    evc_business_number: "619603035",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("platform_settings").select("*").then(({ data }) => {
      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item: { key: string; value: string }) => {
          settingsMap[item.key] = item.value;
        });
        setSettings({
          platform_fee_percent: settingsMap.platform_fee_percent || "5",
          evc_business_number: settingsMap.evc_business_number || "619603035",
        });
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    const { error: feeError } = await supabase
      .from("platform_settings")
      .upsert({
        key: "platform_fee_percent",
        value: settings.platform_fee_percent.toString(),
      }, { onConflict: "key" });

    const { error: evcError } = await supabase
      .from("platform_settings")
      .upsert({
        key: "evc_business_number",
        value: settings.evc_business_number,
      }, { onConflict: "key" });

    if (feeError || evcError) {
      setMessage("Failed to save settings: " + (feeError?.message || evcError?.message));
    } else {
      setMessage("Settings saved successfully!");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-text">Admin Settings</h1>
      <p className="mt-1 text-text-muted">Configure platform-wide settings</p>

      <Card className="mt-6">
        <CardHeader><CardTitle>Platform Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Platform Fee Percentage (%)"
            type="number"
            min="0"
            max="50"
            value={settings.platform_fee_percent}
            onChange={(e) => setSettings({ ...settings, platform_fee_percent: e.target.value })}
          />
          <Input
            label="EVC Business Number"
            value={settings.evc_business_number}
            onChange={(e) => setSettings({ ...settings, evc_business_number: e.target.value })}
          />
          {message && (
            <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
              {message}
            </p>
          )}
          <Button onClick={handleSave} loading={loading}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
