import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, ShieldAlert, Star } from "lucide-react";
import { useSEO } from "../../hooks/useSEO";

export const FreeTrial: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "pro";

  const [formData, setFormData] = useState({
    fullName: "",
    studioName: "",
    email: "",
    phone: "",
    teamSize: "1",
    password: ""
  });

  const [submitted, setSubmitted] = useState(false);

  useSEO({
    title: "Start Your 14-Day Free Trial | Cameraman Pro",
    description: "Experience the absolute best photography studio management software in India. No credit card required. Get instant access to features now.",
    keywords: "free photography software, trial photography CRM, studio ERP trial",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Free trial registered:", formData);
    setSubmitted(true);
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Conversion Copy & Social Proof */}
        <div className="lg:col-span-6 space-y-8">
          <div>
            <span className="text-[var(--accent-primary)] font-bold text-xs uppercase tracking-wider block mb-2">14-Day Free Pass</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] leading-tight">
              Grow Your Photography Business Today
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mt-4 leading-relaxed">
              Join hundreds of wedding studios and freelance creators in India who use Cameraman Pro to automate schedules, track invoices, manage edits, and delight clients.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[var(--accent-primary)] mt-1 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-bold text-[var(--text-primary)]">Zero Commitment</h4>
                <p className="text-sm text-[var(--text-secondary)]">No credit card or payment authorization required to start.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[var(--accent-primary)] mt-1 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-bold text-[var(--text-primary)]">Full Feature Access</h4>
                <p className="text-sm text-[var(--text-secondary)]">Explore client portals, calendars, expense ledgers, and crew controls immediately.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-[var(--accent-primary)] mt-1 flex-shrink-0" size={18} />
              <div>
                <h4 className="font-bold text-[var(--text-primary)]">Seamless Onboarding</h4>
                <p className="text-sm text-[var(--text-secondary)]">Import your current client list and inventory via spreadsheet templates.</p>
              </div>
            </div>
          </div>

          {/* Testimonial card */}
          <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-500 text-amber-500" />)}
            </div>
            <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed mb-4">
              "Cameraman Pro completely streamlined our pre-wedding and wedding schedules. Managing our 8-person crew in Delhi is now completely automated!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center font-bold">
                K
              </div>
              <div>
                <h5 className="font-bold text-xs text-[var(--text-primary)]">Karan Johar</h5>
                <p className="text-[10px] text-[var(--text-secondary)]">Founder, Delhi Creative Weddings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Conversion Card */}
        <div className="lg:col-span-6">
          <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Account Created!</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Thank you for registering your free trial. An activation link has been sent to your email address. You can log in and start using your dashboard now.
                </p>
                <div className="pt-4">
                  <Link 
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-3.5 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
                  >
                    Go to Workspace Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Start Your Trial</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    You've selected the <span className="text-[var(--accent-primary)] font-bold capitalize">{selectedPlan} Plan</span>. Change plan anytime.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Studio / Business Name</label>
                    <input
                      type="text"
                      name="studioName"
                      required
                      placeholder="e.g. Sharma Wedding Films"
                      value={formData.studioName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="rahul@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Mobile Number</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Size</label>
                      <select
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      >
                        <option value="1">Solo Freelancer</option>
                        <option value="2-5">2 - 5 Crew Members</option>
                        <option value="6-15">6 - 15 Crew Members</option>
                        <option value="15+">15+ Large Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full text-center py-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Create Free Account
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] text-center">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span>By submitting, you agree to our Terms and Privacy Policy.</span>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
