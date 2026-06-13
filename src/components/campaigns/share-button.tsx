"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  slug: string;
  title?: string;
  variant?: "button" | "icon" | "link";
  className?: string;
}

export function ShareButton({ slug, title, variant = "button", className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/campaigns/${slug}`
    : `/campaigns/${slug}`;

  const copyLink = async () => {
    const shareUrl = `${window.location.origin}/campaigns/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "Campaign", url: shareUrl });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={copyLink}
        className={cn("inline-flex items-center gap-1.5 text-sm text-secondary hover:underline", className)}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={copyLink}
        aria-label="Share campaign"
        className={cn("rounded-lg p-2 text-text-muted hover:bg-gray-100 hover:text-secondary", className)}
      >
        {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={copyLink} className={className}>
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copied!" : "Share"}
    </Button>
  );
}
