import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

// Extremely simplified version since Radix UI might not be installed
const Select = ({ children }: any) => {
    return <div className="space-y-1">{children}</div>
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(
    ({ className, children, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, children }: any) => {
    return <span>{children || placeholder}</span>
}

const SelectContent = ({ children }: any) => {
    return <div className="mt-1 rounded-md border border-[var(--border-light)] bg-[var(--surface-base)] shadow-md p-1">{children}</div>
}

const SelectItem = React.forwardRef<HTMLDivElement, any>(
    ({ className, children, value, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-[var(--surface-hover)] focus:bg-[var(--surface-hover)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
)
SelectItem.displayName = "SelectItem"

export {
    Select,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem,
}
