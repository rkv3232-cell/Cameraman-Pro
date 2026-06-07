import { useState, useMemo } from "react";
import { Camera, Wind, Film, ChevronDown, User, Check, X, Users } from "lucide-react";
import { TeamMember, TeamAssignment, BookingTeamMember } from "../../types";

// ─── Role config ──────────────────────────────────────────────────────────────

interface RoleConfig {
    key: keyof Pick<TeamAssignment, 'mainPhotographer' | 'droneOperator' | 'editor'>;
    label: string;
    icon: React.ElementType;
    color: string;
    role: BookingTeamMember['role'];
}

const ROLES: RoleConfig[] = [
    { key: 'mainPhotographer', label: 'Main Photographer', icon: Camera, color: 'text-purple-500', role: 'lead_photographer' },
    { key: 'droneOperator', label: 'Drone Operator', icon: Wind, color: 'text-sky-500', role: 'drone_operator' },
    { key: 'editor', label: 'Editor', icon: Film, color: 'text-amber-500', role: 'editor' },
];

// ─── Member avatar ────────────────────────────────────────────────────────────

const MemberAvatar = ({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) => {
    const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    const sizeClass = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]';
    return (
        <div className={`${sizeClass} rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold flex items-center justify-center shrink-0 border border-[var(--accent-primary)]/30`}>
            {initials}
        </div>
    );
};

// ─── Single-role selector ─────────────────────────────────────────────────────

interface RoleSelectorProps {
    config: RoleConfig;
    assigned: BookingTeamMember | null | undefined;
    members: TeamMember[];
    onChange: (member: BookingTeamMember | null) => void;
    readOnly?: boolean;
}

const RoleSelector = ({ config, assigned, members, onChange, readOnly }: RoleSelectorProps) => {
    const [open, setOpen] = useState(false);
    const Icon = config.icon;

    const activeMembers = useMemo(() => members.filter(m => m.status === 'active'), [members]);

    const handleSelect = (member: TeamMember | null) => {
        if (member) {
            onChange({ uid: member.uid, name: member.name, role: config.role });
        } else {
            onChange(null);
        }
        setOpen(false);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-2 mb-1.5">
                <Icon size={14} className={config.color} />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{config.label}</span>
            </div>

            {readOnly ? (
                <div className="flex items-center gap-2 p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg">
                    {assigned ? (
                        <>
                            <MemberAvatar name={assigned.name} size="md" />
                            <span className="text-sm font-medium text-[var(--text-primary)]">{assigned.name}</span>
                        </>
                    ) : (
                        <span className="text-sm text-[var(--text-tertiary)] flex items-center gap-1.5">
                            <User size={14} /> Not assigned
                        </span>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-all text-sm
                        ${assigned
                            ? 'bg-[var(--surface-base)] border-[var(--accent-primary)]/30 hover:border-[var(--accent-primary)]/60'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-light)] hover:border-[var(--border-medium)]'}`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        {assigned ? (
                            <>
                                <MemberAvatar name={assigned.name} size="md" />
                                <span className="font-medium text-[var(--text-primary)] truncate">{assigned.name}</span>
                            </>
                        ) : (
                            <span className="text-[var(--text-tertiary)] flex items-center gap-1.5">
                                <User size={14} /> Tap to assign
                            </span>
                        )}
                    </div>
                    <ChevronDown size={14} className={`text-[var(--text-tertiary)] transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
                </button>
            )}

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl shadow-xl overflow-hidden">
                    {/* Clear option */}
                    {assigned && (
                        <button
                            type="button"
                            onClick={() => handleSelect(null)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-b border-[var(--border-light)]"
                        >
                            <X size={14} /> Remove assignment
                        </button>
                    )}
                    {activeMembers.length === 0 && (
                        <div className="px-3 py-3 text-xs text-[var(--text-tertiary)] text-center">
                            No team members found. Add members in the Team page.
                        </div>
                    )}
                    {activeMembers.map(member => {
                        const isSelected = assigned?.uid === member.uid;
                        return (
                            <button
                                key={member.uid}
                                type="button"
                                onClick={() => handleSelect(member)}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors
                                    ${isSelected
                                        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                        : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'}`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <MemberAvatar name={member.name} />
                                    <div className="text-left min-w-0">
                                        <p className="font-medium text-sm truncate">{member.name}</p>
                                        <p className="text-[10px] text-[var(--text-tertiary)] capitalize">{member.role}</p>
                                    </div>
                                </div>
                                {isSelected && <Check size={14} className="shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface TeamAssignmentPanelProps {
    assignment: TeamAssignment | null | undefined;
    members: TeamMember[];
    onUpdate: (assignment: TeamAssignment) => Promise<void> | void;
    saving?: boolean;
    /** If true, renders read-only (no dropdowns) */
    readOnly?: boolean;
}

export const TeamAssignmentPanel = ({
    assignment,
    members,
    onUpdate,
    saving,
    readOnly,
}: TeamAssignmentPanelProps) => {
    const [localAssignment, setLocalAssignment] = useState<TeamAssignment>(assignment ?? {});
    const [dirty, setDirty] = useState(false);

    // Sync when parent data changes (e.g. after save)
    // Only apply external updates when not dirty (user hasn't made local changes)

    const handleChange = (key: keyof Pick<TeamAssignment, 'mainPhotographer' | 'droneOperator' | 'editor'>, value: BookingTeamMember | null) => {
        const next = { ...localAssignment, [key]: value };
        setLocalAssignment(next);
        setDirty(true);
    };

    const handleSave = async () => {
        await onUpdate(localAssignment);
        setDirty(false);
    };

    const hasAnyAssignment = !!(
        localAssignment.mainPhotographer ||
        localAssignment.droneOperator ||
        localAssignment.editor
    );

    return (
        <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Users size={20} className="text-indigo-500" />
                    Team Assignment
                </h3>
                {hasAnyAssignment && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                        Assigned
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {ROLES.map(config => (
                    <RoleSelector
                        key={config.key}
                        config={config}
                        assigned={localAssignment[config.key] ?? assignment?.[config.key]}
                        members={members}
                        onChange={(val) => handleChange(config.key, val)}
                        readOnly={readOnly}
                    />
                ))}
            </div>

            {/* Save button (only in edit mode, only when dirty) */}
            {!readOnly && dirty && (
                <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="mt-5 w-full py-2 px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save Team Assignment'}
                </button>
            )}

            {/* Empty state */}
            {!hasAnyAssignment && !dirty && (
                <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
                    No team members assigned yet.{readOnly ? '' : ' Use the dropdowns above.'}
                </p>
            )}
        </section>
    );
};
