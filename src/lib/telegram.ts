const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8859587206:AAFWJHo1wapXH3HEQKqHjxRa7MKhgG1Wudo";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "7775771480";

interface TelegramMessage {
  text: string;
  parse_mode?: "Markdown" | "HTML";
}

export async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Telegram API error:", data);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}

export async function notifyNewCampaign(campaignTitle: string, creatorName: string, goalAmount: number): Promise<void> {
  const message = `🆕 *NEW CAMPAIGN SUBMITTED*
  
📢 *Campaign:* ${campaignTitle}
👤 *Creator:* ${creatorName}
💰 *Goal:* $${goalAmount.toLocaleString()}
⏰ *Time:* ${new Date().toLocaleString()}

⚠️ *Action Required:* Review and approve/reject this campaign.`;
  
  await sendTelegramNotification(message);
}

export async function notifyNewDonation(
  donorName: string,
  amount: number,
  campaignTitle: string
): Promise<void> {
  const message = `💰 *NEW DONATION PENDING*
  
💵 *Amount:* $${amount.toLocaleString()}
👤 *Donor:* ${donorName}
📢 *Campaign:* ${campaignTitle}
⏰ *Time:* ${new Date().toLocaleString()}

⚠️ *Action Required:* Verify this donation.`;
  
  await sendTelegramNotification(message);
}

export async function notifyVerificationRequest(userName: string): Promise<void> {
  const message = `🔐 *NEW VERIFICATION REQUEST*
  
👤 *User:* ${userName}
⏰ *Time:* ${new Date().toLocaleString()}

⚠️ *Action Required:* Review verification documents (National ID + Face Photo).`;
  
  await sendTelegramNotification(message);
}

export async function notifyFraudReport(
  campaignTitle: string,
  reporterName: string,
  reason: string
): Promise<void> {
  const message = `🚨 *NEW FRAUD REPORT*
  
📢 *Campaign:* ${campaignTitle}
👤 *Reporter:* ${reporterName}
⚠️ *Reason:* ${reason}
⏰ *Time:* ${new Date().toLocaleString()}

🔴 *URGENT:* Review this report immediately.`;
  
  await sendTelegramNotification(message);
}

export async function notifyWithdrawalRequest(
  userName: string,
  amount: number,
  campaignTitle: string
): Promise<void> {
  const message = `💸 *NEW WITHDRAWAL REQUEST*
  
👤 *User:* ${userName}
💵 *Amount:* $${amount.toLocaleString()}
📢 *Campaign:* ${campaignTitle}
⏰ *Time:* ${new Date().toLocaleString()}

⚠️ *Action Required:* Review and approve/reject this withdrawal.`;
  
  await sendTelegramNotification(message);
}

export async function notifyPlatformEarnings(totalEarnings: number, todayEarnings: number): Promise<void> {
  const message = `💼 *PLATFORM EARNINGS UPDATE*
  
💰 *Total Platform Earnings:* $${totalEarnings.toLocaleString()}
📈 *Today's Earnings:* $${todayEarnings.toLocaleString()}
⏰ *Time:* ${new Date().toLocaleString()}

📊 *Platform Fee:* 5% of all verified donations`;
  
  await sendTelegramNotification(message);
}
