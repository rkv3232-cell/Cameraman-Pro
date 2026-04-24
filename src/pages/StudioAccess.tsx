import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const StudioAccess = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const hasAccess = sessionStorage.getItem("studio_access") === "true";
        if (hasAccess) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        const envPassword = import.meta.env.VITE_STUDIO_PASSWORD ?? "";
        const trimmed = password.trim();

        if (!envPassword) {
            setError("Studio password is not configured. Contact the team.");
            return;
        }

        if (trimmed === envPassword) {
            sessionStorage.setItem("studio_access", "true");
            navigate("/login");
            return;
        }

        setError("Invalid password. Please try again.");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-900"
            >
                <div className="space-y-1 text-center">
                    <h1 className="text-3xl font-semibold text-white">Studio Access Required</h1>
                    <p className="text-sm text-slate-400">Enter the studio password to continue.</p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300" htmlFor="studio-password">
                        Enter Studio Password
                    </label>
                    <input
                        id="studio-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                    type="submit"
                    className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-600"
                >
                    Continue
                </button>
            </form>
        </div>
    );
};
