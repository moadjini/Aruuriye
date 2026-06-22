import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ShareButton } from "@/components/campaigns/share-button";
import {
  formatCurrency,
  calculateProgress,
  daysRemaining,
} from "@/lib/utils";
import type { Campaign } from "@/types/database";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { Button } from "@/components/ui/button";

interface CampaignCardProps {
  campaign: Campaign & {
    profiles?: { full_name: string | null; verification_level: string };
    categories?: { name: string; slug: string };
  };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = calculateProgress(campaign.raised_amount, campaign.goal_amount);
  const days = daysRemaining(campaign.end_date);
  const isEndingSoon = days !== null && days <= 7;
  const percentage = Math.round(progress);

  return (
    <Card className="overflow-hidden p-0 h-full flex flex-col hover:border-secondary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-hover w-full animate-scale-in">
      <Link href={`/campaigns/${campaign.slug}`} className="flex flex-1 flex-col">
        <div className="relative w-full aspect-video bg-slate-100">
          {campaign.cover_image_url ? (
            <Image src={campaign.cover_image_url} alt={campaign.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary/10 to-indigo-500/10 text-secondary/30 text-3xl font-extrabold select-none">
              {campaign.title.charAt(0)}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            {campaign.categories && (
              <Badge className="bg-white/90 text-text text-xs border border-gray-100 backdrop-blur-sm">
                {campaign.categories.name}
              </Badge>
            )}
            {isEndingSoon && (
              <Badge className="bg-red-500 text-white text-xs border border-red-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Ending Soon
              </Badge>
            )}
          </div>
          {percentage >= 50 && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-secondary text-white text-xs border border-secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                {percentage}%
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-2 font-semibold text-text hover:text-secondary transition-colors text-sm sm:text-base leading-snug break-words">{campaign.title}</h3>
          {campaign.profiles && (
            <div className="mt-1 flex items-center text-xs text-text-muted flex-wrap gap-2">
              <span>by {campaign.profiles.full_name || "Anonymous"}</span>
              <VerificationBadge level={campaign.profiles.verification_level} />
            </div>
          )}
          <div className="mt-3">
            <ProgressBar value={progress} />
            <div className="mt-1 flex justify-between text-xs sm:text-sm">
              <span className="font-semibold text-secondary">{formatCurrency(campaign.raised_amount)}</span>
              <span className="text-text-muted">of {formatCurrency(campaign.goal_amount)}</span>
            </div>
            <div className="mt-1 text-right text-xs text-text-muted">
              {percentage}% funded
            </div>
          </div>
          <div className="mt-auto pt-3 flex flex-wrap gap-2 sm:gap-3 text-xs text-text-muted border-t border-gray-50/80">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.donor_count} donors</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{campaign.location}</span>
            {days !== null && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{days}d left</span>}
          </div>
        </div>
      </Link>
      <div className="border-t border-gray-50/80 px-4 py-2 sm:px-5 flex justify-between items-center bg-slate-50/50 gap-2">
        <ShareButton slug={campaign.slug} title={campaign.title} variant="link" />
        <Link href={`/campaigns/${campaign.slug}`} className="flex-1">
          <Button size="sm" className="w-full">Donate Now</Button>
        </Link>
      </div>
    </Card>
  );
}

