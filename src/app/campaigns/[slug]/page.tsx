import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, Users, Clock, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DonateForm } from "@/components/campaigns/donate-form";
import { CommentSection } from "@/components/campaigns/comment-section";
import { ReportButton } from "@/components/campaigns/report-button";
import { ShareButton } from "@/components/campaigns/share-button";
import {
  formatCurrency,
  formatDate,
  calculateProgress,
  daysRemaining,
  getStatusColor,
} from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";

async function getCampaign(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*, profiles(full_name, verification_level, avatar_url), categories(name)")
    .eq("slug", slug)
    .single();

  if (data) {
    await supabase
      .from("campaigns")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", data.id);
  }

  return data;
}

async function getCampaignData(campaignId: string) {
  const supabase = await createClient();
  const [updates, donations, gallery, comments] = await Promise.all([
    supabase.from("campaign_updates").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: false }),
    supabase.from("donations").select("*").eq("campaign_id", campaignId).eq("status", "verified").order("created_at", { ascending: false }).limit(20),
    supabase.from("campaign_gallery").select("*").eq("campaign_id", campaignId).order("sort_order"),
    supabase.from("comments").select("*, profiles(full_name, avatar_url)").eq("campaign_id", campaignId).eq("is_hidden", false).order("created_at", { ascending: false }),
  ]);

  return {
    updates: updates.data || [],
    donations: donations.data || [],
    gallery: gallery.data || [],
    comments: comments.data || [],
  };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const { updates, donations, gallery, comments } = await getCampaignData(campaign.id);
  const progress = calculateProgress(campaign.raised_amount, campaign.goal_amount);
  const days = daysRemaining(campaign.end_date);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Cover */}
          <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-xl bg-slate-100">
            {campaign.cover_image_url ? (
              <Image src={campaign.cover_image_url} alt={campaign.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/10 to-indigo-500/10 text-secondary/30 text-5xl font-extrabold select-none">
                {campaign.title.charAt(0)}
              </div>
            )}
          </div>

          {/* Title & Meta */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {campaign.categories && (
                <Badge className="bg-secondary-light text-secondary border border-secondary/10">{campaign.categories.name}</Badge>
              )}
              <Badge className={getStatusColor(campaign.status)}>{campaign.status.replace("_", " ")}</Badge>
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-text sm:text-3xl leading-tight">{campaign.title}</h1>
              <ShareButton slug={campaign.slug} title={campaign.title} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
              <span className="flex items-center gap-1">
                by <strong className="text-text">{campaign.profiles?.full_name || "Anonymous"}</strong>
                <VerificationBadge level={campaign.profiles?.verification_level} showText />
              </span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4 shrink-0 text-text-muted/70" />{campaign.location}</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4 shrink-0 text-text-muted/70" />{campaign.donor_count} donors</span>
              {days !== null && <span className="flex items-center gap-1"><Clock className="h-4 w-4 shrink-0 text-text-muted/70" />{days} days left</span>}
            </div>
          </div>


          {/* Story */}
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold">Story</h2>
            <p className="mt-3 whitespace-pre-wrap text-text-muted leading-relaxed">
              {campaign.story || campaign.description}
            </p>
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold">Photos</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((img) => (
                  <div key={img.id} className="relative h-40 overflow-hidden rounded-lg">
                    <Image src={img.image_url} alt={img.caption || ""} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Updates */}
          {updates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold">Updates</h2>
              <div className="mt-4 space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold">{update.title}</h3>
                    <p className="mt-1 text-xs text-text-muted">{formatDate(update.created_at)}</p>
                    <p className="mt-3 text-sm text-text-muted whitespace-pre-wrap">{update.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donation History */}
          {donations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold">Recent Donations</h2>
              <div className="mt-4 space-y-2">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium">
                      {d.is_anonymous ? "Anonymous" : d.donor_name}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-secondary">{formatCurrency(d.amount)}</span>
                      <p className="text-xs text-text-muted">{formatDate(d.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentSection campaignId={campaign.id} comments={comments} />

          {/* Report */}
          <div className="flex justify-end">
            <ReportButton campaignId={campaign.id} />
          </div>
        </div>

        {/* Sidebar - Donate */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <ProgressBar value={progress} showLabel />
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-secondary">{formatCurrency(campaign.raised_amount)}</span>
                <span className="text-sm text-text-muted">raised of {formatCurrency(campaign.goal_amount)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-semibold text-text">{campaign.donor_count}</p>
                  <p className="text-text-muted">Donors</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="font-semibold text-text">{days ?? "—"}</p>
                  <p className="text-text-muted">Days Left</p>
                </div>
              </div>
              {campaign.status === "active" || campaign.status === "verified" ? (
                <DonateForm campaignId={campaign.id} campaignTitle={campaign.title} />
              ) : (
                <p className="mt-4 text-center text-sm text-text-muted">
                  This campaign is not currently accepting donations.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-secondary" />
                <span className="font-medium">Trust & Safety</span>
              </div>
              <p className="mt-2 text-xs text-text-muted">
                All donations are manually verified. Campaign creators are identity-checked by our team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
