import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { subscribeToStaff, recordAttendance, getStudioAttendance } from '../../services/staffService';
import type { StaffMember, AttendanceRecord } from '../../types/staff';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function AttendanceManager() {
  const { studioId, isOwner, isAdmin } = useContext(AuthContext);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [markingFor, setMarkingFor] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canManage = isOwner || isAdmin;

  // Load staff
  useEffect(() => {
    if (!studioId) return;
    const unsub = subscribeToStaff(studioId, (members) => {
      setStaff(members.filter(m => m.status !== 'suspended'));
      setLoading(false);
    });
    return () => unsub();
  }, [studioId]);

  // Load attendance for selected month (optimized 1-query fetch)
  useEffect(() => {
    if (!staff.length || !studioId) return;
    const load = async () => {
      try {
        const allRecords = await getStudioAttendance(studioId, selectedMonth);
        const result: Record<string, AttendanceRecord[]> = {};
        
        // Initialize keys for all active staff members
        staff.forEach(s => {
          result[s.id] = [];
        });

        // Group records by staffId
        allRecords.forEach(r => {
          if (result[r.staffId]) {
            result[r.staffId].push(r);
          }
        });
        
        setAttendance(result);
      } catch (err) {
        console.error('Failed to load studio attendance:', err);
      }
    };
    load();
  }, [staff, selectedMonth, studioId]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const daysInMonth = new Date(parseInt(selectedMonth.slice(0,4)), parseInt(selectedMonth.slice(5,7)), 0).getDate();

  const getStatusForDay = (staffId: string, day: string): AttendanceRecord | undefined => {
    return attendance[staffId]?.find(r => r.date === day);
  };

  const markAttendance = async (staffId: string, date: string, status: AttendanceRecord['status']) => {
    if (!studioId || !canManage) return;
    setMarkingFor(staffId);
    try {
      await recordAttendance({ staffId, studioId, date, status });
      
      // Reload studio attendance in sync
      const allRecords = await getStudioAttendance(studioId, selectedMonth);
      const result: Record<string, AttendanceRecord[]> = {};
      staff.forEach(s => {
        result[s.id] = [];
      });
      allRecords.forEach(r => {
        if (result[r.staffId]) {
          result[r.staffId].push(r);
        }
      });
      setAttendance(result);
      
      toast.success('Attendance marked');
    } catch (e) {
      console.error('Failed to record attendance:', e);
      toast.error('Failed to record attendance');
    } finally {
      setMarkingFor(null);
    }
  };

  const prevMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };

  const nextMonth = () => {
    const d = new Date(selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };

  const getMonthStats = (staffId: string) => {
    const records = attendance[staffId] || [];
    return {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      leave: records.filter(r => r.status === 'on_leave').length,
    };
  };

  const filteredStaff = staff.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  // Today's attendance summary
  const todayPresent = staff.filter(s => getStatusForDay(s.id, todayStr)?.status === 'present').length;
  const todayAbsent = staff.filter(s => getStatusForDay(s.id, todayStr)?.status === 'absent').length;
  const todayNotMarked = staff.length - staff.filter(s => !!getStatusForDay(s.id, todayStr)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1530] to-[#0a0f1e] text-white">
      {/* Header */}
      <div className="border-b border-[#c9a227]/20 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#c9a227] to-[#f0c040] flex items-center justify-center">
              <Clock size={20} className="text-[#0a0f1e]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Attendance Manager</h1>
              <p className="text-xs text-slate-400">Track daily attendance & monthly reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Today Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Present Today", value: todayPresent, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
            { label: "Absent Today", value: todayAbsent, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
            { label: "Not Marked", value: todayNotMarked, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
          ].map(card => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl ${card.bg} border ${card.border} text-center`}
            >
              <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
              <div className="text-xs text-slate-400 mt-1">{card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-bold text-white">
              {MONTHS[parseInt(selectedMonth.slice(5,7))-1]} {selectedMonth.slice(0,4)}
            </p>
            <p className="text-xs text-slate-500">{daysInMonth} days</p>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111827]/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#c9a227]/50 transition-colors"
          />
        </div>

        {/* Staff Attendance Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStaff.map((member, idx) => {
              const stats = getMonthStats(member.id);
              const todayRecord = getStatusForDay(member.id, todayStr);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-2xl bg-[#111827]/80 border border-white/5 hover:border-[#c9a227]/20 transition-all p-4"
                >
                  {/* Staff Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {member.profilePhoto ? (
                        <img src={member.profilePhoto} alt={member.fullName} className="w-9 h-9 rounded-xl object-cover border border-[#c9a227]/20" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#1a2744] border border-[#c9a227]/20 flex items-center justify-center text-[#c9a227] font-bold text-sm">
                          {member.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white text-sm">{member.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono">{member.employeeId}</p>
                      </div>
                    </div>

                    {/* Month Stats */}
                    <div className="flex items-center gap-3 text-center">
                      <div>
                        <div className="text-sm font-bold text-emerald-400">{stats.present}</div>
                        <div className="text-[9px] text-slate-500">Present</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-red-400">{stats.absent}</div>
                        <div className="text-[9px] text-slate-500">Absent</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-amber-400">{stats.halfDay}</div>
                        <div className="text-[9px] text-slate-500">Half Day</div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Mark */}
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Today:</span>
                      {(['present', 'absent', 'half_day', 'on_leave'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => markAttendance(member.id, todayStr, s)}
                          disabled={markingFor === member.id}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            todayRecord?.status === s
                              ? s === 'present' ? 'bg-emerald-500 text-white'
                                : s === 'absent' ? 'bg-red-500 text-white'
                                : s === 'half_day' ? 'bg-amber-500 text-white'
                                : 'bg-blue-500 text-white'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {s === 'present' ? 'P' : s === 'absent' ? 'A' : s === 'half_day' ? 'H' : 'L'}
                        </button>
                      ))}
                      {todayRecord && (
                        <span className={`ml-1 text-xs font-medium ${
                          todayRecord.status === 'present' ? 'text-emerald-400'
                          : todayRecord.status === 'absent' ? 'text-red-400'
                          : 'text-amber-400'
                        }`}>
                          {todayRecord.status.replace(/_/g,' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
