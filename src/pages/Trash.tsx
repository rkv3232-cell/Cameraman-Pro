import { useTrash } from "../hooks/useTrash";
import { format } from "date-fns";
import { Trash2, RotateCcw, AlertOctagon } from "lucide-react";

export const Trash = () => {
    const { trashItems, loading, restoreItem, permanentDelete } = useTrash();

    if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading trash...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <Trash2 className="text-red-500" /> Bin (Recycle)
            </h1>
            <p className="text-[var(--text-secondary)]">Items are automatically removed after 30 days.</p>

            <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] overflow-hidden shadow-sm">
                {trashItems.length > 0 ? (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
                                    <tr>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Type</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Items Details</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Deleted At</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-light)]">
                                    {trashItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                                            <td className="p-4 capitalize text-[var(--text-secondary)]">
                                                <span className="px-2 py-1 rounded-md bg-[var(--bg-secondary)] text-xs border border-[var(--border-light)]">
                                                    {item.originalCollection}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[var(--text-primary)]">
                                                <div className="font-medium">
                                                    {item.data?.clientName || item.data?.name || "Unknown Item"}
                                                </div>
                                                <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                                                    ID: {item.originalId}
                                                </div>
                                            </td>
                                            <td className="p-4 text-[var(--text-secondary)] text-sm">
                                                {item.deletedAt && item.deletedAt.toDate ? format(item.deletedAt.toDate(), "PP p") : 'Unknown Date'}
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <button
                                                    onClick={() => restoreItem(item)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="Restore"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => permanentDelete(item.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Permanently Delete"
                                                >
                                                    <AlertOctagon size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {trashItems.map((item) => (
                                <div key={item.id} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-light)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-medium text-[var(--text-primary)]">
                                                {item.data?.clientName || item.data?.name || "Unknown Item"}
                                            </div>
                                            <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                                                ID: {item.originalId}
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 rounded-md bg-[var(--surface-base)] text-xs border border-[var(--border-light)] capitalize text-[var(--text-secondary)]">
                                            {item.originalCollection}
                                        </span>
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-3">
                                        Deleted: {item.deletedAt && item.deletedAt.toDate ? format(item.deletedAt.toDate(), "PP p") : 'Unknown Date'}
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-[var(--border-light)] pt-3">
                                        <button
                                            onClick={() => restoreItem(item)}
                                            className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                        >
                                            <RotateCcw size={14} /> Restore
                                        </button>
                                        <button
                                            onClick={() => permanentDelete(item.id)}
                                            className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <AlertOctagon size={14} /> Delete Forever
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center text-[var(--text-tertiary)]">
                        <Trash2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Trash is empty. Good housekeeping!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
