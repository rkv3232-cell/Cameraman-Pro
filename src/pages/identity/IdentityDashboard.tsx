import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, Shield, CreditCard, Eye,
  CheckCircle2, XCircle, Clock, Star, WifiOff,
  Edit3, Trash2, MoreVertical
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { subscribeToStaff, updateStaffMember, deleteStaffMember, getStaffAnalytics } from '../../services/staffService';
import type { StaffMember, StaffRole, StaffStatus } from '../../types/staff';
import { StaffFormModal } from '../../components/identity/StaffFormModal';
import { IDCardModal } from '../../components/identity/IDCardModal';
import { StaffDetailModal } from '../../components/identity/StaffDetailModal';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<StaffStatus, { label: string; color: string; icon: any }> = {
  active:    { label: 'Active',    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
  busy:      { label: 'Busy',      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',     icon: Clock },
  on_event:  { label: 'On Event',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',        icon: Star },
  offline:   { label: 'Offline',   color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',     icon: WifiOff },
  suspended: { label: 'Suspended', color: 'text-red-400 bg-red-400/10 border-red-400/20',           icon: XCircle },
};

const ROLE_LABELS: Record<StaffRole, string> = {
  lead_photographer: 'Lead Photographer',
  second_shooter:    'Second Shooter',
  editor:            'Editor',
  drone_operator:    'Drone Operator',
  assistant:         'Assistant',
  freelancer:        'Freelancer',
};

export function IdentityDashboard() {
  const { studioId, isOwner, isAdmin } = useContext(AuthContext);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<StaffRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StaffStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [idCardStaff, setIdCardStaff] = useState<StaffMember | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (!studioId) return;
    const unsub = subscribeToStaff(studioId, (members) => {
      setStaff(members);
      setLoading(false);
    });
    getStaffAnalytics(studioId).then(setAnalytics);
    return () => unsub();
  }, [studioId]);

  const filtered = staff.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || s.role === filterRole;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleStatusChange = async (member: StaffMember, status: StaffStatus) => {
    try {
      await updateStaffMember(member.id, { status });
      toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
    setMenuOpen(null);
  };

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`Delete ${member.fullName}? This cannot be undone.`)) return;
    try {
      await deleteStaffMember(member.id);
      toast.success('Staff member deleted');
    } catch (e) {
      toast.error('Failed to delete staff member');
    }
    setMenuOpen(null);
  };

  const toggleIdCard = async (member: StaffMember) => {
    await updateStaffMember(member.id, { idCardEnabled: !member.idCardEnabled });
    toast.success(member.idCardEnabled ? 'ID Card disabled' : 'ID Card enabled');
    setMenuOpen(null);
  };

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center shadow-lg shadow-[#c9a227]/30 flex-shrink-0">
            <Shield size={24} className="text-[#0a0f1e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Identity & Verification System
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage staff IDs, QR codes, and verification</p>
          </div>
        </div>
        {canManage && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#f0c040] text-[#0a0f1e] font-bold text-sm shadow-lg shadow-[#c9a227]/30 hover:shadow-[#c9a227]/50 transition-shadow self-start md:self-auto"
          >
            <UserPlus size={16} />
            Add Staff
          </motion.button>
        )}
      </div>

      <div className="space-y-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Staff', value: analytics.total, color: 'from-[#c9a227] to-[#f0c040]', glow: 'shadow-[#c9a227]/10' },
              { label: 'Active', value: analytics.active, color: 'from-emerald-500 to-emerald-400', glow: 'shadow-emerald-500/10' },
              { label: 'Busy', value: analytics.busy, color: 'from-amber-500 to-amber-400', glow: 'shadow-amber-500/10' },
              { label: 'On Event', value: analytics.onEvent, color: 'from-blue-500 to-blue-400', glow: 'shadow-blue-500/10' },
              { label: 'Offline', value: analytics.offline, color: 'from-slate-500 to-slate-400', glow: 'shadow-slate-500/10' },
              { label: 'Suspended', value: analytics.suspended, color: 'from-red-500 to-red-400', glow: 'shadow-red-500/10' },
            ].map((card) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl bg-[var(--surface-base)] border border-[var(--border-light)] p-4 shadow-sm ${card.glow}`}
              >
                <div className={`text-2xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                  {card.value}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{card.label}</div>
                <div className={`absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-r ${card.color} opacity-10 blur-lg`} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-base)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[#c9a227]/50 transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface-base)] border border-[var(--border-light)] text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[#c9a227]/50 transition-colors"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface-base)] border border-[var(--border-light)] text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[#c9a227]/50 transition-colors"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Staff Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-52 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-light)] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#c9a227]/10 flex items-center justify-center mb-4">
              <CreditCard size={36} className="text-[#c9a227]/50" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">No staff members found</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {canManage ? 'Click "Add Staff" to get started' : 'No staff available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((member, i) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  index={i}
                  canManage={canManage}
                  menuOpen={menuOpen === member.id}
                  onMenuToggle={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                  onView={() => { setViewingStaff(member); setMenuOpen(null); }}
                  onEdit={() => { setEditingStaff(member); setMenuOpen(null); }}
                  onIDCard={() => { setIdCardStaff(member); setMenuOpen(null); }}
                  onStatusChange={(s) => handleStatusChange(member, s)}
                  onToggleIdCard={() => toggleIdCard(member)}
                  onDelete={() => handleDelete(member)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <StaffFormModal
            studioId={studioId!}
            onClose={() => setShowAddModal(false)}
          />
        )}
        {editingStaff && (
          <StaffFormModal
            studioId={studioId!}
            existing={editingStaff}
            onClose={() => setEditingStaff(null)}
          />
        )}
        {viewingStaff && (
          <StaffDetailModal
            member={viewingStaff}
            canManage={canManage}
            onClose={() => setViewingStaff(null)}
            onEdit={() => { setEditingStaff(viewingStaff); setViewingStaff(null); }}
            onIDCard={() => { setIdCardStaff(viewingStaff); setViewingStaff(null); }}
          />
        )}
        {idCardStaff && (
          <IDCardModal
            member={idCardStaff}
            onClose={() => setIdCardStaff(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Staff Card ────────────────────────────────────────────────────────────────
interface StaffCardProps {
  member: StaffMember;
  index: number;
  canManage: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onIDCard: () => void;
  onStatusChange: (s: StaffStatus) => void;
  onToggleIdCard: () => void;
  onDelete: () => void;
}

function StaffCard({
  member, index, canManage, menuOpen,
  onMenuToggle, onView, onEdit, onIDCard, onStatusChange, onToggleIdCard, onDelete
}: StaffCardProps) {
  const status = STATUS_CONFIG[member.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group relative rounded-2xl bg-[var(--surface-base)] border border-[var(--border-light)] hover:border-[#c9a227]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#c9a227]/10"
    >
      {/* Gold glow top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a227]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            {member.profilePhoto ? (
              <img
                src={member.profilePhoto}
                alt={member.fullName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#c9a227]/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a2744] to-[#0d1530] border-2 border-[#c9a227]/20 flex items-center justify-center">
                <span className="text-xl font-bold text-[#c9a227]">
                  {member.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {member.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#0d1530]">
                <CheckCircle2 size={11} className="text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)] truncate">{member.fullName}</h3>
              {canManage && (
                <div className="relative">
                  <button
                    onClick={onMenuToggle}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -8 }}
                        className="absolute right-0 top-8 z-50 w-52 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-light)] shadow-2xl max-h-[320px] overflow-y-auto"
                      >
                        <div className="p-1">
                          <MenuBtn icon={Eye} label="View Profile" onClick={onView} />
                          <MenuBtn icon={Edit3} label="Edit Details" onClick={onEdit} />
                          <MenuBtn icon={CreditCard} label="Generate ID Card" onClick={onIDCard} />
                          <div className="my-1 border-t border-[var(--border-light)]" />
                          <div className="px-2 py-1">
                            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Set Status</p>
                            {(Object.keys(STATUS_CONFIG) as StaffStatus[]).map((s) => (
                              <button
                                key={s}
                                onClick={() => onStatusChange(s)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
                              >
                                <span className={`w-2 h-2 rounded-full ${s === 'active' ? 'bg-emerald-400' : s === 'busy' ? 'bg-amber-400' : s === 'on_event' ? 'bg-blue-400' : s === 'offline' ? 'bg-slate-400' : 'bg-red-400'}`} />
                                {STATUS_CONFIG[s].label}
                              </button>
                            ))}
                          </div>
                          <div className="my-1 border-t border-[var(--border-light)]" />
                          <MenuBtn
                            icon={member.idCardEnabled ? XCircle : CheckCircle2}
                            label={member.idCardEnabled ? 'Disable ID Card' : 'Enable ID Card'}
                            onClick={onToggleIdCard}
                          />
                          <MenuBtn icon={Trash2} label="Delete Staff" onClick={onDelete} danger />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <p className="text-xs text-[#c9a227] font-mono font-bold mt-0.5">{member.employeeId}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ROLE_LABELS[member.role]}</p>
          </div>
        </div>

        {/* Status & Tags */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
            <StatusIcon size={11} />
            {status.label}
          </span>
          {member.idCardEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#c9a227]/10 text-[#c9a227] border border-[#c9a227]/20">
              <CreditCard size={10} /> ID Active
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--surface-active)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors border border-[var(--border-light)]"
          >
            <Eye size={13} /> View
          </button>
          {canManage && (
            <>
              <button
                onClick={onIDCard}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#c9a227]/10 hover:bg-[#c9a227]/20 text-xs text-[#c9a227] font-medium transition-colors"
              >
                <CreditCard size={13} /> ID Card
              </button>
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-400 font-medium transition-colors"
              >
                <Edit3 size={13} /> Edit
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MenuBtn({ icon: Icon, label, onClick, danger = false }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
