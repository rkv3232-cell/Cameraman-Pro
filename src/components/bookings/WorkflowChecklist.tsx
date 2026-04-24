import { useMemo } from "react";
import {
    HardDrive, ImageIcon, Video, Package, CheckCircle2, Circle, PartyPopper
} from "lucide-react";
import { Booking, TeamAssignment } from "../../types";
import {
    WORKFLOW_TASKS,
    TOTAL_TASKS,
    WorkflowTaskKey,
    progressColor,
    isWorkflowComplete,
} from "../../lib/workflowEngine";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TASK_ICONS: Record<WorkflowTaskKey, React.ElementType> = {
    dataBackup: HardDrive,
    photoEditing: ImageIcon,
    videoMixing: Video,
    albumSent: Package,
};

// ─── Assignee chip ────────────────────────────────────────────────────────────

const AssigneeChip = ({ name }: { name: string }) => {
    const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[10px] font-medium text-[var(--accent-primary)]">
            <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold text-[8px] flex items-center justify-center">
                {initials}
            </span>
            {name.split(' ')[0]}
        </span>
    );
};

// ─── Resolve assignee for a task from team assignment ─────────────────────────

function resolveTaskAssignee(key: WorkflowTaskKey, team: TeamAssignment | null | undefined): string | null {
    if (!team) return null;
    switch (key) {
        case 'dataBackup': return team.mainPhotographer?.name ?? null;
        case 'photoEditing': return team.editor?.name ?? null;
        case 'videoMixing': return team.editor?.name ?? null;
        case 'albumSent': return team.mainPhotographer?.name ?? team.editor?.name ?? null;
        default: return null;
    }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface WorkflowChecklistProps {
    postProductionStatus: Booking['postProductionStatus'];
    teamAssignment?: TeamAssignment | null;
    onToggle: (key: WorkflowTaskKey) => Promise<void> | void;
    /** Show as read-only, no checkboxes clickable */
    readOnly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WorkflowChecklist = ({
    postProductionStatus,
    teamAssignment,
    onToggle,
    readOnly,
}: WorkflowChecklistProps) => {

    const status = postProductionStatus ?? {
        dataBackup: false, photoEditing: false, videoMixing: false, albumSent: false, progress: 0
    };

    const completedCount = useMemo(
        () => [status.dataBackup, status.photoEditing, status.videoMixing, status.albumSent].filter(Boolean).length,
        [status]
    );

    const progress = status.progress ?? Math.round((completedCount / TOTAL_TASKS) * 100);
    const allDone = isWorkflowComplete(status);
    const barColor = progressColor(progress);

    return (
        <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    {allDone
                        ? <PartyPopper size={20} className="text-emerald-500" />
                        : <Circle size={20} className="text-blue-500" />
                    }
                    Workflow Checklist
                </h3>
                <span className={`text-sm font-bold ${allDone ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {completedCount}/{TOTAL_TASKS}
                </span>
            </div>

            {/* Progress bar */}
            <div className="mb-1 flex justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>Progress</span>
                <span>{progress}%</span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 mb-5 border border-[var(--border-light)] overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${barColor}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* All done banner */}
            {allDone && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        All tasks complete! Booking has been marked as&nbsp;<strong>Completed</strong>.
                        {status.completedAt && (
                            <span className="ml-1 text-emerald-600/70 dark:text-emerald-400/70">
                                ({new Date(status.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                            </span>
                        )}
                    </p>
                </div>
            )}

            {/* Checklist items */}
            <div className="space-y-2.5">
                {WORKFLOW_TASKS.map(task => {
                    const Icon = TASK_ICONS[task.key];
                    const isChecked = status[task.key] as boolean;
                    const assignee = resolveTaskAssignee(task.key, teamAssignment);
                    const completedBy = (status as any)[`${task.key}By`] as string | undefined;

                    return (
                        <div
                            key={task.key}
                            onClick={readOnly ? undefined : () => onToggle(task.key)}
                            role={readOnly ? undefined : 'button'}
                            tabIndex={readOnly ? undefined : 0}
                            onKeyDown={readOnly ? undefined : (e) => { if (e.key === ' ' || e.key === 'Enter') onToggle(task.key); }}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                ${readOnly ? '' : 'cursor-pointer'}
                                ${isChecked
                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20'
                                    : 'bg-[var(--bg-secondary)] border-[var(--border-light)] hover:border-[var(--border-medium)]'}`}
                        >
                            {/* Checkbox visual */}
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0
                                ${isChecked
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-[var(--text-tertiary)] bg-[var(--surface-base)]'}`}
                            >
                                {isChecked && <CheckCircle2 size={13} className="text-white" strokeWidth={2.5} />}
                            </div>

                            {/* Icon */}
                            <div className={`p-1.5 rounded-lg transition-colors
                                ${isChecked
                                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300'
                                    : 'bg-[var(--surface-base)] text-[var(--text-tertiary)] border border-[var(--border-light)]'}`}
                            >
                                <Icon size={13} />
                            </div>

                            {/* Label + assignee */}
                            <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium
                                    ${isChecked
                                        ? 'text-blue-700 dark:text-blue-200 line-through decoration-blue-400/60'
                                        : 'text-[var(--text-primary)]'}`}
                                >
                                    {task.label}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {assignee && !completedBy && (
                                        <span className="text-[10px] text-[var(--text-tertiary)]">
                                            Assigned: <AssigneeChip name={assignee} />
                                        </span>
                                    )}
                                    {completedBy && (
                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                            ✓ Done by <AssigneeChip name={completedBy} />
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status pill */}
                            {isChecked && (
                                <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-500/30">
                                    Done
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
