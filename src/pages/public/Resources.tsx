import React, { useState } from "react";
import { Download, FileSpreadsheet, FileCheck, Users, CheckCircle2 } from "lucide-react";
import { useSEO } from "../../hooks/useSEO";

export const Resources: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    studioName: ""
  });
  const [selectedMagnet, setSelectedMagnet] = useState("");

  useSEO({
    title: "Free Studio Resources & Templates | Cameraman Pro",
    description: "Download free photography templates, studio checklists, wedding photoshoot workflow sheets, and client trackers optimized for Indian photography studios.",
    keywords: "free photography templates, photo studio checklist, wedding shoot workflow xls, client tracking template",
  });

  const leadMagnets = [
    {
      id: "checklist",
      title: "Studio Management Checklist",
      desc: "A comprehensive day-to-day checklist covering booking verification, equipment prep, post-production backup status, and print album selection loops.",
      format: "PDF Document",
      icon: FileCheck
    },
    {
      id: "workflow",
      title: "Wedding Shoot Workflow Template",
      desc: "Step-by-step master production tracker mapping out milestones from advance deposit logging to final high-res delivery.",
      format: "Excel / Google Sheets",
      icon: FileSpreadsheet
    },
    {
      id: "tracker",
      title: "Photographer Client Tracking Sheet",
      desc: "Keep records of couple details, muhurat calendar slots, shooter crew logs, and custom domain delivery links in one sheet.",
      format: "Google Sheets Template",
      icon: Users
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTriggerDownload = (magnetId: string) => {
    setSelectedMagnet(magnetId);
    if (submitted) {
      // Direct mock file trigger
      triggerBrowserDownload(magnetId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Lead captured:", { ...formData, selectedMagnet });
    setSubmitted(true);
    if (selectedMagnet) {
      triggerBrowserDownload(selectedMagnet);
    }
  };

  const triggerBrowserDownload = (id: string) => {
    const content = id === "checklist"
      ? "Cameraman Pro - Studio Management Checklist\n\n1. Booking verification\n2. Event advance deposit checks\n3. Pre-shoot camera gear check\n4. Location geo check-in setup\n5. Raw drive backup verify\n6. Digital client selection client-proofing loop\n7. GST invoice sent"
      : id === "workflow"
      ? "Cameraman Pro - Wedding Shoot Workflow Excel Template\n\nColumns: Booking ID | Client | Date | Advance Paid | Assigned Shooters | Status | selection gallery | Album Status"
      : "Cameraman Pro - Photographer Client Tracking Sheet Template\n\nColumns: Client Name | Shoot Date | Mobile | Package | Remaining Due | Post-Production Status | Selection Approved";
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cameraman-pro-${id}-template.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
            Growth Resources
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6">
            Free Toolkit for Photography Studios
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Ready-to-use worksheets, checklists, and templates to streamline your shoots and organize crew operations.
          </p>
        </div>

        {/* Lead Capture Dialog Overlay */}
        {!submitted && selectedMagnet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setSelectedMagnet("")}
                className="absolute right-6 top-6 text-gray-500 hover:text-[var(--text-primary)] text-xl font-bold"
              >
                ✕
              </button>
              
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Get Instant Access</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
                Enter your details below to receive your free download file and monthly workflow optimization tips.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Studio / Business Name</label>
                  <input
                    type="text"
                    name="studioName"
                    required
                    value={formData.studioName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-center py-4 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download File Now
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {leadMagnets.map((magnet, idx) => {
            const Icon = magnet.icon;
            return (
              <div 
                key={idx}
                className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-8 flex flex-col justify-between shadow-md hover:shadow-xl transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center mb-6">
                    <Icon size={24} />
                  </div>

                  <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {magnet.format}
                  </span>

                  <h3 className="text-xl font-bold text-[var(--text-primary)] mt-4 mb-3">{magnet.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                    {magnet.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleTriggerDownload(magnet.id)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${
                    submitted 
                      ? "bg-emerald-500 text-white hover:opacity-90 shadow-md"
                      : "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--border-light)]/20"
                  }`}
                >
                  {submitted ? (
                    <>
                      <CheckCircle2 size={16} /> Download Copy
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Get Free Template
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Lead Capture success notice */}
        {submitted && (
          <div className="max-w-md mx-auto mt-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center py-4 px-6 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            <span className="text-xs font-semibold">Lead Captured successfully! Download links are now active.</span>
          </div>
        )}

      </div>
    </div>
  );
};
