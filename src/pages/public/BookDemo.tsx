import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Calendar as CalendarIcon, Clock, Users, ArrowRight } from "lucide-react";
import { useSEO } from "../../hooks/useSEO";

export const BookDemo: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    studioName: "",
    email: "",
    phone: "",
    note: ""
  });

  useSEO({
    title: "Book a Personal Live Demo | Cameraman Pro",
    description: "Schedule a 1-on-1 walkthrough with our product expert. Learn how to configure calendars, invoice GST, and manage wedding crew attendance.",
    keywords: "book photography software demo, studio ERP demo call, schedule walkthrough",
  });

  const timeSlots = [
    "10:00 AM IST",
    "11:30 AM IST",
    "01:00 PM IST",
    "03:00 PM IST",
    "04:30 PM IST",
    "06:00 PM IST"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Demo booked:", { ...formData, selectedDate, selectedTime });
    setSubmitted(true);
  };

  const getUpcomingDates = () => {
    const dates = [];
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    for (let i = 1; i <= 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      // Skip Sundays
      if (d.getDay() !== 0) {
        dates.push({
          raw: d.toISOString().split("T")[0],
          formatted: d.toLocaleDateString("en-IN", options)
        });
      }
    }
    return dates;
  };

  const dates = getUpcomingDates();

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
            Product Walkthrough
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4">
            See Cameraman Pro in Action
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Schedule a 1-on-1 demo call with a workflow consultant. We'll help tailor the platform to your studio's booking, crew, and billing needs.
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Column: Demo Features */}
          <div className="md:col-span-5 bg-[var(--bg-secondary)] p-8 md:p-12 border-r border-[var(--border-light)] space-y-8">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">What to expect:</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">1-on-1 Consultation</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">A personalized video tour customized for your branch sizes and wedding workloads.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">15-Minute Efficiency Audit</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">We'll analyze your current spreadsheets and identify points to automate billing and selections.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">Q&A Session</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Get immediate answers to queries regarding invoicing, security, rules, or offline configurations.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-light)] pt-6 text-xs text-[var(--text-secondary)]">
              Looking for instant access? <Link to="/free-trial" className="text-[var(--accent-primary)] font-bold underline">Start a free trial instead</Link>.
            </div>
          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="md:col-span-7 p-8 md:p-12">
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Demo Request Confirmed!</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  We have successfully scheduled your demo session on <span className="text-[var(--text-primary)] font-bold">{selectedDate}</span> at <span className="text-[var(--text-primary)] font-bold">{selectedTime}</span>. A calendar invite with access links has been sent to your email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CalendarIcon size={14} /> Select a Date
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {dates.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedDate(d.raw)}
                        className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedDate === d.raw
                            ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md"
                            : "bg-[var(--bg-primary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
                        }`}
                      >
                        {d.formatted}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slot Selection */}
                {selectedDate && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Clock size={14} /> Select an Available Time Slot
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {timeSlots.map((ts, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedTime(ts)}
                          className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            selectedTime === ts
                              ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md"
                              : "bg-[var(--bg-primary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
                          }`}
                        >
                          {ts}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details Form */}
                {selectedDate && selectedTime && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Studio Name</label>
                        <input
                          type="text"
                          name="studioName"
                          required
                          value={formData.studioName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Special Requirements / Notes</label>
                      <textarea
                        name="note"
                        rows={3}
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder="e.g. We are looking to migrate from spreadsheets for 12 shooters..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all text-sm resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full text-center py-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        Confirm Demo Booking <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
