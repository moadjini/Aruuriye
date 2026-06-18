import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { platform_fee_percent, evc_business_number } = body;

    // Use service role client to bypass RLS
    const { error: feeError } = await supabase
      .from("platform_settings")
      .upsert({
        key: "platform_fee_percent",
        value: platform_fee_percent.toString(),
      }, { onConflict: "key" });

    if (feeError) {
      return NextResponse.json({ error: feeError.message }, { status: 500 });
    }

    const { error: evcError } = await supabase
      .from("platform_settings")
      .upsert({
        key: "evc_business_number",
        value: evc_business_number,
      }, { onConflict: "key" });

    if (evcError) {
      return NextResponse.json({ error: evcError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
