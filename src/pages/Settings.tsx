import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";
import { User, LogOut, Save, Copy, Users } from "lucide-react";
import { NotificationSettings } from "../components/settings/NotificationSettings";

export const Settings = () => {
    const { userProfile, studioId, logout, user, joinTeam } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Join Team State
    const [joinCode, setJoinCode] = useState("");
    const [joiningTeam, setJoiningTeam] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        studioName: ""
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || "",
                phone: "", // Phone might not be in userProfile yet
                studioName: "My Studio" // Placeholder
            });
        }
    }, [userProfile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !studioId) return;

        setLoading(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                name: formData.name
            });

            toast.success("Profile updated successfully");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!joinCode || joinCode.length !== 6) {
            toast.error("Please enter a valid 6-character code");
            return;
        }

        setJoiningTeam(true);
        try {
            await joinTeam(joinCode);
            toast.success(`Successfully joined team! Refreshing data...`);
            setJoinCode("");
            // Data will automatically refresh via AuthContext state change
        } catch (error: any) {
            toast.error(error.message || "Failed to join team");
        } finally {
            setJoiningTeam(false);
        }
    };

    const handleCopyCode = () => {
        if (studioId) {
            navigator.clipboard.writeText(studioId);
            toast.success("Studio code copied to clipboard!");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>

            {/* Profile Section */}
            <div className="bg-[var(--surface-base)] rounded-[24px] border border-[var(--border-light)] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--border-light)] flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <User size={20} className="text-[var(--accent-primary)]" />
                        Profile & Studio
                    </h2>
                    {!isEditing && (
                        <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                </div>

                <div className="p-6">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Full Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                            />
                            <Input
                                label="Phone Number"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
                            <div className="w-full h-10 px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-disabled)] text-sm flex items-center">
                                {userProfile?.email}
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)]">Email cannot be changed.</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Studio ID</label>
                            <div className="w-full h-10 px-3 py-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm font-mono flex items-center">
                                {studioId}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit" isLoading={loading}>
                                    <Save size={16} className="mr-2" /> Save Changes
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Notification Settings Section */}
            <NotificationSettings studioId={studioId} />

            {/* Team Collaboration Section */}
            <div className="bg-[var(--surface-base)] rounded-[24px] border border-[var(--border-light)] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--border-light)]">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        Team Collaboration
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Share your studio code to invite team members</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* My Studio Code */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">My Studio Code</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gradient-to-r from-blue-500/10 to-orange-500/10 rounded-[18px] border-2 border-dashed border-blue-500/30 p-6 bg-[var(--bg-secondary)]">
                                <div className="text-center">
                                    <p className="text-xs text-[var(--text-tertiary)] mb-2">Share this code with your team</p>
                                    <p className="text-4xl font-bold tracking-widest text-[var(--text-primary)] font-mono selection:bg-blue-100">
                                        {studioId || "XXXXXX"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleCopyCode}
                                className="h-[72px]"
                            >
                                <Copy size={20} />
                            </Button>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Team members can use this code to access your studio's bookings and equipment
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[var(--border-light)]"></div>

                    {/* Join Team */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Join Another Team</label>
                        <div className="space-y-3">
                            <Input
                                placeholder="Enter 6-character studio code"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="uppercase font-mono text-lg tracking-wider text-center"
                            />
                            <Button
                                onClick={handleJoinTeam}
                                isLoading={joiningTeam}
                                className="w-full"
                            >
                                Join Team
                            </Button>
                            <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 rounded-lg">
                                <p className="text-xs text-amber-700 dark:text-yellow-200/80">
                                    ⚠️ Joining a team will switch your view to their studio's data. Your current studio will remain intact.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign Out Section */}
            <div className="bg-red-50 dark:bg-red-500/10 rounded-[18px] border border-red-200 dark:border-red-500/20 p-6 flex justify-between items-center">
                <div>
                    <h3 className="text-red-700 dark:text-red-400 font-medium">Sign Out</h3>
                    <p className="text-sm text-red-600/80 dark:text-red-400/60">End your current session safely.</p>
                </div>
                <Button variant="danger" onClick={() => logout()}>
                    <LogOut size={16} className="mr-2" /> Sign Out
                </Button>
            </div>
        </div>
    );
};

