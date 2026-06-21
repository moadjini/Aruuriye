"use client";

import { useState } from "react";
import { Share2, Check, Link2, Facebook, Twitter, MessageCircle } from "lucide-react";
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

  const shareMessage = title 
    ? `Help support "${title}" on Aruuriye - Somalia's trusted crowdfunding platform. Every donation makes a difference! ${url}`
    : `Check out this campaign on Aruuriye - Somalia's trusted crowdfunding platform. ${url}`;

  const copyLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: title || "Campaign on Aruuriye",
          text: shareMessage,
          url: url
        });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareMessage)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
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
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={shareToFacebook} className={className}>
        <Facebook className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={shareToTwitter} className={className}>
        <Twitter className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={shareToWhatsApp} className={className}>
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={copyLink} className={className}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
