import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Plus, Search, Camera, X
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { subscribeToStaff, addStaffEvent } from '../../services/staffService';
import type { StaffMember, StaffEvent } from '../../types/staff';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const EVENT_TYPES = ['wedding','corporate','portrait','commercial','product','event','other'];

export function EventHistoryManager() {
  const { studioId, isOwner, isAdmin } = useContext(AuthContext);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [allEvents, setAllEvents] = useState<StaffEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (!studioId) return;
    const unsub = subscribeToStaff(studioId, setStaff);
    return () => unsub();
  }, [studioId]);

  useEffect(() => {
    if (!studioId) return;
    // No orderBy → no composite index needed; sort in-memory
    const q = query(
      collection(db, 'staffEvents'),
      where('studioId', '==', studioId)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const events = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffEvent));
        events.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
        setAllEvents(events);
        setLoading(false);
      },
      (err) => {
        console.error('EventHistoryManager snapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [studioId]);

  const filtered = allEvents.filter(e => {
    const matchSearch = e.eventName.toLowerCase().includes(search.toLowerCase()) ||
      e.clientName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || e.eventType === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total: allEvents.length,
    completed: allEvents.filter(e => e.status === 'completed').length,
    upcoming: allEvents.filter(e => e.status === 'upcoming').length,
    ongoing: allEvents.filter(e => e.status === 'ongoing').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1530] to-[#0a0f1e] text-white">
      {/* Header */}
      <div className="border-b border-[#c9a227]/20 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center">
              <Star size={20} className="text-[#0a0f1e]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Event History</h1>
              <p className="text-xs text-slate-400">Track work history and performance</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#f0c040] text-[#0a0f1e] font-bold text-sm shadow-lg"
            >
              <Plus size={15} /> Add Event
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: 'Total', v: stats.total, c: 'text-[#c9a227]' },
            { l: 'Completed', v: stats.completed, c: 'text-emerald-400' },
            { l: 'Upcoming', v: stats.upcoming, c: 'text-blue-400' },
            { l: 'Ongoing', v: stats.ongoing, c: 'text-amber-400' },
          ].map(s => (
            <div key={s.l} className="p-3 rounded-xl bg-[#111827]/80 border border-white/5 text-center">
              <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111827]/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#c9a227]/50 transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#111827]/80 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-[#c9a227]/50"
          >
            <option value="all">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Star size={32} className="mx-auto mb-3 opacity-30" />
            <p>No events recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((evt, i) => {
              const staffMember = staff.find(s => s.id === evt.staffId);
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 rounded-2xl bg-[#111827]/80 border border-white/5 hover:border-[#c9a227]/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#c9a227]/10 flex items-center justify-center flex-shrink-0">
                      <Camera size={16} className="text-[#c9a227]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white text-sm truncate">{evt.eventName}</h3>
                        <EventStatusBadge status={evt.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {evt.clientName} · {evt.eventDate} · <span className="capitalize">{evt.eventType}</span>
                      </p>
                      {staffMember && (
                        <p className="text-xs text-[#c9a227]/70 mt-1">
                          👤 {staffMember.fullName} ({staffMember.employeeId})
                        </p>
                      )}
                    </div>
                    {evt.rating && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star size={12} className="text-[#c9a227] fill-[#c9a227]" />
                        <span className="text-xs text-slate-300 font-medium">{evt.rating}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddEventModal
            staff={staff}
            studioId={studioId!}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EventStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400',
    upcoming: 'bg-blue-500/10 text-blue-400',
    ongoing: 'bg-amber-500/10 text-amber-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${cfg[status] || cfg.upcoming}`}>
      {status.charAt(0).toUpperCase()+status.slice(1)}
    </span>
  );
}

interface AddEventModalProps {
  staff: StaffMember[];
  studioId: string;
  onClose: () => void;
}

function AddEventModal({ staff, studioId, onClose }: AddEventModalProps) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      staffId: '',
      eventName: '',
      eventType: 'wedding',
      clientName: '',
      eventDate: new Date().toISOString().slice(0,10),
      status: 'upcoming',
      rating: '',
      notes: '',
    }
  });

  const onSubmit = async (data: any) => {
    if (!data.staffId) { toast.error('Select a staff member'); return; }
    setSaving(true);
    try {
      await addStaffEvent({ ...data, studioId, rating: data.rating ? parseFloat(data.rating) : undefined });
      toast.success('Event added successfully');
      onClose();
    } catch (e) {
      toast.error('Failed to add event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#0d1530] to-[#111827] border border-[#c9a227]/20 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-bold text-white">Add Event Record</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {[
            { label: 'Staff Member', render: () => (
              <select {...register('staffId')} className={inputCls}>
                <option value="">Select staff...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.employeeId})</option>)}
              </select>
            )},
            { label: 'Event Name', render: () => <input {...register('eventName')} placeholder="Wedding Reception..." className={inputCls} /> },
            { label: 'Event Type', render: () => (
              <select {...register('eventType')} className={inputCls}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            )},
            { label: 'Client Name', render: () => <input {...register('clientName')} placeholder="Client name" className={inputCls} /> },
            { label: 'Event Date', render: () => <input {...register('eventDate')} type="date" className={inputCls} /> },
            { label: 'Status', render: () => (
              <select {...register('status')} className={inputCls}>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )},
            { label: 'Rating (1-5)', render: () => <input {...register('rating')} type="number" min="1" max="5" step="0.1" placeholder="4.5" className={inputCls} /> },
          ].map(({ label, render }) => (
            <div key={label}>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
              {render()}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#f0c040] text-[#0a0f1e] font-bold text-sm disabled:opacity-60">
              {saving ? 'Saving...' : 'Add Event'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-[#1a2744]/60 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#c9a227]/50 transition-colors";
