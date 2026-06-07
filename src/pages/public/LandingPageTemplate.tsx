import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { landingPages } from "../../data/landingPages";
import { useSEO } from "../../hooks/useSEO";
import { useStructuredData } from "../../hooks/useStructuredData";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Settings,
  Activity
} from "lucide-react";

export const LandingPageTemplate: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const pageData = landingPages.find((p) => p.slug === slug);

  if (!pageData) {
    return <Navigate to="/" replace />;
  }

  // Set SEO tags
  useSEO({
    title: pageData.title,
    description: pageData.metaDescription,
    keywords: `photography software, studio management, photographer CRM, india photography billing, ${pageData.keyword.toLowerCase()}`,
    canonical: `${window.location.origin}/software/${pageData.slug}`,
    ogTitle: pageData.title,
    ogDescription: pageData.metaDescription,
  });

  // Inject dynamic schemas (SoftwareApplication & FAQPage)
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": pageData.keyword,
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "INR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "184"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Cameraman Pro",
      "url": window.location.origin
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pageData.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  useStructuredData(softwareSchema, `software-schema-${pageData.slug}`);
  useStructuredData(faqSchema, `faq-schema-${pageData.slug}`);

  // Find other landing pages to link for internal SEO structure (exclude current)
  const otherPages = landingPages
    .filter((p) => p.slug !== slug)
    .sort(() => 0.5 - Math.random()) // shuffle
    .slice(0, 6); // show 6 related links

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const featureIcons = [Zap, ShieldCheck, Settings];

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="text-sm text-[var(--text-secondary)] mb-8">
          <Link to="/" className="hover:text-[var(--accent-primary)] transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text-primary)] font-medium">Software Solutions</span>
          <span className="mx-2">/</span>
          <span className="text-[var(--accent-primary)]">{pageData.keyword}</span>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[var(--surface-base)] to-[var(--bg-secondary)] border border-[var(--border-light)] p-8 md:p-16 mb-16 shadow-2xl overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[var(--accent-primary)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold text-xs uppercase tracking-wider mb-6">
              <Sparkles size={14} /> Enterprise-grade Solutions
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] leading-tight mb-6">
              {pageData.h1}
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-8">
              {pageData.intro}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/book-now"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Book Free Trial <ArrowRight size={18} />
              </Link>
              <Link
                to="/enquiry"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--surface-base)] text-[var(--text-primary)] border border-[var(--border-light)] font-bold rounded-xl hover:bg-[var(--border-light)]/20 transition-all"
              >
                Inquire Now
              </Link>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              Key Features & Capabilities
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Engineered to streamline and scale your photography business operations in India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pageData.features.map((feat, idx) => {
              const IconComp = featureIcons[idx % featureIcons.length];
              return (
                <div
                  key={idx}
                  className="bg-[var(--surface-base)] p-8 rounded-2xl border border-[var(--border-light)] shadow-md hover:shadow-xl hover:border-[var(--accent-primary)]/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <IconComp size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Interactive FAQ Section */}
        <div className="mb-20 bg-[var(--surface-base)] rounded-3xl border border-[var(--border-light)] p-8 md:p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {pageData.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border-b border-[var(--border-light)] pb-4 last:border-0 last:pb-0"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left py-4 text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {isOpen && (
                    <p className="text-[var(--text-secondary)] leading-relaxed pb-4 animate-fadeIn">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 text-center shadow-sm">
          <div>
            <h4 className="text-3xl font-bold text-[var(--accent-primary)]">15+</h4>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Core Modules</p>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-[var(--accent-primary)]">1000+</h4>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Indian Studios</p>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-[var(--accent-primary)]">4.9⭐</h4>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">User Rating</p>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-[var(--accent-primary)]">100%</h4>
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mt-1">Data Security</p>
          </div>
        </div>

        {/* SEO Internal Link Interlinking Block */}
        <div className="border-t border-[var(--border-light)] pt-12">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
            Explore More Photography Business Solutions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherPages.map((op, idx) => (
              <Link
                key={idx}
                to={`/software/${op.slug}`}
                className="flex items-center gap-2 p-4 rounded-xl bg-[var(--surface-base)] border border-[var(--border-light)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
              >
                <Activity size={16} className="text-[var(--accent-primary)]" />
                <span>{op.keyword}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
