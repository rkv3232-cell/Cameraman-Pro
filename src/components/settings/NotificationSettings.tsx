import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import { Bell, Save } from "lucide-react";

export const NotificationSettings = ({ studioId }: { studioId: string | null }) => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        remindersEnabled: true,
        timings: ["07:00", "10:00", "13:00", "17:00", "20:00"],
        customMessage: "Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Event Time: {eventTime}\n\nPlease prepare camera and equipment."
    });

    useEffect(() => {
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
            toast.success("Notification settings saved successfully");
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
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Enable Automated Reminders</label>
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-orange-500 rounded bg-[var(--bg-secondary)] border-[var(--border-light)] focus:ring-orange-500 focus:ring-2"
                                checked={settings.remindersEnabled}
                                onChange={(e) => setSettings({ ...settings, remindersEnabled: e.target.checked })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Notification Timings (24-Hour Format, HH:00)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {settings.timings.map((time, index) => (
                                <input
                                    key={index}
                                    type="time"
                                    step="3600"
                                    value={time}
                                    onChange={(e) => handleTimingChange(index, e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500"
                                    disabled={!settings.remindersEnabled}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">Notifications will be sent precisely at these top-of-hour times.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Custom Message Template</label>
                        <textarea
                            value={settings.customMessage}
                            onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
                            className="w-full h-32 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-orange-500 resize-none"
                            disabled={!settings.remindersEnabled}
                        />
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Variables: <code>{`{clientName}`}</code>, <code>{`{eventType}`}</code>, <code>{`{location}`}</code>, <code>{`{eventTime}`}</code>
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                        <Button type="submit" isLoading={loading} disabled={!settings.remindersEnabled && settings.remindersEnabled === false}>
                            <Save size={16} className="mr-2" /> Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
