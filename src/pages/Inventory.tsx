import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/Modal";
import { Search, Plus, Trash2, Camera, Zap, Disc, Box, PenTool } from "lucide-react";
import { EquipmentCategory } from "../types";
import { formatMoney } from "../utils/currency";
import { EQUIPMENT_STATUS_CONFIG } from "../lib/equipmentConflict";

export const Inventory = () => {
    const navigate = useNavigate();
    const { inventory, loading, addEquipment, deleteEquipment } = useInventory();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');

    // Add Form State
    const [newItem, setNewItem] = useState<{
        name: string;
        category: EquipmentCategory;
    }>({
        name: "",
        category: "camera"
    });

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name) return;

        await addEquipment({
            name: newItem.name,
            category: newItem.category,
            dailyRentalRate: 0, // Default to 0 since not needed
            condition: 'good',
            purchaseDate: new Date() as any,
            notes: ''
        });

        setIsModalOpen(false);
        setNewItem({ name: "", category: "camera" });
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            await deleteEquipment(id);
        }
    };

    const filteredInventory = inventory.filter(item => {
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getIcon = (cat: string) => {
        switch (cat) {
            case 'camera': return <Camera size={20} />;
            case 'lighting': return <Zap size={20} />;
            case 'lens': return <Disc size={20} />;
            case 'accessory': return <Box size={20} />;
            default: return <PenTool size={20} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Inventory</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Equipment
                </Button>
            </div>

            {/* Search & Filter Bar - Redesigned for light mode */}
            <div className="flex gap-4 items-center bg-[var(--surface-base)] p-4 rounded-xl border border-[var(--border-light)] shadow-sm overflow-x-auto">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] h-4 w-4" />
                    <Input
                        placeholder="Search gear..."
                        className="pl-9 bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-light)]">
                    {(['all', 'camera', 'lens', 'lighting', 'accessory'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all
                                ${categoryFilter === cat ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-[var(--text-secondary)]">Loading inventory...</div>
            ) : filteredInventory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInventory.map(item => (
                        <div
                            key={item.id}
                            onClick={() => navigate(`/inventory/${item.id}`)}
                            className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl p-5 hover:border-[var(--accent-primary)]/30 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-lg text-[var(--accent-primary)]">
                                    {getIcon(item.category)}
                                </div>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                                    ${(EQUIPMENT_STATUS_CONFIG[item.status] ?? EQUIPMENT_STATUS_CONFIG['available']).badgeClass}`}>
                                    {(EQUIPMENT_STATUS_CONFIG[item.status] ?? EQUIPMENT_STATUS_CONFIG['available']).label}
                                </span>
                            </div>
                            <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors text-base">{item.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mt-1.5 mb-4">
                                <span>SN: {item.serialNumber || 'N/A'}</span>
                                <span>•</span>
                                {item.dailyRentalRate > 0 && <span className="text-[var(--text-secondary)] font-medium">{formatMoney(item.dailyRentalRate / 100)}/day</span>}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-[var(--border-light)]">
                                <Button
                                    variant="secondary"
                                    className="w-full text-xs h-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/inventory/${item.id}`);
                                    }}
                                >
                                    View Details
                                </Button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(item.id);
                                    }}
                                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] border-dashed shadow-sm">
                    <div className="inline-block p-4 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-4">
                        <Camera size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No equipment found</h3>
                    <p className="text-[var(--text-secondary)] mt-1 mb-6">Add your gear to start tracking availability.</p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add First Item
                    </Button>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Equipment"
            >
                <form onSubmit={handleAddItem} className="space-y-4">
                    <Input
                        label="Equipment Name *"
                        value={newItem.name}
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="e.g. Sony A7III"
                    />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Category *</label>
                        <select
                            className="w-full h-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            value={newItem.category}
                            onChange={e => setNewItem({ ...newItem, category: e.target.value as any })}
                        >
                            <option value="camera">Camera</option>
                            <option value="lens">Lens</option>
                            <option value="lighting">Lighting</option>
                            <option value="drone">Drone</option>
                            <option value="tripod">Tripod</option>
                            <option value="accessory">Accessory</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Item</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
