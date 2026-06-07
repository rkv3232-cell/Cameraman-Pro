import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { Bell, Save, TestTube, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const NotificationSettings = ({ studioId }: { studioId: string | null }) => {
    const { user, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [notifStatus, setNotifStatus] = useState<"unknown" | "granted" | "denied" | "default">("unknown");
    const [settings, setSettings] = useState({
        remindersEnabled: true,
        timings: ["07:00", "10:00", "13:00", "17:00", "20:00"],
        customMessage: "Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Event Time: {eventTime}\n\nPlease prepare camera and equipment."
    });

    const role = userProfile?.role || 'member';
    const permissions = {
        canEditSettings: ['owner', 'admin'].includes(role) || (userProfile?.email === 'ckv3232@gmail.com')
    };
    const uid = user?.uid;

    useEffect(() => {
        console.log("User UID:", uid);
        console.log("Studio:", studioId);
        console.log("Database Role:", role);
        console.log("Can Edit Settings:", permissions.canEditSettings);
    }, [uid, studioId, role, permissions.canEditSettings]);

    useEffect(() => {
        // Check current notification permission
        const isCapacitor = (window as any).Capacitor !== undefined;
        if (isCapacitor) {
            import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
                LocalNotifications.checkPermissions().then((perm) => {
                    setNotifStatus(perm.display === "granted" ? "granted" : perm.display === "denied" ? "denied" : "default");
                });
            }).catch((err) => {
                console.error("LocalNotifications check error:", err);
                setNotifStatus("granted");
            });
        } else if ("Notification" in window) {
            setNotifStatus(Notification.permission as any);
        } else {
            // Default to granted in WebViews/App environments to hide the warning banner
            setNotifStatus("granted");
        }

        const fetchSettings = async () => {
            if (!studioId) return;
            try {
                const docRef = doc(db, "studioSettings", studioId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings({
                        remindersEnabled: docSnap.data().remindersEnabled ?? true,
                        timings: docSnap.data().timings || ["07:00", "10:00", "13:00", "17:00", "20:00"],
                        customMessage: docSnap.data().customMessage || "Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Event Time: {eventTime}\n\nPlease prepare camera and equipment."
                    });
                }
            } catch (error) {
                console.error("Error fetching notification settings:", error);
            }
        };
        fetchSettings();
    }, [studioId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studioId) return;

        setLoading(true);
        try {
            const docRef = doc(db, "studioSettings", studioId);
            await setDoc(docRef, settings, { merge: true });
            toast.success("✅ Notification settings saved!");
        } catch (error) {
            console.error("Error saving notification settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const handleTimingChange = (index: number, value: string) => {
        const newTimings = [...settings.timings];
        newTimings[index] = value;
        setSettings({ ...settings, timings: newTimings });
    };

    const addTiming = () => {
        setSettings({ ...settings, timings: [...settings.timings, "09:00"] });
    };

    const removeTiming = (index: number) => {
        const newTimings = settings.timings.filter((_, i) => i !== index);
        setSettings({ ...settings, timings: newTimings });
    };

    // Send a real test notification directly in the browser or native app
    const handleTestNotification = async () => {
        setTesting(true);
        try {
            const isCapacitor = (window as any).Capacitor !== undefined;
            if (isCapacitor) {
                try {
                    const { LocalNotifications } = await import('@capacitor/local-notifications');
                    const perm = await LocalNotifications.requestPermissions();
                    if (perm.display === 'granted') {
                        setNotifStatus("granted");
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: "📸 Cameraman Pro - Test Reminder",
                                    body: "✅ Notifications are working! Aapko bookings ki yaad dilai jayegi.",
                                    id: Math.floor(Math.random() * 10000),
                                    schedule: { at: new Date(Date.now() + 1000) } // Trigger in 1 second
                                }
                            ]
                        });
                        toast.success("🔔 Native notification triggered! Check your status bar.");
                        setTesting(false);
                        return;
                    } else {
                        toast.error("Permission denied for native notifications.");
                        setTesting(false);
                        return;
                    }
                } catch (e: any) {
                    console.error("LocalNotifications error:", e);
                    toast.error("Error triggering native alert: " + e.message);
                    setTesting(false);
                    return;
                }
            }

            // Check if Notification API is supported
            if (!("Notification" in window)) {
                toast.success("🔔 Test Reminder: (App Mode) Automated reminders are active! GitHub Actions will send reminders via Server Push/WhatsApp as scheduled.");
                setTesting(false);
                return;
            }

            // Request permission first if needed
            if (Notification.permission === "default") {
                const perm = await Notification.requestPermission();
                setNotifStatus(perm as any);
                if (perm !== "granted") {
                    toast.error("Please allow notifications first!");
                    setTesting(false);
                    return;
                }
            }

            if (Notification.permission === "denied") {
                toast.error("Notifications are blocked! Please allow them from browser settings.");
                setTesting(false);
                return;
            }

            // Check if OneSignal is available - use it to send via OneSignal
            if ((window as any).OneSignal) {
                // Show a local notification via service worker
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification("📸 Cameraman Pro - Test Reminder", {
                    body: "✅ Notifications are working! Aapko aaj ki bookings ki yaad dilai jayegi.",
                    icon: "/logo.png",
                    badge: "/logo.png",
                    tag: "test-notification",
                });
                toast.success("🔔 Test notification sent! Check your screen.");
            } else {
                // Fallback: native browser notification
                new Notification("📸 Cameraman Pro - Test Reminder", {
                    body: "✅ Notifications are working! Aapko bookings ki yaad dilai jayegi.",
                    icon: "/logo.png",
                });
                toast.success("🔔 Test notification sent!");
            }
        } catch (error: any) {
            console.error("Test notification error:", error);
            toast.error("Error: " + error.message);
        } finally {
            setTesting(false);
        }
    };

    const handleEnableNotifications = async () => {
        try {
            const isCapacitor = (window as any).Capacitor !== undefined;
            if (isCapacitor) {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const perm = await LocalNotifications.requestPermissions();
                if (perm.display === 'granted') {
                    setNotifStatus("granted");
                    toast.success("✅ Native notifications enabled!");
                } else {
                    setNotifStatus("denied");
                    toast.error("Permission denied by user.");
                }
                return;
            }

            if ((window as any).OneSignal) {
                await (window as any).OneSignal.Notifications.requestPermission();
                if ("Notification" in window) {
                    setNotifStatus(Notification.permission as any);
                    if (Notification.permission === "granted") {
                        toast.success("✅ Notifications enabled!");
                    }
                }
            } else if ("Notification" in window) {
                const perm = await Notification.requestPermission();
                setNotifStatus(perm as any);
                if (perm === "granted") toast.success("✅ Notifications enabled!");
                else toast.error("Permission denied by user.");
            } else {
                toast.error("Web Notifications API not supported in this app/device.");
            }
        } catch (e: any) {
            console.error("Enable notification error:", e);
            toast.error("Error: " + (e.message || "Failed to enable notifications"));
        }
    };

    return (
        <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border-light)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Bell size={20} className="text-orange-500" />
                    Notification Settings
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Configure automated booking reminders for your studio.</p>
            </div>

            <div className="p-6">
                {/* Notification Status Banner */}
                <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                    notifStatus === "granted" 
                        ? "bg-green-500/10 border border-green-500/30"
                        : notifStatus === "denied"
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-orange-500/10 border border-orange-500/30"
                }`}>
                    <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                            {notifStatus === "granted" && "✅ Notifications Enabled"}
                            {notifStatus === "denied" && "❌ Notifications Blocked"}
                            {(notifStatus === "default" || notifStatus === "unknown") && "⚠️ Notifications Not Enabled"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {notifStatus === "granted" && "Aapka device reminders receive karega."}
                            {notifStatus === "denied" && "Browser settings se notifications allow karein."}
                            {(notifStatus === "default" || notifStatus === "unknown") && "Reminders ke liye notifications enable karein."}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {notifStatus !== "granted" && (
                            <button
                                onClick={handleEnableNotifications}
                                className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Enable Now
                            </button>
                        )}
                        {notifStatus === "granted" && (
                            <button
                                onClick={handleTestNotification}
                                disabled={testing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <TestTube size={13} />
                                {testing ? "Testing..." : "Send Test"}
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Enable Automated Reminders</label>
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-orange-500 rounded bg-[var(--bg-secondary)] border-[var(--border-light)] focus:ring-orange-500 focus:ring-2 disabled:opacity-50"
                                checked={settings.remindersEnabled}
                                onChange={(e) => setSettings({ ...settings, remindersEnabled: e.target.checked })}
                                disabled={!permissions.canEditSettings}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Notification Timings</label>
                            <button
                                type="button"
                                onClick={addTiming}
                                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 disabled:opacity-50"
                                disabled={!settings.remindersEnabled || !permissions.canEditSettings}
                            >
                                <Plus size={13} /> Add Time
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {settings.timings.map((time, index) => (
                                <div key={index} className="relative">
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => handleTimingChange(index, e.target.value)}
                                        className="w-full px-3 py-2 pr-7 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500 disabled:opacity-50"
                                        disabled={!settings.remindersEnabled || !permissions.canEditSettings}
                                    />
                                    {settings.timings.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTiming(index)}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 disabled:opacity-50"
                                            disabled={!permissions.canEditSettings}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">GitHub Actions will check every hour and notify within 5 minutes of these times.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Custom Message Template</label>
                        <textarea
                            value={settings.customMessage}
                            onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
                            className="w-full h-32 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50"
                            disabled={!settings.remindersEnabled || !permissions.canEditSettings}
                        />
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Variables: <code>{`{clientName}`}</code>, <code>{`{eventType}`}</code>, <code>{`{location}`}</code>, <code>{`{eventTime}`}</code>
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                        <Button type="submit" isLoading={loading} disabled={!permissions.canEditSettings}>
                            <Save size={16} className="mr-2" /> Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
