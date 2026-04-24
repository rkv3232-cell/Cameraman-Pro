import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from './useBookings';
import { createBabuAgent, AgentAlert } from '../lib/babuAgent';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { voiceService } from '../lib/voiceService';
import toast from 'react-hot-toast';

/**
 * Hook for BĀBU Autonomous Agent
 * Continuously monitors studio operations and generates proactive alerts
 */
export function useBabuAgent() {
    const { bookings, updateBooking } = useBookings();
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<AgentAlert[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isMonitoring, setIsMonitoring] = useState(true);
    const announcedAlertsRef = useRef<Set<string>>(new Set());

    /**
     * Run agent monitoring check
     */
    const runMonitoring = useCallback(() => {
        if (!isMonitoring || bookings.length === 0) return;

        const agent = createBabuAgent(bookings);
        const newAlerts = agent.monitorStudio();
        const agentStats = agent.getStats();

        setAlerts(newAlerts);
        setStats(agentStats);

        // Log agent activity
        if (newAlerts.length > 0) {
            console.log(`[BĀBU Agent] ${newAlerts.length} alerts generated`, newAlerts);

            // Voice announce critical alerts if voice is activated
            if (voiceService.isActivated()) {
                newAlerts.forEach(alert => {
                    // Only announce critical alerts, and only once
                    if (
                        alert.severity === 'critical' &&
                        !announcedAlertsRef.current.has(alert.id)
                    ) {
                        const announcement = `Alert! ${alert.title}. ${alert.message}`;
                        setTimeout(() => {
                            voiceService.speak(announcement);
                        }, 500);
                        announcedAlertsRef.current.add(alert.id);
                    }
                });
            }
        }
    }, [bookings, isMonitoring]);

    /**
     * Execute agent action
     */
    const executeAction = useCallback(async (action: any) => {
        try {
            switch (action.type) {
                case 'navigate':
                    if (action.data?.page) {
                        navigate(action.data.page);
                    }
                    break;

                case 'execute':
                    await handleExecuteAction(action.data);
                    break;

                case 'dismiss':
                    // Just dismiss, no action
                    break;

                default:
                    console.warn('Unknown action type:', action.type);
            }
        } catch (error) {
            console.error('Action execution failed:', error);
            toast.error('Action failed. Please try again.');
        }
    }, [navigate]);

    /**
     * Handle executable actions
     */
    const handleExecuteAction = async (data: any) => {
        switch (data.action) {
            case 'confirm':
                // Confirm booking
                if (data.bookingId) {
                    await updateBooking(data.bookingId, { status: 'confirmed' });
                    toast.success('Booking confirmed!');
                    runMonitoring(); // Re-run monitoring
                }
                break;

            case 'whatsapp':
                // Send WhatsApp message
                if (data.phone && data.message) {
                    sendWhatsAppMessage(data.phone, data.message);
                    toast.success('WhatsApp opened');
                }
                break;

            case 'send_payment_reminders':
                // Send payment reminders to multiple bookings
                if (data.bookings && Array.isArray(data.bookings)) {
                    // This would ideally batch send WhatsApp messages
                    toast.success(`Sending reminders to ${data.bookings.length} clients...`);
                    // TODO: Implement batch WhatsApp sending
                }
                break;

            case 'notify_editor':
                // Notify editor about delay
                toast('Editor notification sent (placeholder)', { icon: 'ℹ️' });
                // TODO: Implement editor notification system
                break;

            default:
                console.warn('Unknown execute action:', data.action);
        }
    };

    /**
     * Dismiss an alert
     */
    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        // Remove from announced set when dismissed
        announcedAlertsRef.current.delete(alertId);
    }, []);

    /**
     * Pause/Resume monitoring
     */
    const toggleMonitoring = useCallback(() => {
        setIsMonitoring(prev => !prev);
    }, []);

    /**
     * Initial monitoring on mount and when bookings change
     */
    useEffect(() => {
        runMonitoring();
    }, [runMonitoring]);

    /**
     * Periodic monitoring (every 5 minutes)
     */
    useEffect(() => {
        if (!isMonitoring) return;

        const interval = setInterval(() => {
            runMonitoring();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [isMonitoring, runMonitoring]);

    return {
        alerts,
        stats,
        isMonitoring,
        executeAction,
        dismissAlert,
        toggleMonitoring,
        refreshMonitoring: runMonitoring
    };
}
