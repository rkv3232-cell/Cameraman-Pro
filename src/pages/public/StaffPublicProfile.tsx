import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Phone, MapPin, Calendar,
  Award, Star, Briefcase, AlertCircle, Loader2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getStaffByEmployeeId, getStaffEvents } from '../../services/staffService';
import type { StaffMember, StaffEvent } from '../../types/staff';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', manager: 'Manager',
  cameraman: 'Cameraman', editor: 'Video Editor',
  drone_operator: 'Drone Operator', studio_staff: 'Studio Staff',
};

import { useSEO } from '../../hooks/useSEO';
import { useStructuredData } from '../../hooks/useStructuredData';

export function StaffPublicProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [member, setMember] = useState<StaffMember | null>(null);
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useSEO({
    title: member ? `${member.fullName} | Verified Crew Member | Cameraman Pro` : "Staff Public Profile | Cameraman Pro",
    description: member 
      ? `Verify ${member.fullName}'s identity, active status, experience, recent completed events, and skills as a verified Cameraman Pro crew member.`
      : "Verify photographer, editor, or manager identity card and public profile on Cameraman Pro.",
    keywords: "verify crew member, photographer credentials, videography staff verification",
  });

  useStructuredData(member ? {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": member.fullName,
    "jobTitle": ROLE_LABELS[member.role] || "Crew Member",
    "worksFor": {
      "@type": "LocalBusiness",
      "name": "Cameraman Pro",
      "url": window.location.origin
    },
    "identifier": member.employeeId,
    "image": member.profilePhoto || `${window.location.origin}/cameraman-pro.png`
  } : {}, "staff-profile-schema");

  useEffect(() => {
    if (!employeeId) return;
    const idUpper = employeeId.toUpperCase();
    getStaffByEmployeeId(idUpper).then(async (m) => {
      if (!m) { setNotFound(true); setLoading(false); return; }
      setMember(m);
      const evts = await getStaffEvents(m.id);
      setEvents(evts.filter(e => e.status === 'completed'));
      setLoading(false);
    }).catch(() => { setNotFound(true); setLoading(false); });
  }, [employeeId]);

  const isInactive = member && (member.status === 'suspended' || member.status === 'offline');
  const completedEvents = events.filter(e => e.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060b18] via-[#0a1228] to-[#060b18] text-white">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c9a227]/5 rounded-full blur-3xl pointer-events-none" />

      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center">
              <Loader2 size={28} className="text-[#0a0f1e] animate-spin" />
            </div>
            <p className="text-slate-400 text-sm">Loading profile...</p>
          </div>
        </div>
      ) : notFound ? (
        <NotFoundPage />
      ) : member ? (
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Studio Brand Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a227]/10 border border-[#c9a227]/20">
              <div className="w-2 h-2 rounded-full bg-[#c9a227] animate-pulse" />
              <span className="text-[#c9a227] text-xs font-bold tracking-wider uppercase">Cameraman Pro</span>
            </div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2744]/80 to-[#0d1530]/80 border border-[#c9a227]/20 shadow-2xl shadow-[#c9a227]/5"
          >
            {/* Gold shimmer border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a227]/30 to-transparent" />

            {/* Status Banner */}
            <AnimatePresence>
              {isInactive ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="bg-red-500/10 border-b border-red-500/20 px-5 py-3 flex items-center gap-3"
                >
                  <XCircle size={18} className="text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-400 text-sm">Staff No Longer Active</p>
                    <p className="text-xs text-red-400/70">This staff member is currently not available</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 flex items-center gap-3"
                >
                  <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-400 text-sm">Verified Staff Member</p>
                    <p className="text-xs text-emerald-400/70">Identity confirmed by Cameraman Pro</p>
                  </div>
                  <Shield size={14} className="text-emerald-400/50 ml-auto" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Section */}
            <div className="p-6">
              <div className="flex items-start gap-5">
                {/* Photo */}
                <div className="relative flex-shrink-0">
                  {member.profilePhoto ? (
                    <img
                      src={member.profilePhoto}
                      alt={member.fullName}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-[#c9a227]/40 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#c9a227]/20 to-[#1a2744] border-2 border-[#c9a227]/30 flex items-center justify-center">
                      <span className="text-4xl font-black text-[#c9a227]">
                        {member.fullName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#0d1530] ${isInactive ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    {isInactive ? <XCircle size={14} className="text-white" /> : <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-white leading-tight">{member.fullName}</h1>
                  <p className="text-[#c9a227] font-bold text-sm mt-0.5 font-mono">{member.employeeId}</p>
                  <p className="text-slate-300 text-sm mt-0.5">{ROLE_LABELS[member.role]}</p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={member.status} />
                    {member.experience && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20 text-xs font-medium">
                        <Award size={10} /> {member.experience}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <StatBadge label="Joining Year" value={member.joiningDate ? new Date(member.joiningDate).getFullYear().toString() : '—'} />
                <StatBadge label="Events Done" value={completedEvents.length.toString()} />
                <StatBadge label="Rating" value={member.rating ? `${member.rating}/5` : '—'} />
              </div>

              {/* Public Contact Details */}
              <div className="mt-5 space-y-3">
                {member.phone && (
                  <PublicInfoRow icon={Phone} label="Contact" value={member.phone} />
                )}
                {(member.city || member.state) && (
                  <PublicInfoRow icon={MapPin} label="Location" value={[member.city, member.state, member.country].filter(Boolean).join(', ')} />
                )}
                <PublicInfoRow
                  icon={Calendar}
                  label="Joined"
                  value={member.joiningDate ? new Date(member.joiningDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}
                />
                <PublicInfoRow icon={Briefcase} label="Studio" value="Cameraman Pro" />
              </div>

              {/* Skills */}
              {member.skills && member.skills.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#1a2744] text-slate-300 text-xs border border-white/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Events */}
          {completedEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-4 rounded-3xl bg-gradient-to-br from-[#1a2744]/60 to-[#0d1530]/60 border border-white/5 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Briefcase size={14} className="text-[#c9a227]" />
                  Work Experience ({completedEvents.length} events)
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {completedEvents.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
                      <Star size={13} className="text-[#c9a227]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{evt.eventName}</p>
                      <p className="text-xs text-slate-500">{evt.eventDate} · {evt.eventType}</p>
                    </div>
                    {evt.rating && (
                      <div className="flex items-center gap-0.5">
                        <Star size={11} className="text-[#c9a227] fill-[#c9a227]" />
                        <span className="text-xs text-slate-300 font-medium">{evt.rating}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* QR & Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-4 flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1a2744]/40 border border-[#c9a227]/10">
              <div className="p-1.5 bg-white rounded-lg">
                <QRCodeSVG
                  value={`${window.location.origin}/staff/${member.employeeId}`}
                  size={56}
                  fgColor="#0a0f1e"
                  bgColor="white"
                  level="H"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-[#c9a227]">Verification QR Code</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{member.employeeId}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 text-center">
              Powered by <span className="text-[#c9a227] font-medium">Cameraman Pro</span> Identity System
            </p>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

// Sub-components
function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">Profile Not Found</h1>
        <p className="text-slate-400 text-sm">
          The staff ID you're looking for doesn't exist or may have been removed.
        </p>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    busy:      'bg-amber-500/15 text-amber-400 border-amber-500/20',
    on_event:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
    offline:   'bg-slate-500/15 text-slate-400 border-slate-500/20',
    suspended: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.offline}`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-[#1a2744]/50 border border-white/5">
      <div className="text-base font-black text-[#c9a227]">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function PublicInfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={13} className="text-[#c9a227]" />
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
