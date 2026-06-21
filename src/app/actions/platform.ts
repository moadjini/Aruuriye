"use server";

import { createServiceClient } from "@/lib/supabase/server";
import {
  sendTelegramNotification,
  notifyNewCampaign,
  notifyNewDonation,
  notifyVerificationRequest,
  notifyFraudReport,
  notifyWithdrawalRequest,
} from "@/lib/telegram";

// Helper: send notification
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });
  if (error) {
    console.error("Error inserting notification:", error.message);
  }
}

// Submit Report
export async function submitReportAction(
  campaignId: string,
  reporterId: string | null,
  reason: string,
  description: string
) {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("reports").insert({
    campaign_id: campaignId,
    reporter_id: reporterId,
    reason,
    description,
    status: "pending",
  });

  if (error) return { error: error.message };

  // Fetch campaign and reporter details for Telegram notification
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title")
    .eq("id", campaignId)
    .single();

  let reporterName = "Anonymous";
  if (reporterId) {
    const { data: reporter } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", reporterId)
      .single();
    reporterName = reporter?.full_name || "Anonymous";
  }

  // Send Telegram notification
  await notifyFraudReport(campaign?.title || "Unknown Campaign", reporterName, reason);

  // Notify admins about the new report
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (admins) {
    for (const admin of admins) {
      await sendNotification(
        admin.id,
        "New Campaign Report",
        `A campaign has been reported for ${reason}. Please review it.`,
        "warning",
        "/admin/reports"
      );
    }
  }

  return { success: true };
}

// 1. Submit Verification Request
export async function submitVerificationRequestAction(
  userId: string,
  level: string,
  docType: string,
  docUrl: string
) {
  const supabase = await createServiceClient();

  // Insert verification request
  const { error: insertError } = await supabase.from("verification_requests").insert({
    user_id: userId,
    requested_level: level,
    document_type: docType,
    document_url: docUrl,
    status: "pending",
  });

  if (insertError) return { error: insertError.message };

  // Fetch user details for Telegram notification
  const { data: user } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Send Telegram notification
  await notifyVerificationRequest(user?.full_name || "Unknown User");

  // Update profile status (service role bypasses RLS)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ verification_status: "pending" })
    .eq("id", userId);

  if (updateError) {
    console.error("Error updating profile verification status:", updateError);
    // Don't fail the whole request if profile update fails
  }

  // Notify user
  await sendNotification(
    userId,
    "Verification Request Submitted",
    "Your blue checkmark verification request is under review. Our team will verify your National ID and profile picture.",
    "info",
    "/dashboard/verification"
  );

  return { success: true };
}

// Admin: Resolve fraud report
export async function resolveReportAction(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const freezeCampaign = formData.get("freezeCampaign") as string | null;

  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("reports").update({
    status,
    investigated_by: user?.id,
    resolved_at: new Date().toISOString(),
  }).eq("id", id);

  if (freezeCampaign && status === "resolved") {
    await supabase.from("campaigns").update({ status: "frozen" }).eq("id", freezeCampaign);
  }
}

// Admin: Direct verification (create and approve)
export async function adminVerifyUserAction(
  userId: string,
  level: string,
  adminId: string
) {
  const supabase = await createServiceClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ verification_level: level, verification_status: "verified" })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  // Log the action
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: "verify_user",
    entity_type: "user",
    entity_id: userId,
    details: { level },
  });

  // Send notification
  await sendNotification(
    userId,
    "Account Verified",
    `Your account has been verified at level ${level}.`,
    "success"
  );

  return { success: true };
}

// Auto-feature campaigns based on engagement
export async function autoFeatureCampaignsAction() {
  const supabase = await createServiceClient();

  // Calculate engagement score for active campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, raised_amount, donor_count, view_count, goal_amount")
    .eq("status", "active");

  if (!campaigns) return { success: true };

  // Calculate engagement score and sort
  const campaignScores = campaigns.map((c) => {
    const raisedRatio = (c.raised_amount as number) / (c.goal_amount as number);
    const engagementScore = (c.donor_count as number) * 10 + (c.view_count as number) * 0.1 + raisedRatio * 100;
    return { id: c.id, score: engagementScore };
  }).sort((a, b) => b.score - a.score);

  // Feature top 5 campaigns
  const topCampaigns = campaignScores.slice(0, 5);
  const topIds = topCampaigns.map((c) => c.id);

  // Update featured status
  await supabase
    .from("campaigns")
    .update({ is_featured: true })
    .in("id", topIds);

  // Unfeature others
  await supabase
    .from("campaigns")
    .update({ is_featured: false })
    .eq("status", "active")
    .not("id", "in", `(${topIds.join(",")})`);

  return { success: true, featured: topIds.length };
}

// 2. Review Verification Request (Admin)
export async function reviewVerificationAction(
  requestId: string,
  userId: string,
  status: string,
  level: string,
  adminId: string
) {
  const supabase = await createServiceClient();

  // Update request status
  const { error: requestError } = await supabase
    .from("verification_requests")
    .update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (requestError) return { error: requestError.message };

  // Update user profile based on approval/rejection
  if (status === "verified") {
    await supabase
      .from("profiles")
      .update({
        verification_level: level,
        verification_status: "verified",
        role: "fundraiser", // PROMOTE user to fundraiser!
      })
      .eq("id", userId);

    // Notify user of approval
    await sendNotification(
      userId,
      "Blue Checkmark Verified! 🎉",
      "Congratulations! Your account has been verified with the blue checkmark. You can now create campaigns!",
      "success",
      "/dashboard"
    );
  } else if (status === "rejected") {
    await supabase
      .from("profiles")
      .update({
        verification_level: "none",
        verification_status: "rejected",
      })
      .eq("id", userId);

    // Notify user of rejection
    await sendNotification(
      userId,
      "Verification Rejected",
      "Your verification request was rejected. Please upload a clear, valid National ID and re-apply.",
      "error",
      "/dashboard/verification"
    );
  }

  // Insert Admin Log
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: `verification_${status}`,
    entity_type: "verification_request",
    entity_id: requestId,
    details: { user_id: userId, level },
  });

  return { success: true };
}

// 3. Create Campaign
export async function createCampaignAction(campaignData: {
  creator_id: string;
  title: string;
  description: string;
  story?: string;
  goal_amount: number;
  category_id: string;
  location: string;
  cover_image_url: string;
  end_date?: string | null;
}) {
  const supabase = await createServiceClient();

  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      ...campaignData,
      status: "pending_review",
    })
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  // Fetch creator details for Telegram notification
  const { data: creator } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", campaignData.creator_id)
    .single();

  // Send Telegram notification
  await notifyNewCampaign(campaignData.title, creator?.full_name || "Unknown", campaignData.goal_amount);

  // Notify creator
  await sendNotification(
    campaignData.creator_id,
    "Campaign Submitted for Review",
    `Your campaign "${campaignData.title}" is pending review by our team.`,
    "info",
    `/dashboard/campaigns/${campaign.id}`
  );

  return { success: true, campaign };
}

// 4. Update Campaign Status (Admin)
export async function updateCampaignStatusAction(
  campaignId: string,
  status: string,
  reason: string | null,
  adminId: string
) {
  const supabase = await createServiceClient();

  // Fetch campaign creator
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("creator_id, title")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { error: "Campaign not found" };

  // Update status
  const { error: updateError } = await supabase
    .from("campaigns")
    .update({
      status,
      rejection_reason: reason || null,
      ...(status === "active" ? { start_date: new Date().toISOString() } : {}),
    })
    .eq("id", campaignId);

  if (updateError) return { error: updateError.message };

  // Notify creator
  let title = "";
  let message = "";
  let type = "info";

  if (status === "active") {
    title = "Campaign Live! 🚀";
    message = `Congratulations! Your campaign "${campaign.title}" has been approved and is now active.`;
    type = "success";
  } else if (status === "rejected") {
    title = "Campaign Rejected";
    message = `Your campaign "${campaign.title}" was not approved. Reason: ${reason || "Does not meet guidelines."}`;
    type = "error";
  } else if (status === "frozen") {
    title = "Campaign Frozen";
    message = `Your campaign "${campaign.title}" has been frozen. Please contact support.`;
    type = "warning";
  }

  await sendNotification(
    campaign.creator_id,
    title,
    message,
    type,
    `/dashboard/campaigns/${campaignId}`
  );

  // Log action
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: `campaign_${status}`,
    entity_type: "campaign",
    entity_id: campaignId,
    details: { reason },
  });

  return { success: true };
}

// 5. Submit Donation (Frontend flow helper)
export async function submitDonationAction(donationData: {
  campaign_id: string;
  donor_id: string | null;
  donor_name: string;
  donor_phone: string;
  amount: number;
  message?: string;
  is_anonymous?: boolean;
}) {
  try {
    const supabase = await createServiceClient();

    console.log("Submitting donation:", {
      ...donationData,
      payment_method: "evc_plus",
      status: "pending_verification",
    });

    const { error: insertError } = await supabase.from("donations").insert({
      ...donationData,
      payment_method: "evc_plus",
      status: "pending_verification",
    });

    if (insertError) {
      console.error("Donation insert error:", insertError);
      return { error: insertError.message };
    }

    console.log("Donation inserted successfully");

    // Fetch campaign details to notify fundraiser and send Telegram notification
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("creator_id, title")
      .eq("id", donationData.campaign_id)
      .single();

    if (campaign) {
      // Send Telegram notification (don't fail if this fails)
      try {
        await notifyNewDonation(
          donationData.donor_name,
          donationData.amount,
          campaign.title
        );
      } catch (error) {
        console.error("Failed to send Telegram notification:", error);
      }

      // Send notification to fundraiser (don't fail if this fails)
      try {
        await sendNotification(
          campaign.creator_id,
          "New Pending Donation 💰",
          `You received a donation of $${donationData.amount} for "${campaign.title}" pending verification.`,
          "info",
          `/dashboard/donations`
        );
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Submit donation action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// 6. Verify Donation (Admin)
export async function verifyDonationAction(
  donationId: string,
  status: string,
  adminId: string
) {
  const supabase = await createServiceClient();

  // Fetch donation details
  const { data: donation } = await supabase
    .from("donations")
    .select("*, campaigns(creator_id, title)")
    .eq("id", donationId)
    .single();

  if (!donation) return { error: "Donation not found" };

  const campaign = donation.campaigns as unknown as { creator_id: string; title: string };

  // Update donation status
  const { error: updateError } = await supabase
    .from("donations")
    .update({
      status,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
    })
    .eq("id", donationId);

  if (updateError) return { error: updateError.message };

  // Notify creator
  if (status === "verified") {
    await sendNotification(
      campaign.creator_id,
      "Donation Verified! ✅",
      `A donation of $${donation.amount} for "${campaign.title}" has been successfully verified.`,
      "success",
      `/dashboard/donations`
    );

    // Notify donor (if registered)
    if (donation.donor_id) {
      await sendNotification(
        donation.donor_id,
        "Donation Confirmed",
        `Thank you! Your donation of $${donation.amount} for "${campaign.title}" has been verified.`,
        "success",
        `/campaigns`
      );
    }
  } else if (status === "rejected") {
    await sendNotification(
      campaign.creator_id,
      "Donation Rejected ❌",
      `The $${donation.amount} donation was rejected by admin.`,
      "error",
      `/dashboard/donations`
    );

    // Notify donor (if registered)
    if (donation.donor_id) {
      await sendNotification(
        donation.donor_id,
        "Donation Rejected",
        `Your donation of $${donation.amount} for "${campaign.title}" could not be verified.`,
        "error"
      );
    }
  }

  // Admin log
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: `donation_${status}`,
    entity_type: "donation",
    entity_id: donationId,
  });

  return { success: true };
}

// 7. Submit Withdrawal Request
export async function submitWithdrawalAction(withdrawalData: {
  campaign_id: string;
  fundraiser_id: string;
  full_name: string;
  phone_number: string;
  payment_method: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
}) {
  const supabase = await createServiceClient();

  // Calculate available balance for the campaign
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("campaign_id", withdrawalData.campaign_id)
    .eq("status", "verified");

  const totalRaised = donations?.reduce((sum, d) => sum + (d.amount as number), 0) || 0;

  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("amount")
    .eq("campaign_id", withdrawalData.campaign_id)
    .in("status", ["pending", "approved", "completed"]);

  const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + (w.amount as number), 0) || 0;

  const availableBalance = totalRaised - totalWithdrawn;

  // Validate that withdrawal amount doesn't exceed available balance
  if (withdrawalData.amount > availableBalance) {
    return { 
      error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${withdrawalData.amount.toFixed(2)}` 
    };
  }

  const { error: insertError } = await supabase.from("withdrawal_requests").insert({
    ...withdrawalData,
    status: "pending",
  });

  if (insertError) return { error: insertError.message };

  // Fetch campaign details for Telegram notification
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title")
    .eq("id", withdrawalData.campaign_id)
    .single();

  // Send Telegram notification
  await notifyWithdrawalRequest(withdrawalData.full_name, withdrawalData.amount, campaign?.title || "Unknown Campaign");

  // Notify user
  await sendNotification(
    withdrawalData.fundraiser_id,
    "Withdrawal Request Submitted",
    `Your request to withdraw $${withdrawalData.amount} is pending approval.`,
    "info",
    `/dashboard/withdrawals`
  );

  return { success: true };
}

// 9. Admin: Adjust User Balance
export async function adjustUserBalanceAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const amount = Number(formData.get("amount"));
  const reason = formData.get("reason") as string;
  const adminId = formData.get("adminId") as string;

  const supabase = await createServiceClient();

  // Fetch user details
  const { data: user } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  if (!user) {
    return { error: "User not found" };
  }

  // Insert balance adjustment record
  const { error: insertError } = await supabase.from("balance_adjustments").insert({
    user_id: userId,
    amount,
    reason,
    adjusted_by: adminId,
  });

  if (insertError) {
    // If table doesn't exist, we need to create it or handle differently
    console.error("Error inserting balance adjustment:", insertError);
    return { error: "Failed to record balance adjustment" };
  }

  // Log the admin action
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: "balance_adjustment",
    entity_type: "user",
    entity_id: userId,
    details: { amount, reason },
  });

  // Send notification to user
  await sendNotification(
    userId,
    amount > 0 ? "Balance Increased 💰" : "Balance Decreased",
    `Your balance has been ${amount > 0 ? "increased" : "decreased"} by $${Math.abs(amount).toFixed(2)}. Reason: ${reason}`,
    amount > 0 ? "success" : "warning",
    "/dashboard/balance"
  );

  return { success: true };
}

// 8. Process Withdrawal Request (Admin)
export async function processWithdrawalAction(
  withdrawalId: string,
  status: string,
  adminId: string
) {
  const supabase = await createServiceClient();

  // Fetch withdrawal details
  const { data: withdrawal } = await supabase
    .from("withdrawal_requests")
    .select("*, campaigns(title)")
    .eq("id", withdrawalId)
    .single();

  if (!withdrawal) return { error: "Withdrawal request not found" };

  const campaign = withdrawal.campaigns as unknown as { title: string };

  // Update request
  const { error: updateError } = await supabase
    .from("withdrawal_requests")
    .update({
      status,
      processed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);

  if (updateError) return { error: updateError.message };

  // Notify fundraiser
  let title = "Withdrawal Update";
  let message = "";
  let type = "info";

  if (status === "approved") {
    title = "Withdrawal Approved! 💸";
    message = `Your withdrawal of $${withdrawal.amount} for "${campaign.title}" is approved and will be paid shortly.`;
    type = "success";
  } else if (status === "paid") {
    title = "Withdrawal Paid! 🎉";
    message = `Your withdrawal of $${withdrawal.amount} for "${campaign.title}" has been marked as paid.`;
    type = "success";
  } else if (status === "rejected") {
    title = "Withdrawal Rejected ❌";
    message = `Your withdrawal of $${withdrawal.amount} for "${campaign.title}" was rejected.`;
    type = "error";
  }

  await sendNotification(
    withdrawal.fundraiser_id,
    title,
    message,
    type,
    `/dashboard/withdrawals`
  );

  // Admin log
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: `withdrawal_${status}`,
    entity_type: "withdrawal",
    entity_id: withdrawalId,
  });

  return { success: true };
}
