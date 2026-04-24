import { Booking } from '../types';

// ─── Task definitions ─────────────────────────────────────────────────────────

export type WorkflowTaskKey = 'dataBackup' | 'photoEditing' | 'videoMixing' | 'albumSent';

export interface WorkflowTask {
    key: WorkflowTaskKey;
    label: string;
    icon: string; // emoji shorthand used in WhatsApp messages etc.
    /** Which team role typically owns this task */
    defaultRole: 'main_photographer' | 'editor' | 'drone_operator' | 'any';
}

export const WORKFLOW_TASKS: WorkflowTask[] = [
    { key: 'dataBackup', label: 'Data Backup', icon: '💾', defaultRole: 'main_photographer' },
    { key: 'photoEditing', label: 'Photo Editing', icon: '🖼️', defaultRole: 'editor' },
    { key: 'videoMixing', label: 'Video Mixing', icon: '🎬', defaultRole: 'editor' },
    { key: 'albumSent', label: 'Album / Final Delivery', icon: '📦', defaultRole: 'any' },
];

export const TOTAL_TASKS = WORKFLOW_TASKS.length; // 4

// ─── Status helpers ───────────────────────────────────────────────────────────

type PostProduction = NonNullable<Booking['postProductionStatus']>;

const DEFAULT_STATUS: PostProduction = {
    dataBackup: false,
    photoEditing: false,
    videoMixing: false,
    albumSent: false,
    progress: 0,
};

/**
 * Recalculates `progress` from the boolean fields and returns an updated status object.
 * Call this whenever any field is toggled.
 */
export function recalculateProgress(status: PostProduction): PostProduction {
    const done = [status.dataBackup, status.photoEditing, status.videoMixing, status.albumSent].filter(Boolean).length;
    const progress = Math.round((done / TOTAL_TASKS) * 100);
    return { ...status, progress };
}

/**
 * Toggles a single task key and returns the fully updated status (incl. new progress).
 * Also stamps `completedAt` if all tasks finish simultaneously.
 */
export function toggleTask(
    current: PostProduction | null | undefined,
    key: WorkflowTaskKey,
    completedByName?: string
): PostProduction {
    const base = current ?? { ...DEFAULT_STATUS };
    const toggled = { ...base, [key]: !base[key] };

    // Stamp who completed the task (only when toggling ON)
    const byKey = `${key}By` as keyof PostProduction;
    if (toggled[key] && completedByName) {
        (toggled as any)[byKey] = completedByName;
    } else if (!toggled[key]) {
        (toggled as any)[byKey] = null;
    }

    const updated = recalculateProgress(toggled);

    // Stamp completedAt when all 4 are done for the first time
    const allDone = updated.dataBackup && updated.photoEditing && updated.videoMixing && updated.albumSent;
    if (allDone && !updated.completedAt) {
        updated.completedAt = new Date().toISOString();
    } else if (!allDone) {
        updated.completedAt = undefined;
    }

    return updated;
}

/**
 * Returns true when all 4 workflow tasks are complete.
 */
export function isWorkflowComplete(status: PostProduction | null | undefined): boolean {
    if (!status) return false;
    return status.dataBackup && status.photoEditing && status.videoMixing && status.albumSent;
}

/**
 * Progress bar colour based on completion percentage.
 */
export function progressColor(pct: number): string {
    if (pct === 100) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-blue-500';
    if (pct >= 25) return 'bg-amber-500';
    return 'bg-[var(--accent-primary)]';
}
