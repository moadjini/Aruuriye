import { HelpCircle, Shield, DollarSign, Users, Clock, CheckCircle } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    icon: HelpCircle,
    questions: [
      {
        q: "How do I create a campaign?",
        a: "Sign up for an account, click 'Start Fundraising', and fill in your campaign details. Our team will review your campaign within 24-48 hours."
      },
      {
        q: "What can I fundraise for?",
        a: "You can fundraise for medical emergencies, education, business startups, community projects, charities, mosque projects, and emergency relief efforts."
      },
      {
        q: "Is there a fee to use the platform?",
        a: "We charge a 5% platform fee on successful campaigns. This helps us maintain secure operations and provide verification services."
      }
    ]
  },
  {
    category: "Donations",
    icon: DollarSign,
    questions: [
      {
        q: "How can I donate?",
        a: "You can donate using EVC Plus, Sahal Pay, or Zaad. Simply select a campaign, choose your donation amount, and follow the payment instructions."
      },
      {
        q: "Are my donations secure?",
        a: "Yes. All donations are manually verified by our team before being credited to campaigns. We use industry-standard security measures."
      },
      {
        q: "Can I donate anonymously?",
        a: "Yes, you can choose to donate anonymously. Your name won't be displayed publicly, but the donation will still be verified."
      }
    ]
  },
  {
    category: "Withdrawals",
    icon: DollarSign,
    questions: [
      {
        q: "How do I withdraw funds?",
        a: "Once your donations are verified, you can request a withdrawal from your dashboard. Withdrawals are processed within 24-48 hours."
      },
      {
        q: "What payment methods are supported for withdrawals?",
        a: "We support EVC Plus, Sahal Pay, Zaad, and bank transfers for withdrawals."
      },
      {
        q: "Is there a minimum withdrawal amount?",
        a: "Yes, the minimum withdrawal amount is 10,000 SOS to ensure efficient processing."
      }
    ]
  },
  {
    category: "Verification & Trust",
    icon: Shield,
    questions: [
      {
        q: "How does verification work?",
        a: "We verify fundraisers through phone verification, identity verification, and trusted status levels. This ensures authenticity and builds trust."
      },
      {
        q: "Why was my campaign put on hold?",
        a: "Campaigns may be put on hold for additional verification if we detect suspicious activity or need more information. Contact support for assistance."
      },
      {
        q: "How do I report a fraudulent campaign?",
        a: "Click the 'Report' button on any campaign page. Our team investigates all reports within 24 hours."
      }
    ]
  },
  {
    category: "Account & Support",
    icon: Users,
    questions: [
      {
        q: "How do I change my password?",
        a: "Go to Settings in your dashboard and click 'Change Password'. Follow the instructions to update your password."
      },
      {
        q: "Can I delete my account?",
        a: "Yes, you can request account deletion from Settings. Note that this will permanently remove your data and cannot be undone."
      },
      {
        q: "How do I contact support?",
        a: "You can reach our support team through the contact form on our website or email us at support@aruuriye.com"
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">Frequently Asked Questions</h1>
        <p className="text-text-muted max-w-2xl mx-auto">
          Find answers to common questions about fundraising, donations, withdrawals, and account management.
        </p>
      </div>

      <div className="space-y-12">
        {faqs.map((category, categoryIndex) => {
          const Icon = category.icon;
          return (
            <div key={categoryIndex} className="animate-fade-in" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex rounded-lg bg-secondary-light/50 p-2 text-secondary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-text">{category.category}</h2>
              </div>
              
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-text mb-2 flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                      {faq.q}
                    </h3>
                    <p className="text-text-muted leading-relaxed ml-7">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-text-muted mb-4">Still have questions?</p>
        <a href="mailto:support@aruuriye.com" className="inline-flex items-center gap-2 text-secondary font-semibold hover:underline">
          <HelpCircle className="h-4 w-4" />
          Contact Support
        </a>
      </div>
    </div>
  );
}
