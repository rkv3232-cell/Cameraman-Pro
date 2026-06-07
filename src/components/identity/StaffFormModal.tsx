import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, User, MapPin, Award, FileText } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { addStaffMember, updateStaffMember } from '../../services/staffService';
import type { StaffMember, StaffRole, StaffStatus } from '../../types/staff';
import toast from 'react-hot-toast';

interface FormData {
  fullName: string;
  email?: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  experience: string;
  skills: string;
  address: string;
  city: string;
  state: string;
  country: string;
  branch: string;
  joiningDate: string;
  notes: string;
}

interface Props {
  studioId: string;
  existing?: StaffMember;
  onClose: () => void;
}

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'lead_photographer', label: 'Lead Photographer' },
  { value: 'second_shooter',    label: 'Second Shooter' },
  { value: 'editor',            label: 'Editor' },
  { value: 'drone_operator',    label: 'Drone Operator' },
  { value: 'assistant',         label: 'Assistant' },
  { value: 'freelancer',        label: 'Freelancer' },
];

export function StaffFormModal({ studioId, existing, onClose }: Props) {
  const { userProfile } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: existing ? {
      fullName: existing.fullName,
      email: existing.email,
      phone: existing.phone,
      role: existing.role,
      status: existing.status,
      experience: existing.experience || '',
      skills: existing.skills?.join(', ') || '',
      address: existing.address || '',
      city: existing.city || '',
      state: existing.state || '',
      country: existing.country || 'India',
      branch: existing.branch || '',
      joiningDate: existing.joiningDate || new Date().toISOString().slice(0,10),
      notes: existing.notes || '',
    } : {
      country: 'India',
      status: 'active',
      role: 'lead_photographer',
      joiningDate: new Date().toISOString().slice(0, 10),
    }
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        experience: data.experience,
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        branch: data.branch,
        joiningDate: data.joiningDate,
        notes: data.notes,
        profilePhoto: existing?.profilePhoto || '',
        bloodGroup: existing?.bloodGroup || '',
        emergencyContact: existing?.emergencyContact || '',
        emergencyPhone: existing?.emergencyPhone || '',
        studioId,
        idCardEnabled: existing?.idCardEnabled ?? true,
        isVerified: existing?.isVerified ?? true,
        createdBy: userProfile?.uid,
      };

      if (existing) {
        await updateStaffMember(existing.id, payload);
        toast.success('Staff member updated');
      } else {
        await addStaffMember(studioId, payload as any);
        toast.success('Staff member added successfully');
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save staff member');
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface-base)] border border-[var(--border-light)] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--border-light)] bg-[var(--surface-base)] backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {existing ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {existing ? 'Update staff information' : 'Fill in details to create a new staff profile'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.fullName?.message}>
                <input {...register('fullName', { required: 'Required' })} placeholder="John Doe" className={inputCls} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register('email')} type="email" placeholder="john@studio.com" className={inputCls} />
              </Field>
              <Field label="Phone *" error={errors.phone?.message}>
                <input {...register('phone', { required: 'Required' })} placeholder="+91 98765 43210" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Professional Info */}
          <Section title="Professional Details" icon={Award}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Role *">
                <select {...register('role', { required: 'Required' })} className={inputCls}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select {...register('status')} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="busy">Busy</option>
                  <option value="on_event">On Event</option>
                  <option value="offline">Offline</option>
                  <option value="suspended">Suspended</option>
                </select>
              </Field>
              <Field label="Joining Date">
                <input {...register('joiningDate')} type="date" className={inputCls} />
              </Field>
              <Field label="Experience">
                <input {...register('experience')} placeholder="e.g. 3 years" className={inputCls} />
              </Field>
              <Field label="Branch / Location">
                <input {...register('branch')} placeholder="Main Office, Branch A..." className={inputCls} />
              </Field>
              <Field label="Skills">
                <input {...register('skills')} placeholder="Photography, Editing, Drone (comma separated)" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Address */}
          <Section title="Address" icon={MapPin}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Address" className="md:col-span-2">
                <input {...register('address')} placeholder="Street address" className={inputCls} />
              </Field>
              <Field label="City">
                <input {...register('city')} placeholder="City" className={inputCls} />
              </Field>
              <Field label="State">
                <input {...register('state')} placeholder="State" className={inputCls} />
              </Field>
              <Field label="Country">
                <input {...register('country')} placeholder="India" className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Internal Notes" icon={FileText}>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Any internal notes about this staff member..."
              className={`${inputCls} resize-none`}
            />
          </Section>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#c9a227] to-[#f0c040] text-[#0a0f1e] font-bold text-sm shadow-lg hover:shadow-[#c9a227]/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-[#0a0f1e]/40 border-t-[#0a0f1e] rounded-full animate-spin" />
              ) : null}
              {saving ? 'Saving...' : existing ? 'Save Changes' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:border-[#c9a227]/50 transition-colors";

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#c9a227]/10 flex items-center justify-center">
          <Icon size={14} className="text-[#c9a227]" />
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] text-sm">{title}</h3>
      </div>
      <div className="bg-[var(--surface-hover)] rounded-2xl p-4 border border-[var(--border-light)]">
        {children}
      </div>
    </div>
  );
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
