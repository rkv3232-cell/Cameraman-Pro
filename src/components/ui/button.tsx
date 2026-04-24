import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size, isLoading, children, disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-[var(--accent-primary)] text-white hover:opacity-90 ring-offset-2 focus:ring-[var(--accent-primary)] shadow-md hover:shadow-lg hover:-translate-y-0.5",
            secondary: "bg-[var(--surface-base)] text-[var(--text-primary)] border border-[var(--border-light)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-medium)] focus:ring-[var(--text-tertiary)] shadow-sm",
            danger: "bg-[var(--error)] text-white hover:opacity-90 focus:ring-[var(--error)] shadow-md",
            ghost: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]",
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
