import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BroadcastPopup } from "@/components/broadcast-popup";
import { getProfile } from "@/lib/auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Somalia's trusted crowdfunding platform. Help individuals, students, medical patients, and community projects raise funds safely and transparently.",
  keywords: ["crowdfunding", "Somalia", "donations", "fundraising", "EVC Plus"],
  icons: {
    icon: "/Gemini_Generated_Image_9w12x79w12x79w12.png",
    apple: "/Gemini_Generated_Image_9w12x79w12x79w12.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} min-h-screen flex flex-col`}>
        <BroadcastPopup />
        <Header profile={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
