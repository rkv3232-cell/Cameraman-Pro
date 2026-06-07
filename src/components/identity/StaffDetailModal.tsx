import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, CreditCard, Phone, Mail, MapPin, Award, Calendar, Star,
  Edit3, CheckCircle2, Shield, Activity, QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { StaffMember, StaffEvent } from '../../types/staff';
import { getStaffEvents } from '../../services/staffService';

interface Props {
  member: StaffMember;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onIDCard: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  lead_photographer: 'Lead Photographer',
  second_shooter: 'Second Shooter',
  editor: 'Editor',
  drone_operator: 'Drone Operator',
  assistant: 'Assistant',
  freelancer: 'Freelancer',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-400/10',
  busy: 'text-amber-400 bg-amber-400/10',
  on_event: 'text-blue-400 bg-blue-400/10',
  offline: 'text-slate-400 bg-slate-400/10',
  suspended: 'text-red-400 bg-red-400/10',
};

export function StaffDetailModal({ member, canManage, onClose, onEdit, onIDCard }: Props) {
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const qrUrl = `${window.location.origin}/staff/${member.employeeId}`;

  useEffect(() => {
    getStaffEvents(member.id).then((evts) => {
      setEvents(evts);
      setLoadingEvents(false);
    });
  }, [member.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface-base)] border border-[var(--border-light)] shadow-2xl"
      >
        {/* Hero Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-hover)] to-[var(--surface-active)]" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9a227]/5 rounded-full blur-3xl" />
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {member.profilePhoto ? (
                  <img
                    src={member.profilePhoto}
                    alt={member.fullName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#c9a227]/40 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c9a227]/20 to-[#1a2744] border-2 border-[#c9a227]/30 flex items-center justify-center">
                    <span className="text-3xl font-black text-[#c9a227]">
                      {member.fullName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[var(--text-primary)]">{member.fullName}</h2>
                    {member.isVerified && (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[#c9a227] font-bold text-sm font-mono">{member.employeeId}</p>
                  <p className="text-[var(--text-secondary)] text-sm">{ROLE_LABELS[member.role]}</p>
                  <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[member.status]}`}>
                    {member.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button
                      onClick={onIDCard}
                      className="p-2 rounded-xl bg-[#c9a227]/10 hover:bg-[#c9a227]/20 text-[#c9a227] transition-colors"
                      title="Generate ID Card"
                    >
                      <CreditCard size={18} />
                    </button>
                    <button
                      onClick={onEdit}
                      className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Activity} label="Events" value={events.length.toString()} />
            <StatCard icon={Calendar} label="Joined" value={member.joiningDate ? new Date(member.joiningDate).getFullYear().toString() : '—'} />
            <StatCard icon={Award} label="Exp" value={member.experience || '—'} />
          </div>

          {/* Contact & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoSection title="Contact">
              {member.phone && <InfoItem icon={Phone} label="Phone" value={member.phone} />}
              {member.email && <InfoItem icon={Mail} label="Email" value={member.email} />}
              {member.emergencyContact && (
                <InfoItem icon={Shield} label="Emergency" value={`${member.emergencyContact} ${member.emergencyPhone || ''}`} />
              )}
            </InfoSection>
            <InfoSection title="Location">
              {(member.address || member.city) && (
                <InfoItem icon={MapPin} label="Address" value={[member.address, member.city, member.state, member.country].filter(Boolean).join(', ')} />
              )}
              {member.branch && <InfoItem icon={MapPin} label="Branch" value={member.branch} />}
              {member.bloodGroup && <InfoItem icon={Shield} label="Blood Group" value={member.bloodGroup} />}
            </InfoSection>
          </div>

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#c9a227]/10 text-[#c9a227] text-xs font-medium border border-[#c9a227]/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-light)]">
            <div className="p-2 bg-white rounded-xl">
              <QRCodeSVG value={qrUrl} size={72} fgColor="#0a0f1e" bgColor="white" level="H" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <QrCode size={14} className="text-[#c9a227]" />
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Verification QR</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-mono break-all">{qrUrl}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Scan to view public verification page</p>
            </div>
          </div>

          {/* Event History */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Recent Events</h3>
            {loadingEvents ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-tertiary)] text-sm">No events recorded yet</div>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-light)]">
                    <div className="w-8 h-8 rounded-lg bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
                      <Star size={14} className="text-[#c9a227]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] font-medium truncate">{evt.eventName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{evt.clientName} · {evt.eventDate}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      evt.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      evt.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-light)] text-center">
      <Icon size={16} className="text-[#c9a227] mx-auto mb-1" />
      <div className="text-lg font-black text-[var(--text-primary)]">{value}</div>
      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-light)] space-y-2">
      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={13} className="text-[#c9a227] mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-[var(--text-tertiary)] font-medium">{label}</p>
        <p className="text-xs text-[var(--text-secondary)]">{value}</p>
      </div>
    </div>
  );
}
