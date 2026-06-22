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
  try {
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
      .maybeSingle();

    let reporterName = "Anonymous";
    if (reporterId) {
      const { data: reporter } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", reporterId)
        .maybeSingle();
      reporterName = reporter?.full_name || "Anonymous";
    }

    try {
      await notifyFraudReport(campaign?.title || "Unknown Campaign", reporterName, reason);
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    // Notify admins about the new report
    try {
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
    } catch (error) {
      console.error("Failed to notify admins:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Submit report action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// 1. Submit Verification Request
export async function submitVerificationRequestAction(
  userId: string,
  level: string,
  docType: string,
  docUrl: string
) {
  try {
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
      .maybeSingle();

    try {
      await notifyVerificationRequest(user?.full_name || "Unknown User");
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    // Update profile status (service role bypasses RLS)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile verification status:", updateError);
      // Don't fail the whole request if profile update fails
    }

    try {
      await sendNotification(
        userId,
        "Verification Request Submitted",
        "Your blue checkmark verification request is under review. Our team will verify your National ID and profile picture.",
        "info",
        "/dashboard/verification"
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Submit verification request action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// Admin: Resolve fraud report
export async function resolveReportAction(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    const freezeCampaign = formData.get("freezeCampaign") as string | null;

    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase.from("reports").update({
      status,
      investigated_by: user?.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", id);

    if (updateError) {
      console.error("Error resolving report:", updateError);
      return;
    }

    if (freezeCampaign && status === "resolved") {
      const { error: campaignError } = await supabase.from("campaigns").update({ status: "frozen" }).eq("id", freezeCampaign);
      if (campaignError) {
        console.error("Error freezing campaign:", campaignError);
      }
    }
  } catch (error) {
    console.error("Resolve report action error:", error);
  }
}

// Admin: Direct verification (create and approve)
export async function adminVerifyUserAction(
  userId: string,
  level: string,
  adminId: string
) {
  try {
    const supabase = await createServiceClient();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ verification_level: level, verification_status: "verified" })
      .eq("id", userId);

    if (profileError) {
      console.error("Error verifying user:", profileError);
      return { error: profileError.message };
    }

    // Log the action
    try {
      await supabase.from("admin_logs").insert({
        admin_id: adminId,
        action: "verify_user",
        entity_type: "user",
        entity_id: userId,
        details: { level },
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }

    // Send notification
    try {
      await sendNotification(
        userId,
        "Account Verified",
        `Your account has been verified at level ${level}.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Admin verify user action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// Auto-feature campaigns based on engagement
export async function autoFeatureCampaignsAction() {
  try {
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
    const { error: featureError } = await supabase
      .from("campaigns")
      .update({ is_featured: true })
      .in("id", topIds);

    if (featureError) {
      console.error("Error featuring campaigns:", featureError);
    }

    // Unfeature others
    const { error: unfeatureError } = await supabase
      .from("campaigns")
      .update({ is_featured: false })
      .eq("status", "active")
      .not("id", "in", `(${topIds.join(",")})`);

    if (unfeatureError) {
      console.error("Error unfeaturing campaigns:", unfeatureError);
    }

    return { success: true, featured: topIds.length };
  } catch (error) {
    console.error("Auto feature campaigns action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// 2. Review Verification Request (Admin)
export async function reviewVerificationAction(
  requestId: string,
  userId: string,
  status: string,
  level: string,
  adminId: string
) {
  try {
    const supabase = await createServiceClient();

    console.log("Reviewing verification:", { requestId, userId, status, level, adminId });

    // Update request status
    const { error: requestError } = await supabase
      .from("verification_requests")
      .update({
        status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (requestError) {
      console.error("Error updating verification request:", requestError);
      return { error: requestError.message };
    }

    console.log("Verification request updated");

    // Update user profile based on approval/rejection
    if (status === "verified") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_level: level,
          verification_status: "verified",
          role: "fundraiser", // PROMOTE user to fundraiser!
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating user profile:", profileError);
        return { error: profileError.message };
      }

      try {
        await sendNotification(
          userId,
          "Blue Checkmark Verified! 🎉",
          "Congratulations! Your account has been verified with the blue checkmark. You can now create campaigns!",
          "success",
          "/dashboard"
        );
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    } else if (status === "rejected") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_level: "none",
          verification_status: "rejected",
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating user profile:", profileError);
        return { error: profileError.message };
      }

      try {
        await sendNotification(
          userId,
          "Verification Rejected",
          "Your verification request was rejected. Please upload a clear, valid National ID and re-apply.",
          "error",
          "/dashboard/verification"
        );
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }

    // Insert Admin Log
    try {
      await supabase.from("admin_logs").insert({
        admin_id: adminId,
        action: `verification_${status}`,
        entity_type: "verification_request",
        entity_id: requestId,
        details: { user_id: userId, level },
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Review verification action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
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
  try {
    const supabase = await createServiceClient();

    console.log("Creating campaign:", campaignData);

    const { data: campaign, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        ...campaignData,
        status: "pending_review",
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("Error creating campaign:", insertError);
      return { error: insertError.message };
    }

    console.log("Campaign created successfully:", campaign);

    // Fetch creator details for Telegram notification
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", campaignData.creator_id)
      .maybeSingle();

    try {
      await notifyNewCampaign(campaignData.title, creator?.full_name || "Unknown", campaignData.goal_amount);
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    // Notify creator
    try {
      await sendNotification(
        campaignData.creator_id,
        "Campaign Submitted for Review",
        `Your campaign "${campaignData.title}" is pending review by our team.`,
        "info",
        `/dashboard/campaigns/${campaign?.id}`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return { success: true, campaign };
  } catch (error) {
    console.error("Create campaign action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// 4. Update Campaign Status (Admin)
export async function updateCampaignStatusAction(
  campaignId: string,
  status: string,
  reason: string | null,
  adminId: string
) {
  try {
    const supabase = await createServiceClient();

    // Fetch campaign creator
    const { data: campaign, error: fetchError } = await supabase
      .from("campaigns")
      .select("creator_id, title")
      .eq("id", campaignId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching campaign:", fetchError);
      return { error: fetchError.message };
    }

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

    try {
      await sendNotification(
        campaign.creator_id,
        title,
        message,
        type,
        `/dashboard/campaigns/${campaignId}`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    // Log action
    try {
      await supabase.from("admin_logs").insert({
        admin_id: adminId,
        action: `campaign_${status}`,
        entity_type: "campaign",
        entity_id: campaignId,
        details: { reason },
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Update campaign status action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
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
  try {
    const supabase = await createServiceClient();

    console.log("Verifying donation:", { donationId, status, adminId });

    // Fetch donation details
    const { data: donation, error: fetchError } = await supabase
      .from("donations")
      .select("*, campaigns!inner(creator_id, title, raised_amount, donor_count)")
      .eq("id", donationId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching donation:", fetchError);
      return { error: fetchError.message };
    }

    if (!donation) {
      console.error("Donation not found:", donationId);
      return { error: "Donation not found" };
    }

    const campaign = donation.campaigns as unknown as { 
      creator_id: string; 
      title: string; 
      raised_amount: number; 
      donor_count: number;
    };

    console.log("Updating donation status:", { donationId, status });

    // Update donation status
    const { error: updateError } = await supabase
      .from("donations")
      .update({
        status,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", donationId);

    if (updateError) {
      console.error("Error updating donation:", updateError);
      return { error: updateError.message };
    }

    console.log("Donation updated successfully");

    // Update campaign stats if verified
    if (status === "verified") {
      const donationAmount = donation.amount || 0;
      const { error: campaignUpdateError } = await supabase
        .from("campaigns")
        .update({
          raised_amount: (campaign.raised_amount || 0) + donationAmount,
          donor_count: (campaign.donor_count || 0) + 1,
        })
        .eq("id", donation.campaign_id);

      if (campaignUpdateError) {
        console.error("Failed to update campaign stats:", campaignUpdateError);
      } else {
        console.log("Campaign stats updated successfully");
      }

      try {
        await sendNotification(
          campaign.creator_id,
          "Donation Verified! ✅",
          `A donation of $${donation.amount} for "${campaign.title}" has been successfully verified.`,
          "success",
          `/dashboard/donations`
        );
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      // Notify donor (if registered)
      if (donation.donor_id) {
        try {
          await sendNotification(
            donation.donor_id,
            "Donation Confirmed",
            `Thank you! Your donation of $${donation.amount} for "${campaign.title}" has been verified.`,
            "success",
            `/campaigns`
          );
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
    } else if (status === "rejected") {
      try {
        await sendNotification(
          campaign.creator_id,
          "Donation Rejected ❌",
          `The $${donation.amount} donation was rejected by admin.`,
          "error",
          `/dashboard/donations`
        );
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      // Notify donor (if registered)
      if (donation.donor_id) {
        try {
          await sendNotification(
            donation.donor_id,
            "Donation Rejected",
            `Your donation of $${donation.amount} for "${campaign.title}" could not be verified.`,
            "error"
          );
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
    }

    // Admin log
    try {
      await supabase.from("admin_logs").insert({
        admin_id: adminId,
        action: `donation_${status}`,
        entity_type: "donation",
        entity_id: donationId,
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Verify donation action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
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
  try {
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
      .maybeSingle();

    try {
      await notifyWithdrawalRequest(withdrawalData.full_name, withdrawalData.amount, campaign?.title || "Unknown Campaign");
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
    }

    try {
      await sendNotification(
        withdrawalData.fundraiser_id,
        "Withdrawal Request Submitted",
        `Your request to withdraw $${withdrawalData.amount} is pending approval.`,
        "info",
        `/dashboard/withdrawals`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Submit withdrawal action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// 9. Admin: Adjust User Balance
export async function adjustUserBalanceAction(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const amount = Number(formData.get("amount"));
    const reason = formData.get("reason") as string;
    const adminId = formData.get("adminId") as string;

    const supabase = await createServiceClient();

    // Fetch user details
    const { data: user, error: fetchError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching user:", fetchError);
      return { error: fetchError.message };
    }

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

    try {
      // Log the admin action
      await supabase.from("admin_logs").insert({
        admin_id: adminId,
        action: "balance_adjustment",
        entity_type: "user",
        entity_id: userId,
        details: { amount, reason },
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }

    try {
      // Send notification to user
      await sendNotification(
        userId,
        amount > 0 ? "Balance Increased 💰" : "Balance Decreased",
        `Your balance has been ${amount > 0 ? "increased" : "decreased"} by $${Math.abs(amount).toFixed(2)}. Reason: ${reason}`,
        amount > 0 ? "success" : "warning",
        "/dashboard/balance"
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Adjust user balance action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// 8. Process Withdrawal Request (Admin)
export async function processWithdrawalAction(
  withdrawalId: string,
  status: string,
  adminId: string
) {
  try {
    const supabase = await createServiceClient();

    console.log("Processing withdrawal:", { withdrawalId, status, adminId });

    // Fetch withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from("withdrawal_requests")
      .select("*, campaigns!inner(title)")
      .eq("id", withdrawalId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching withdrawal:", fetchError);
      return { error: fetchError.message };
    }

    if (!withdrawal) {
      console.error("Withdrawal not found:", withdrawalId);
      return { error: "Withdrawal request not found" };
    }

    const campaign = withdrawal.campaigns as unknown as { title: string };

    console.log("Updating withdrawal status:", { withdrawalId, status });

    // Update request
    const { error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({
        status,
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    if (updateError) {
      console.error("Error updating withdrawal:", updateError);
      return { error: updateError.message };
    }

    console.log("Withdrawal updated successfully");

    // Notify fundraiser
    let title = "Withdrawal Update";
    let message = "";
    let type = "info";

    if (status === "approved") {
      title = "Withdrawal Approved! 💸";
      message = `Your withdrawal of $${withdrawal.amount || 0} for "${campaign.title}" is approved and will be paid shortly.`;
      type = "success";
    } else if (status === "paid") {
      title = "Withdrawal Paid! 🎉";
      message = `Your withdrawal of $${withdrawal.amount || 0} for "${campaign.title}" has been marked as paid.`;
      type = "success";
    } else if (status === "rejected") {
      title = "Withdrawal Rejected ❌";
      message = `Your withdrawal of $${withdrawal.amount || 0} for "${campaign.title}" was rejected.`;
      type = "error";
    }

    try {
      await sendNotification(
        withdrawal.fundraiser_id,
        title,
        message,
        type,
        `/dashboard/withdrawals`
      );
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    // Admin log
    try {
      await supabase.from("admin_logs").insert({
        admin_id: adminId,
        action: `withdrawal_${status}`,
        entity_type: "withdrawal",
        entity_id: withdrawalId,
      });
    } catch (error) {
      console.error("Failed to log admin action:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Process withdrawal action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// Upload Avatar
export async function uploadAvatarAction(file: File) {
  try {
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "User not authenticated" };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return { error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return { error: updateError.message };
    }

    return { success: true, avatarUrl: publicUrl };
  } catch (error) {
    console.error("Upload avatar action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}

// Update Profile
export async function updateProfileAction(data: { full_name: string; phone_number: string; city: string }) {
  try {
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "User not authenticated" };
    }
    
    const { error } = await supabase.from("profiles").update(data).eq("id", user.id);
    
    if (error) {
      console.error("Profile update error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Update profile action error:", error);
    return { error: error instanceof Error ? error.message : "An unexpected error occurred" };
  }
}
