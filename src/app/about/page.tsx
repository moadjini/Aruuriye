import { Shield, Eye, DollarSign, CheckCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text">About {APP_NAME}</h1>
      <p className="mt-4 text-lg text-text-muted leading-relaxed">
        {APP_NAME} is Somalia&apos;s trusted crowdfunding platform, helping individuals, students,
        medical patients, charities, and community projects raise funds safely and transparently.
      </p>

      <section id="verification" className="mt-12">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-secondary" /> Verification System</h2>
        <div className="mt-6 rounded-xl border p-6 bg-secondary-light/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-blue-500 p-2">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Blue Checkmark Verification</h3>
          </div>
          <p className="text-text-muted mb-4">
            Our single verification level ensures trust and authenticity. Verified fundraisers receive a blue checkmark badge to demonstrate their verified identity.
          </p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> Users must complete their profile (name and profile picture)</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> Submit a National ID photo for identity verification</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> Admin reviews and approves verified fundraisers</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" /> Only JPEG, JPG, and PNG image formats accepted</li>
          </ul>
        </div>
      </section>

      <section id="security" className="mt-12">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Eye className="h-6 w-6 text-secondary" /> Security & Trust</h2>
        <ul className="mt-4 space-y-3 text-text-muted">
          <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> All campaigns reviewed by admin before going live</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> Manual EVC Plus donation verification</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> Fraud reporting and campaign freezing</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> Full audit logs for all admin actions</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" /> Role-based access control (RBAC)</li>
        </ul>
      </section>

      <section id="fees" className="mt-12">
        <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-secondary" /> Fees & Transparency</h2>
        <div className="mt-4 rounded-xl bg-secondary-light p-6">
          <p className="text-lg font-semibold text-secondary">5% Platform Fee</p>
          <p className="mt-2 text-text-muted">
            For every $1,000 raised, the fundraiser receives $950. Our fee covers platform operations,
            verification, fraud prevention, and customer support.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-text">$1,000</p><p className="text-sm text-text-muted">Raised</p></div>
            <div><p className="text-2xl font-bold text-text">$50</p><p className="text-sm text-text-muted">Platform Fee</p></div>
            <div><p className="text-2xl font-bold text-secondary">$950</p><p className="text-sm text-text-muted">You Receive</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
