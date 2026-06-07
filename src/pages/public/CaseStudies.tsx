import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Clock, Users, ArrowRight, Quote } from "lucide-react";
import { useSEO } from "../../hooks/useSEO";

export const CaseStudies: React.FC = () => {
  useSEO({
    title: "Client Testimonials & Case Studies | Cameraman Pro",
    description: "Read how professional photography studios in India scale their bookings, optimize crew assignments, and grow profits with Cameraman Pro.",
    keywords: "photo studio success stories, wedding photography software reviews, photography case studies",
  });

  const caseStudies = [
    {
      studio: "Royal Palace Studio",
      location: "Jaipur, Rajasthan",
      metric: "+35% Margin Increase",
      metricLabel: "Profitability Gain",
      challenge: "Managing seasonal wedding inquiries, tracking milestone advances, and preventing calendar double-bookings during peak Muhurat dates.",
      solution: "Implemented Cameraman Pro's central dashboard. Invoices calculate GST automatically and link clients directly to secure UPI advance payments.",
      statIcon: TrendingUp,
      stats: [
        { label: "Client Invoicing Time", before: "45 mins", after: "3 mins" },
        { label: "Double Bookings", before: "4-5 per season", after: "0" }
      ]
    },
    {
      studio: "Vivid Creative Films",
      location: "Delhi NCR",
      metric: "50% Faster Delivery",
      metricLabel: "Album Approval Rate",
      challenge: "Endless WhatsApp groups and email feedback cycles with wedding couples for draft edits and print album layouts.",
      solution: "Adopted client portals and the interactive photo culling selection system. Clients select their favorite photos cleanly on their mobile phones.",
      statIcon: Clock,
      stats: [
        { label: "Album Proofing Loop", before: "30+ days", after: "4 days" },
        { label: "Client Satisfaction Score", before: "84%", after: "99%" }
      ]
    },
    {
      studio: "Pixel Canvas Weddings",
      location: "Bengaluru, Karnataka",
      metric: "12+ Crew Managed Daily",
      metricLabel: "Staff Schedule Efficiency",
      challenge: "Coordinating shifts, rosters, attendance checks, and transport expenses for freelance camera operators and drone pilots.",
      solution: "Utilized the Crew Management system with geo-locked attendance logs and instant client identity badges.",
      statIcon: Users,
      stats: [
        { label: "Rostering Staff", before: "12 hours/week", after: "10 mins" },
        { label: "Expense Dispute Cases", before: "Weekly", after: "Rarely" }
      ]
    }
  ];

  const testimonials = [
    {
      quote: "The visual calendar is a lifesaver. Being able to see crew allocations, booking statuses, and pending payments in one layout has saved our studio thousands in overhead costs.",
      author: "Aditya Sen",
      role: "Owner, Sen Cinematic Co (Kolkata)"
    },
    {
      quote: "Our clients love the tracking page! They can track their edit status just like a food delivery app, which stopped 90% of follow-up phone calls to our studio.",
      author: "Priya Nair",
      role: "Creative Director, Bloom Photography (Kochi)"
    }
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
            Success Stories
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6">
            Trusted by Elite Photography Studios
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            See how creative businesses in India use Cameraman Pro to automate their admin work and deliver premium customer experiences.
          </p>
        </div>

        {/* Case Studies Grid */}
        <div className="space-y-16 mb-24">
          {caseStudies.map((cs, idx) => {
            const Icon = cs.statIcon;
            return (
              <div 
                key={idx}
                className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-8 md:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                {/* Metrics Info */}
                <div className="lg:col-span-4 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mx-auto">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-[var(--text-primary)]">{cs.metric}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold uppercase tracking-wider">{cs.metricLabel}</p>
                  </div>

                  <div className="border-t border-[var(--border-light)] pt-4 space-y-2 text-left">
                    {cs.stats.map((s, sIdx) => (
                      <div key={sIdx} className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">{s.label}</span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {s.before} ➔ <span className="text-emerald-400">{s.after}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Case Study Details */}
                <div className="lg:col-span-8 space-y-6">
                  <div>
                    <span className="text-xs text-[var(--accent-primary)] font-bold">{cs.location}</span>
                    <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{cs.studio}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">The Challenge:</h5>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{cs.challenge}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">The Solution:</h5>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{cs.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quotes Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-12 text-center">What Studio Owners Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-8 shadow-md relative"
              >
                <Quote className="absolute right-6 top-6 text-[var(--border-light)]" size={40} />
                <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed mb-6 relative z-10">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center font-bold">
                    {t.author[0]}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[var(--text-primary)]">{t.author}</h5>
                    <p className="text-xs text-[var(--text-secondary)]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-[var(--surface-base)] to-[var(--bg-secondary)] border border-[var(--border-light)] rounded-3xl p-12 text-center max-w-4xl mx-auto shadow-lg">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Start Writing Your Success Story</h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Take 2 minutes to create a free trial account. Import your active booking calendar and test all tools without limits.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/free-trial"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
