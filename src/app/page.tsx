import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { SearchBar } from "@/components/campaigns/search-bar";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Heart, Sparkles, HandHelping } from "lucide-react";

async function getCampaigns() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*, profiles(full_name, verification_level), categories(name, slug)")
    .in("status", ["active", "verified"])
    .order("created_at", { ascending: false })
    .limit(6);
  return data || [];
}

export default async function HomePage() {
  const campaigns = await getCampaigns();

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[30%] w-[300px] h-[300px] rounded-full bg-blue-400/5 blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Premium Hero Section */}
        <section className="relative rounded-3xl border border-secondary/10 bg-gradient-to-br from-white via-white to-secondary-light/20 p-8 sm:p-12 shadow-premium shadow-glow animate-slide-up text-center overflow-hidden">
          <div className="absolute top-3 right-3 opacity-10 sm:opacity-25 pointer-events-none animate-bounce-subtle">
            <Sparkles className="h-24 w-24 text-secondary" />
          </div>

          <div className="mx-auto max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-light px-3.5 py-1 text-xs font-bold text-secondary border border-secondary/10 animate-scale-in">
              <HandHelping className="h-3.5 w-3.5" />
              Somalia&apos;s Crowdfunding Platform
            </div>

            
            <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl leading-tight">
              Support Urgent Causes & <br />
              <span className="bg-gradient-to-r from-secondary to-indigo-600 bg-clip-text text-transparent">
                Empower Communities
              </span>
            </h1>
            
            <p className="mx-auto max-w-lg text-sm sm:text-base text-text-muted leading-relaxed">
              Join thousands of Somalis who are making an impact. Securely donate via EVC Plus, Sahal, or Zaad to medical emergencies, education scholarships, and local charities.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row pt-4">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto min-w-[200px] shadow-lg shadow-secondary/10 cursor-pointer animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  Start Fundraising
                </Button>
              </Link>
              <Link href="/campaigns" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] bg-white cursor-pointer animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  Explore Campaigns
                </Button>
              </Link>
            </div>

            <div className="mx-auto mt-8 max-w-xl pt-2">
              <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-gray-100" />}>
                <SearchBar />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Mature Platform Statistics */}
        <section className="py-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { value: "$145K+", label: "Total Funds Raised", icon: Heart },
            { value: "480+", label: "Verified Fundraisers", icon: ShieldCheck },
            { value: "2.1K+", label: "Successful Donations", icon: HandHelping },
            { value: "98.7%", label: "Manual Verification Rate", icon: ShieldCheck },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white border border-gray-100/80 rounded-2xl p-4 shadow-premium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium-hover animate-scale-in" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="inline-flex rounded-lg bg-secondary-light/50 p-2 text-secondary mb-1">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-extrabold text-text leading-none">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-text-muted mt-1 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </section>

        {/* Active Campaigns List */}
        <section className="pb-16 pt-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Active Campaigns</h2>
            <Link href="/campaigns" className="text-sm font-semibold text-secondary hover:underline flex items-center gap-1">
              View all campaigns
            </Link>
          </div>

          {campaigns.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign, i) => (
                <div key={campaign.id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-hover animate-scale-in" style={{ animationDelay: `${0.7 + i * 0.1}s` }}>
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center bg-white shadow-premium animate-scale-in">
              <Heart className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-text-muted mt-2 font-medium">No campaigns yet.</p>
              <Link href="/auth/register" className="mt-4 inline-block">
                <Button>Be the first to fundraise</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

