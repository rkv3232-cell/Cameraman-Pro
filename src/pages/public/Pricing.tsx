import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, HelpCircle, Sparkles } from "lucide-react";
import { useSEO } from "../../hooks/useSEO";
import { useStructuredData } from "../../hooks/useStructuredData";

export const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  useSEO({
    title: "Simple, Transparent Pricing Plans | Cameraman Pro",
    description: "Choose the perfect plan to scale your photography studio in India. 14-day free trial, no credit card required. Upgrade, downgrade, or cancel anytime.",
    keywords: "photography software pricing, studio management pricing, wedding photography CRM price, photo studio ERP cost",
  });

  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Cameraman Pro Software",
    "description": "Premium Studio Management & Booking Software for Photographers.",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": "999",
      "highPrice": "5999",
      "offerCount": "3",
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter Plan",
          "price": "999",
          "priceCurrency": "INR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "999",
            "priceCurrency": "INR",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": "1",
              "unitCode": "MON"
            }
          }
        },
        {
          "@type": "Offer",
          "name": "Pro Plan",
          "price": "2499",
          "priceCurrency": "INR",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": "2499",
            "priceCurrency": "INR",
            "referenceQuantity": {
              "@type": "QuantitativeValue",
              "value": "1",
              "unitCode": "MON"
            }
          }
        }
      ]
    }
  };

  useStructuredData(pricingSchema, "pricing-plans-schema");

  const plans = [
    {
      name: "Starter",
      desc: "Perfect for solo freelance photographers and videographers.",
      priceMonthly: 999,
      priceAnnual: 799,
      features: [
        "Up to 3 Active Bookings",
        "1 Master Admin Login",
        "Visual Shoot Calendar",
        "Basic WhatsApp & SMS Alerts",
        "Client Selection Portal (100 images limit)",
        "Standard Billing & Quotes",
        "Email Support"
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/free-trial?plan=starter",
      popular: false
    },
    {
      name: "Pro Studio",
      desc: "Best for growing studios with dedicated crew members.",
      priceMonthly: 2499,
      priceAnnual: 1999,
      features: [
        "Unlimited Active Bookings",
        "Up to 5 Crew Logins",
        "Complete Client Portal & Tracking",
        "Interactive Selection Portal (Unlimited)",
        "GST-Compliant Invoicing",
        "Expense & Margin Analytics",
        "Geo-checked Crew Attendance System",
        "Priority Chat Support"
      ],
      ctaText: "Start Free Trial",
      ctaLink: "/free-trial?plan=pro",
      popular: true
    },
    {
      name: "Enterprise",
      desc: "For multi-branch studios and production agencies.",
      priceMonthly: 5999,
      priceAnnual: 4799,
      features: [
        "Unlimited Crew Logins",
        "Multiple Studio Workspace Isolation",
        "Custom White-labeled Client Domains",
        "Advanced Revenue & Operations Ledger",
        "Full API Integration Access",
        "Dedicated Account Manager",
        "24/7 Phone Support",
        "Onboarding Data Migration Assistance"
      ],
      ctaText: "Book a Demo",
      ctaLink: "/book-demo?plan=enterprise",
      popular: false
    }
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
            Flexible Subscription Models
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6">
            Scale Your Business, Not Your Admin Costs
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            Start with a 14-day free trial on all plans. No credit card required. Upgrade, downgrade, or cancel anytime.
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center justify-center p-1 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-full shadow-sm mb-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !isAnnual 
                  ? "bg-[var(--accent-primary)] text-white shadow-md" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                isAnnual 
                  ? "bg-[var(--accent-primary)] text-white shadow-md" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Annual Billing <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-stretch">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div 
                key={idx} 
                className={`relative rounded-3xl p-8 bg-[var(--surface-base)] border transition-all duration-300 flex flex-col justify-between ${
                  plan.popular 
                    ? "border-[var(--accent-primary)] shadow-2xl scale-105 z-10" 
                    : "border-[var(--border-light)] shadow-md hover:shadow-xl"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent-primary)] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={12} /> Most Popular
                  </span>
                )}

                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{plan.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] min-h-[40px]">{plan.desc}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline text-[var(--text-primary)]">
                      <span className="text-3xl font-semibold">₹</span>
                      <span className="text-5xl font-extrabold tracking-tight">{price.toLocaleString("en-IN")}</span>
                      <span className="ml-1 text-sm text-[var(--text-secondary)]">/month</span>
                    </div>
                    {isAnnual && (
                      <p className="text-xs text-emerald-400 font-medium mt-1">Billed annually (₹{(price * 12).toLocaleString("en-IN")}/yr)</p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                        <Check size={16} className="text-[var(--accent-primary)] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={plan.ctaLink}
                  className={`w-full text-center py-4 px-6 rounded-xl font-bold transition-all ${
                    plan.popular
                      ? "bg-[var(--accent-primary)] text-white hover:opacity-90 shadow-lg hover:shadow-xl"
                      : "bg-[var(--surface-base)] text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--border-light)]/20"
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pricing FAQs Accordion */}
        <div className="max-w-4xl mx-auto border-t border-[var(--border-light)] pt-16">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-10 text-center">Pricing & Subscription FAQs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-bold text-[var(--text-primary)] flex items-start gap-2">
                <HelpCircle size={18} className="text-[var(--accent-primary)] flex-shrink-0 mt-1" />
                Can I change plans at any time?
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-7">
                Yes, absolutely. You can upgrade, downgrade, or cancel your subscription plan at any time directly from your billing workspace settings menu.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-[var(--text-primary)] flex items-start gap-2">
                <HelpCircle size={18} className="text-[var(--accent-primary)] flex-shrink-0 mt-1" />
                Are there any hidden fees or commissions?
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-7">
                No. Cameraman Pro charge a flat monthly or annual software licensing subscription. We do not charge transaction commissions or service signup taxes on your bookings.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-[var(--text-primary)] flex items-start gap-2">
                <HelpCircle size={18} className="text-[var(--accent-primary)] flex-shrink-0 mt-1" />
                What happens when my free trial expires?
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-7">
                After 14 days, you can choose to enter your billing details to continue using your preferred plan. If you decide not to, your account will pause, but your historical data is kept safe.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-[var(--text-primary)] flex items-start gap-2">
                <HelpCircle size={18} className="text-[var(--accent-primary)] flex-shrink-0 mt-1" />
                Do you offer refunds?
              </h4>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-7">
                Since we offer a fully functional 14-day free trial on all subscriptions, we do not issue partial refunds for active billing cycles once charged.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
