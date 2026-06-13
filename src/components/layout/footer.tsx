import Link from "next/link";
import { Heart } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-4 w-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-text">{APP_NAME}</span>
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
              <li><Link href="/about" className="hover:text-primary">How It Works</Link></li>
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

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
