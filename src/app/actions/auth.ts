"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterInput } from "@/lib/validations";

export async function registerUserAction(data: RegisterInput) {
  // Validate schema on the server
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid registration data" };
  }

  const supabase = await createServiceClient();

  // 1. Create user in Supabase Auth (admin client bypasses rate limits/SMTP limits)
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-confirm email to bypass SMTP limits
    user_metadata: {
      full_name: data.full_name,
      phone_number: data.phone_number,
      city: data.city,
      role: "visitor",
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!userData?.user) {
    return { error: "Failed to create user account." };
  }

  const userId = userData.user.id;

  try {
    // 2. The db trigger `on_auth_user_created` will have inserted them into `profiles` as 'fundraiser'.
    // We immediately force-update their role to 'visitor' to meet the requirement.
    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: "visitor" })
      .eq("id", userId);

    if (roleError) {
      console.error("Error setting visitor role:", roleError.message);
      // Continue anyway, but log it
    }

    // 3. Send welcome notification
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Welcome to HaddaICaawi!",
      message: "You have signed up successfully as a visitor. To start creating campaigns, please request a fundraiser role via the Become Fundraiser page.",
      type: "info",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Registration post-processing failed:", err);
    return { success: true }; // User was created, so allow login flow
  }
}
