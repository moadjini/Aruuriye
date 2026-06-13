import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { campaignSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*, profiles(full_name, verification_level), categories(name, slug)")
    .in("status", ["active", "verified"]);

  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const location = searchParams.get("location");

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (location) query = query.ilike("location", `%${location}%`);
  if (category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", category).single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      creator_id: user.id,
      ...parsed.data,
      status: "pending_review",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
