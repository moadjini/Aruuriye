import { Suspense } from "react";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { SearchBar } from "@/components/campaigns/search-bar";
import { createClient } from "@/lib/supabase/server";

interface SearchParams {
  q?: string;
  category?: string;
  location?: string;
  featured?: string;
}

async function getCampaigns(params: SearchParams) {
  const supabase = await createClient();
  let query = supabase
    .from("campaigns")
    .select("*, profiles(full_name, verification_level), categories(name, slug)")
    .in("status", ["active", "verified", "completed"]);

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }
  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (params.location) {
    query = query.ilike("location", `%${params.location}%`);
  }
  if (params.featured === "true") {
    query = query.eq("is_featured", true);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return data || [];
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const campaigns = await getCampaigns(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Explore Campaigns</h1>
        <p className="mt-2 text-text-muted">
          Discover and support causes that matter in Somalia
        </p>
      </div>

      <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-gray-100" />}>
        <SearchBar />
      </Suspense>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="py-20 text-center text-text-muted">
          <p className="text-lg">No campaigns found</p>
          <p className="mt-2 text-sm">Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
}
