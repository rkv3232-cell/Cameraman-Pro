import { useState, FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "../components/layout/Logo";
import { Loader2, Mail, Lock, User, Eye, EyeOff, Chrome, ArrowRight, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

type AuthTab = "login" | "register" | "forgot";

export const Login = () => {
    const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, user, loading, isOwner, isClient } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState<AuthTab>("login");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [displayName, setDisplayName] = useState("");

    if (user && !loading) {
        if (isOwner) return <Navigate to="/dashboard" replace />;
        return <Navigate to="/client/dashboard" replace />;
    }

    const handleGoogleLogin = async () => {
        try {
            setIsSubmitting(true);
            await loginWithGoogle();
            toast.success("Welcome! 🎉");
        } catch {
            toast.error("Google login failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmailLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        try {
            setIsSubmitting(true);
            await loginWithEmail(email, password);
            toast.success("Welcome back!");
        } catch (err: any) {
            toast.error("Invalid email or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password || !displayName) return;
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }
        try {
            setIsSubmitting(true);
            await registerWithEmail(email, password, displayName);
            toast.success("Account created successfully!");
        } catch (err: any) {
            toast.error("Registration failed. Email might already be in use.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return;
        try {
            setIsSubmitting(true);
            await resetPassword(email);
            toast.success("Password reset email sent!");
            setTab("login");
        } catch (err: any) {
            toast.error("Failed to send reset email.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10 font-sans">
                <div className="flex flex-col items-center mb-8 animate-fade-in">
                    <Logo size="lg" className="mb-3" />
                    <p className="text-slate-400 text-sm">One Login for Studio & Clients</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
                    {tab !== "forgot" && (
                        <div className="flex bg-slate-800/60 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => setTab("login")}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tab === "login"
                                    ? "bg-orange-500 text-white"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => setTab("register")}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${tab === "register"
                                    ? "bg-orange-500 text-white"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                Register
                            </button>
                        </div>
                    )}

                    {tab === "login" && (
                        <div className="space-y-4">
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@email.com"
                                            required
                                            className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-10 text-sm focus:border-orange-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setTab("forgot")} className="text-xs text-orange-400 hover:underline">
                                        Forgot password?
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Sign In</>}
                                </button>
                            </form>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500 font-medium">OR</span></div>
                            </div>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-xl transition shadow-md"
                            >
                                <Chrome className="h-4 w-4 text-[#4285F4]" />
                                Continue with Google
                            </button>
                        </div>
                    )}

                    {tab === "register" && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@email.com"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        required
                                        minLength={6}
                                        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat password"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Create Account</>}
                            </button>
                        </form>
                    )}

                    {tab === "forgot" && (
                        <div className="space-y-4">
                            <button onClick={() => setTab("login")} className="text-slate-400 hover:text-white text-sm flex items-center gap-2">
                                ← Back to Login
                            </button>
                            <h2 className="text-white font-semibold text-xl">Reset Password</h2>
                            <p className="text-slate-400 text-sm">Enter your email and we'll send you a link.</p>
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@email.com"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl py-2.5 px-4 text-sm focus:border-orange-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4" /> Send Link</>}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
