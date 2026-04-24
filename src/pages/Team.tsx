import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTeam } from "../hooks/useTeam";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/Modal";
import {
    Users,
    Copy,
    Shield,
    Crown,
    User,
    MoreVertical,
    UserPlus,
    Trash2,
    Share2,
    RefreshCw,
    Building2,
    Calendar,
    Mail,
    Phone,
    Check,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { TeamRole } from "../types";

// ─── ROLE BADGE COMPONENT ──────────────────────────
const RoleBadge = ({ role }: { role: TeamRole }) => {
    const config = {
        owner: {
            label: "Owner",
            icon: Crown,
            bgClass: "bg-amber-50 dark:bg-amber-500/10",
            textClass: "text-amber-700 dark:text-amber-400",
            borderClass: "border-amber-200 dark:border-amber-500/20",
        },
        admin: {
            label: "Admin",
            icon: Shield,
            bgClass: "bg-blue-50 dark:bg-blue-500/10",
            textClass: "text-blue-700 dark:text-blue-400",
            borderClass: "border-blue-200 dark:border-blue-500/20",
        },
        member: {
            label: "Member",
            icon: User,
            bgClass: "bg-[var(--bg-secondary)]",
            textClass: "text-[var(--text-secondary)]",
            borderClass: "border-[var(--border-light)]",
        },
    };

    const c = config[role];
    const Icon = c.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${c.bgClass} ${c.textClass} ${c.borderClass}`}
        >
            <Icon size={12} />
            {c.label}
        </span>
    );
};

// ─── MEMBER AVATAR ──────────────────────────────────
const MemberAvatar = ({ name, photoURL }: { name: string; photoURL?: string }) => {
    const initials = name
        .split(" ")
        .map(w => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    if (photoURL) {
        return (
            <img
                src={photoURL}
                alt={name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[var(--border-light)]"
            />
        );
    }

    const colors = [
        "bg-violet-500",
        "bg-blue-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-rose-500",
        "bg-cyan-500",
    ];
    const colorIdx = name.charCodeAt(0) % colors.length;

    return (
        <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${colors[colorIdx]}`}
        >
            {initials}
        </div>
    );
};

// ─── MAIN TEAM PAGE ─────────────────────────────────
export const Team = () => {
    const { studioId, userProfile } = useAuth();
    const {
        members,
        studioInfo,
        loading,
        error,
        currentUserRole,
        isOwner,
        canManageTeam,
        updateMemberRole,
        removeMember,
        refreshTeam,
    } = useTeam();

    // Modals
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<string | null>(null);
    const [selectedMemberName, setSelectedMemberName] = useState("");
    const [newRole, setNewRole] = useState<TeamRole>("member");
    const [actionLoading, setActionLoading] = useState(false);

    // Actions dropdown
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // ─── COPY STUDIO CODE ───────────────────────────
    const handleCopyCode = () => {
        if (studioId) {
            navigator.clipboard.writeText(studioId);
            toast.success("Studio code copied!");
        }
    };

    // ─── SHARE VIA WHATSAPP ─────────────────────────
    const handleShareWhatsApp = () => {
        const studioName = studioInfo?.name || "My Studio";
        const message = encodeURIComponent(
            `🎬 You are invited to join *${studioName}* on Cameraman Pro!\n\n` +
            `📋 Studio Code: *${studioId}*\n\n` +
            `1. Open Cameraman Pro\n` +
            `2. Go to Settings → Join Team\n` +
            `3. Enter the code above\n\n` +
            `💡 Manage bookings, inventory & more — together!`
        );
        window.open(`https://wa.me/?text=${message}`, "_blank");
    };

    // ─── ROLE CHANGE ────────────────────────────────
    const openRoleModal = (uid: string, name: string, currentRole: TeamRole) => {
        setSelectedMember(uid);
        setSelectedMemberName(name);
        setNewRole(currentRole === 'admin' ? 'member' : 'admin');
        setIsRoleModalOpen(true);
        setOpenMenuId(null);
    };

    const handleRoleChange = async () => {
        if (!selectedMember) return;
        setActionLoading(true);
        try {
            await updateMemberRole(selectedMember, newRole);
            toast.success(`Role updated to ${newRole}`);
            setIsRoleModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to update role");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── REMOVE MEMBER ──────────────────────────────
    const openRemoveModal = (uid: string, name: string) => {
        setSelectedMember(uid);
        setSelectedMemberName(name);
        setIsRemoveModalOpen(true);
        setOpenMenuId(null);
    };

    const handleRemoveMember = async () => {
        if (!selectedMember) return;
        setActionLoading(true);
        try {
            await removeMember(selectedMember);
            toast.success(`${selectedMemberName} removed from team`);
            setIsRemoveModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to remove member");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── GET ACTIONS FOR A MEMBER ───────────────────
    const getActionsForMember = (member: { uid: string; name: string; role: TeamRole }) => {
        const actions: { label: string; icon: any; onClick: () => void; danger?: boolean }[] = [];

        if (member.role === 'owner') return actions; // No actions on owner
        if (member.uid === userProfile?.uid) return actions; // No self-actions

        if (canManageTeam) {
            // Change role
            actions.push({
                label: member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin',
                icon: Shield,
                onClick: () => openRoleModal(member.uid, member.name, member.role),
            });

            // Remove (only owner can remove admins)
            if (isOwner || member.role !== 'admin') {
                actions.push({
                    label: 'Remove Member',
                    icon: Trash2,
                    onClick: () => openRemoveModal(member.uid, member.name),
                    danger: true,
                });
            }
        }

        return actions;
    };

    // ─── RENDER ─────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* ─── PAGE HEADER ─────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Team</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        People who have access to this studio
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleCopyCode}>
                        <Copy size={16} className="mr-2" />
                        Copy Code
                    </Button>
                    {canManageTeam && (
                        <Button onClick={() => setIsInviteModalOpen(true)}>
                            <UserPlus size={16} className="mr-2" />
                            Invite Member
                        </Button>
                    )}
                </div>
            </div>

            {/* ─── STUDIO INFO CARD ──────────────── */}
            <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                {studioInfo?.name || "Loading..."}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-[var(--text-secondary)] font-mono bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-light)]">
                                    {studioId || "------"}
                                </span>
                                <RoleBadge role={currentUserRole || "member"} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{members.length}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">Members</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {members.filter(m => m.status === "active").length}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── TEAM MEMBERS LIST ─────────────── */}
            <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-[var(--border-light)] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Users size={20} className="text-[var(--accent-primary)]" />
                        Team Members
                    </h3>
                    <button
                        onClick={() => refreshTeam()}
                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                        <p className="text-[var(--text-secondary)] mt-3 text-sm">Loading team...</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center">
                        <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
                        <p className="text-red-500 text-sm">{error}</p>
                        <Button variant="secondary" className="mt-4" onClick={() => refreshTeam()}>
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* ─── DESKTOP TABLE ──────────────────── */}
                        <div className="hidden md:block">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
                                    <tr>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">
                                            Member
                                        </th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">
                                            Role
                                        </th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">
                                            Status
                                        </th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">
                                            Joined
                                        </th>
                                        <th className="p-4 font-medium text-right uppercase tracking-wider text-xs">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-light)]">
                                    {members.map(member => {
                                        const actions = getActionsForMember(member);
                                        const isCurrentUser = member.uid === userProfile?.uid;

                                        return (
                                            <tr
                                                key={member.uid}
                                                className="hover:bg-[var(--surface-hover)] transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <MemberAvatar
                                                            name={member.name}
                                                            photoURL={member.photoURL}
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-[var(--text-primary)]">
                                                                    {member.name}
                                                                </p>
                                                                {isCurrentUser && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold uppercase">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                {member.email && (
                                                                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                                        <Mail size={10} />
                                                                        {member.email}
                                                                    </span>
                                                                )}
                                                                {member.phone && (
                                                                    <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                                        <Phone size={10} />
                                                                        {member.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <RoleBadge role={member.role} />
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 text-sm">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        <span className="text-[var(--text-primary)] font-medium">
                                                            Active
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-[var(--text-primary)]">
                                                        {member.joinedAt
                                                            ? format(
                                                                member.joinedAt.toDate
                                                                    ? member.joinedAt.toDate()
                                                                    : new Date(member.joinedAt as any),
                                                                "dd MMM yyyy"
                                                            )
                                                            : "-"}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-tertiary)]">
                                                        {member.joinedAt
                                                            ? format(
                                                                member.joinedAt.toDate
                                                                    ? member.joinedAt.toDate()
                                                                    : new Date(member.joinedAt as any),
                                                                "hh:mm a"
                                                            )
                                                            : ""}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {actions.length > 0 ? (
                                                        <div className="relative inline-block">
                                                            <button
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(
                                                                        openMenuId === member.uid
                                                                            ? null
                                                                            : member.uid
                                                                    );
                                                                }}
                                                                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                                                            >
                                                                <MoreVertical size={16} />
                                                            </button>
                                                            {openMenuId === member.uid && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-10"
                                                                        onClick={() => setOpenMenuId(null)}
                                                                    />
                                                                    <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl shadow-lg py-1 animate-scale-up">
                                                                        {actions.map((action, i) => {
                                                                            const ActionIcon = action.icon;
                                                                            return (
                                                                                <button
                                                                                    key={i}
                                                                                    onClick={action.onClick}
                                                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${action.danger
                                                                                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                                                        : "text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                                                                                        }`}
                                                                                >
                                                                                    <ActionIcon size={16} />
                                                                                    {action.label}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-disabled)]">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ─── MOBILE CARD VIEW ───────────────── */}
                        <div className="md:hidden divide-y divide-[var(--border-light)]">
                            {members.map(member => {
                                const actions = getActionsForMember(member);
                                const isCurrentUser = member.uid === userProfile?.uid;

                                return (
                                    <div key={member.uid} className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <MemberAvatar
                                                    name={member.name}
                                                    photoURL={member.photoURL}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-[var(--text-primary)] truncate">
                                                            {member.name}
                                                        </p>
                                                        {isCurrentUser && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold uppercase shrink-0">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {actions.length > 0 && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            setOpenMenuId(
                                                                openMenuId === member.uid
                                                                    ? null
                                                                    : member.uid
                                                            )
                                                        }
                                                        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {openMenuId === member.uid && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-10"
                                                                onClick={() => setOpenMenuId(null)}
                                                            />
                                                            <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl shadow-lg py-1">
                                                                {actions.map((action, i) => {
                                                                    const ActionIcon = action.icon;
                                                                    return (
                                                                        <button
                                                                            key={i}
                                                                            onClick={action.onClick}
                                                                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${action.danger
                                                                                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                                                : "text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                                                                                }`}
                                                                        >
                                                                            <ActionIcon size={16} />
                                                                            {action.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom row: Role, Status, Date */}
                                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                                            <RoleBadge role={member.role} />
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Active
                                            </span>
                                            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                                <Calendar size={10} />
                                                {member.joinedAt
                                                    ? format(
                                                        member.joinedAt.toDate
                                                            ? member.joinedAt.toDate()
                                                            : new Date(member.joinedAt as any),
                                                        "dd MMM yyyy"
                                                    )
                                                    : "-"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {members.length === 0 && !loading && (
                            <div className="p-12 text-center">
                                <div className="inline-block p-4 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-4">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-[var(--text-primary)]">
                                    No team members yet
                                </h3>
                                <p className="text-[var(--text-secondary)] mt-1 mb-6">
                                    Share your studio code to invite your team.
                                </p>
                                <Button onClick={() => setIsInviteModalOpen(true)}>
                                    <UserPlus size={16} className="mr-2" /> Invite Member
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ══════════════════════════════════════════════════
                 INVITE MEMBER MODAL
               ══════════════════════════════════════════════════ */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Invite Team Member"
                maxWidth="max-w-lg"
            >
                <div className="space-y-6">
                    {/* Studio Code Display */}
                    <div className="text-center">
                        <p className="text-sm text-[var(--text-secondary)] mb-3">
                            Share this Studio Code with your team member:
                        </p>
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-2 border-dashed border-violet-500/30 rounded-xl px-8 py-5">
                            <p className="text-4xl font-bold tracking-[0.3em] text-[var(--text-primary)] font-mono">
                                {studioId || "------"}
                            </p>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl p-4">
                        <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                            How it works:
                        </p>
                        <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
                            <li>Share this code with your team member</li>
                            <li>They sign in to Cameraman Pro</li>
                            <li>Go to <strong>Settings → Join Team</strong></li>
                            <li>Enter the Studio Code</li>
                            <li>
                                They'll join as <strong>Member</strong> — you can promote them later
                            </li>
                        </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={handleCopyCode} className="w-full">
                            <Copy size={16} className="mr-2" />
                            Copy Code
                        </Button>
                        <Button
                            onClick={handleShareWhatsApp}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Share2 size={16} className="mr-2" />
                            Share on WhatsApp
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ══════════════════════════════════════════════════
                 CHANGE ROLE MODAL
               ══════════════════════════════════════════════════ */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title="Change Member Role"
            >
                <div className="space-y-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Change role for <strong className="text-[var(--text-primary)]">{selectedMemberName}</strong>:
                    </p>

                    <div className="space-y-3">
                        {/* Admin Option */}
                        <button
                            onClick={() => setNewRole('admin')}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${newRole === 'admin'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                : 'border-[var(--border-light)] bg-[var(--surface-base)] hover:bg-[var(--surface-hover)]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Shield size={20} className={newRole === 'admin' ? 'text-blue-500' : 'text-[var(--text-tertiary)]'} />
                                <div>
                                    <p className={`font-semibold ${newRole === 'admin' ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--text-primary)]'}`}>
                                        Admin
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Can view team, invite members, manage bookings
                                    </p>
                                </div>
                                {newRole === 'admin' && (
                                    <Check size={20} className="ml-auto text-blue-500" />
                                )}
                            </div>
                        </button>

                        {/* Member Option */}
                        <button
                            onClick={() => setNewRole('member')}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${newRole === 'member'
                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                : 'border-[var(--border-light)] bg-[var(--surface-base)] hover:bg-[var(--surface-hover)]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <User size={20} className={newRole === 'member' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'} />
                                <div>
                                    <p className={`font-semibold ${newRole === 'member' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                                        Member
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Can view data, no management permissions
                                    </p>
                                </div>
                                {newRole === 'member' && (
                                    <Check size={20} className="ml-auto text-[var(--accent-primary)]" />
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-light)]">
                        <Button variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRoleChange} isLoading={actionLoading}>
                            Update Role
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ══════════════════════════════════════════════════
                 REMOVE MEMBER MODAL
               ══════════════════════════════════════════════════ */}
            <Modal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                title="Remove Team Member"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                This action is irreversible
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                <strong>{selectedMemberName}</strong> will lose access to this studio's
                                bookings, inventory, and other data immediately. A new personal studio will
                                be created for them.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-light)]">
                        <Button variant="secondary" onClick={() => setIsRemoveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleRemoveMember} isLoading={actionLoading}>
                            <Trash2 size={16} className="mr-2" />
                            Remove Member
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
