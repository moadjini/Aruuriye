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
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { level: "Level 1", title: "Phone Verified", desc: "Phone number confirmed via SMS" },
            { level: "Level 2", title: "Identity Verified", desc: "National ID or official documents reviewed" },
            { level: "Level 3", title: "Trusted Fundraiser", desc: "Proven track record with successful campaigns" },
          ].map((v) => (
            <div key={v.level} className="rounded-xl border p-5">
              <p className="text-xs font-medium text-secondary">{v.level}</p>
              <h3 className="mt-1 font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{v.desc}</p>
            </div>
          ))}
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
