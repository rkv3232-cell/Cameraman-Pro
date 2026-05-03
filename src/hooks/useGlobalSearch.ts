import { useState, useCallback, useMemo } from 'react';
import { useBookings } from './useBookings';
import { useInventory } from './useInventory';
import { useExpenses } from './useExpenses';
import { SearchResult } from '../types';
import { formatMoney } from '../utils/currency';

/**
 * Global Search Hook
 * Searches across bookings, clients, equipment, expenses
 */
export function useGlobalSearch() {
    const { bookings } = useBookings();
    const { inventory } = useInventory();
    const { expenses } = useExpenses();
    const [query, setQuery] = useState('');

    const results = useMemo((): SearchResult[] => {
        if (!query || query.length < 2) return [];

        const q = query.toLowerCase().trim();
        const results: SearchResult[] = [];

        // Search Bookings
        bookings.forEach(b => {
            const dateStr = b.eventDate?.toDate?.().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }).toLowerCase() || '';

            const match =
                b.clientName?.toLowerCase().includes(q) ||
                b.clientPhone?.includes(q) ||
                b.eventType?.toLowerCase().includes(q) ||
                b.venue?.toLowerCase().includes(q) ||
                b.notes?.toLowerCase().includes(q) ||
                dateStr.includes(q);

            if (match) {
                results.push({
                    id: b.id,
                    type: 'booking',
                    title: `${b.clientName} — ${b.eventType}`,
                    subtitle: `${b.venue} • ${b.status} • ${dateStr}`,
                    path: `/bookings/${b.id}`,
                    icon: '📋'
                });
            }

            // Search within client info (deduplicated)
            if (
                b.clientName?.toLowerCase().includes(q) &&
                !results.find(r => r.type === 'client' && r.title === b.clientName)
            ) {
                results.push({
                    id: `client-${b.clientName}`,
                    type: 'client',
                    title: b.clientName,
                    subtitle: `${b.clientPhone || ''} • ${bookings.filter(bk => bk.clientName === b.clientName).length} bookings`,
                    path: `/bookings/${b.id}`,
                    icon: '👤'
                });
            }
        });

        // Search Equipment
        inventory.forEach(item => {
            const match =
                item.name?.toLowerCase().includes(q) ||
                item.serialNumber?.toLowerCase().includes(q) ||
                item.category?.toLowerCase().includes(q);

            if (match) {
                results.push({
                    id: item.id,
                    type: 'equipment',
                    title: item.name,
                    subtitle: `${item.category} • ${item.status} • SN: ${item.serialNumber || 'N/A'}`,
                    path: `/inventory/${item.id}`,
                    icon: '📦'
                });
            }
        });

        // Search Expenses
        expenses.forEach(e => {
            const dateStr = e.date?.toDate?.().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }).toLowerCase() || '';

            const match =
                e.notes?.toLowerCase().includes(q) ||
                e.category?.toLowerCase().includes(q) ||
                e.linkedBookingName?.toLowerCase().includes(q) ||
                dateStr.includes(q);

            if (match) {
                results.push({
                    id: e.id,
                    type: 'expense',
                    title: `${e.category.replace('_', ' ')} — ${formatMoney(e.amount / 100)}`,
                    subtitle: `${dateStr} • ${e.notes || e.linkedBookingName || 'No notes'}`,
                    path: `/expenses`,
                    icon: '💸'
                });
            }
        });

        return results.slice(0, 20); // Cap at 20 results
    }, [query, bookings, inventory, expenses]);

    const search = useCallback((q: string) => {
        setQuery(q);
    }, []);

    const clear = useCallback(() => {
        setQuery('');
    }, []);

    return {
        query,
        results,
        search,
        clear
    };
}
