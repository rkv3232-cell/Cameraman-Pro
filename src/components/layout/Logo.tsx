import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    size?: "sm" | "md" | "lg";
}

export const Logo = ({ className = "", iconOnly = false, size = "md" }: LogoProps) => {
    const sizes = {
        sm: { icon: 20, text: "text-base", height: "h-8" },
        md: { icon: 24, text: "text-lg", height: "h-10" },
        lg: { icon: 32, text: "text-2xl", height: "h-12" }
    };

    const currentSize = sizes[size];

    return (
        <Link
            to="/dashboard"
            className={`flex items-center gap-3 group transition-transform active:scale-95 ${className}`}
        >
            <div className={`relative flex items-center justify-center ${currentSize.height} aspect-square`}>
                <img
                    src="/logo.png"
                    alt="Cameraman Pro Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        // Fallback to Lucide icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }}
                />
                <div className="fallback-icon hidden bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] p-1.5 rounded-lg shadow-glow">
                    <Camera size={currentSize.icon} className="text-white" />
                </div>
            </div>
            {!iconOnly && (
                <span className={`font-bold gradient-text ${currentSize.text} tracking-tight`}>
                    Cameraman Pro
                </span>
            )}
        </Link>
    );
};
