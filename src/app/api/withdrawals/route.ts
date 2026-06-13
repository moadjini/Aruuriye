import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withdrawalSchema } from "@/lib/validations";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";
import { calculatePlatformFee } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const fee = calculatePlatformFee(parsed.data.amount, PLATFORM_FEE_PERCENT);
  const net = parsed.data.amount - fee;

  const { data, error } = await supabase
    .from("withdrawal_requests")
    .insert({
      fundraiser_id: user.id,
      ...parsed.data,
      platform_fee: fee,
      net_amount: net,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
