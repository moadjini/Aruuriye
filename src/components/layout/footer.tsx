"use client";

import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { useState } from "react";
import { Mail } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In production, this would call an API to subscribe the user
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="border-t border-gray-200 bg-gray-50 w-full">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center">
              <Image
                src="/Gemini_Generated_Image_9w12x79w12x79w12.png"
                alt="Aruuriye"
                width={120}
                height={32}
                className="h-10 w-auto"
              />
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Somalia&apos;s trusted crowdfunding platform. Help individuals, students, and communities raise funds safely.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-text">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/campaigns" className="hover:text-primary">Explore Campaigns</Link></li>
              <li><Link href="/auth/register" className="hover:text-primary">Start Fundraising</Link></li>
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text">Categories</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/campaigns?category=medical" className="hover:text-primary">Medical</Link></li>
              <li><Link href="/campaigns?category=education" className="hover:text-primary">Education</Link></li>
              <li><Link href="/campaigns?category=emergency-relief" className="hover:text-primary">Emergency Relief</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text">Trust & Safety</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/about#verification" className="hover:text-primary">Verification</Link></li>
              <li><Link href="/about#security" className="hover:text-primary">Security</Link></li>
              <li><Link href="/about#fees" className="hover:text-primary">Fees & Transparency</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-8 sm:mt-10 border-t border-gray-200 pt-6">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-semibold text-text mb-2 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              Stay Updated
            </h4>
            <p className="text-sm text-text-muted mb-4">
              Get the latest campaigns and success stories delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium"
              >
                {subscribed ? "Subscribed!" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 border-t border-gray-200 pt-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
