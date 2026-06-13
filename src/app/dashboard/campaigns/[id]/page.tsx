"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getStatusColor, calculateProgress } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import Link from "next/link";
import { ShareButton } from "@/components/campaigns/share-button";

export default function CampaignManagePage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Record<string, unknown> | null>(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updates, setUpdates] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("campaigns").select("*, categories(name)").eq("id", id).single().then(({ data }) => setCampaign(data));
    supabase.from("campaign_updates").select("*").eq("campaign_id", id).order("created_at", { ascending: false }).then(({ data }) => setUpdates(data || []));
  }, [id]);

  const postUpdate = async () => {
    if (!updateTitle || !updateContent) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("campaign_updates").insert({
      campaign_id: id,
      author_id: user.id,
      title: updateTitle,
      content: updateContent,
    });

    setUpdateTitle("");
    setUpdateContent("");
    setLoading(false);
    const { data } = await supabase.from("campaign_updates").select("*").eq("campaign_id", id).order("created_at", { ascending: false });
    setUpdates(data || []);
  };

  if (!campaign) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.title as string}</h1>
          <Badge className={getStatusColor(campaign.status as string)}>{(campaign.status as string).replace("_", " ")}</Badge>
        </div>
        <div className="flex gap-2">
          <ShareButton slug={campaign.slug as string} title={campaign.title as string} />
          <Link href={`/campaigns/${campaign.slug}`}>
            <Button variant="outline" size="sm">View Page</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ProgressBar value={calculateProgress(campaign.raised_amount as number, campaign.goal_amount as number)} showLabel />
          <div className="mt-2 flex justify-between text-sm">
            <span className="font-semibold text-primary">{formatCurrency(campaign.raised_amount as number)}</span>
            <span className="text-text-muted">of {formatCurrency(campaign.goal_amount as number)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Post Update</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Title" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} />
          <Textarea label="Content" value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} />
          <Button onClick={postUpdate} loading={loading}>Post Update</Button>
        </CardContent>
      </Card>

      {updates.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Updates ({updates.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {updates.map((u) => (
              <div key={u.id as string} className="border-b pb-3">
                <p className="font-medium">{u.title as string}</p>
                <p className="text-sm text-text-muted mt-1">{u.content as string}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
