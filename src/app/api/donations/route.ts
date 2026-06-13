import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { donationSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const parsed = donationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("donations")
    .insert({
      campaign_id: body.campaign_id,
      donor_id: user?.id || null,
      ...parsed.data,
      payment_method: "evc_plus",
      status: "pending_verification",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
