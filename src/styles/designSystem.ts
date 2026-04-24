/**
 * Design System - Cameraman Pro
 * Premium Mobile-First UI with Dark/Light Mode
 */

export const designTokens = {
    // Color Palette
    colors: {
        // Dark Mode
        dark: {
            background: {
                primary: '#0A0E27',      // Deep navy
                secondary: '#131828',    // Slightly lighter
                tertiary: '#1A1F3A',     // Card background
                elevated: '#222847',     // Elevated cards
            },
            surface: {
                base: '#1A1F3A',
                hover: '#222847',
                active: '#2A2F4A',
            },
            text: {
                primary: '#F8FAFC',      // Near white
                secondary: '#94A3B8',    // Soft gray
                tertiary: '#64748B',     // Muted
                disabled: '#475569',
            },
            accent: {
                primary: '#8B5CF6',      // Violet
                secondary: '#6366F1',    // Indigo
                tertiary: '#3B82F6',     // Blue
                gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            },
            border: {
                subtle: 'rgba(148, 163, 184, 0.1)',
                light: 'rgba(148, 163, 184, 0.2)',
                medium: 'rgba(148, 163, 184, 0.3)',
            },
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
        },

        // Light Mode
        light: {
            background: {
                primary: '#F8FAFC',      // Off-white
                secondary: '#F1F5F9',    // Very light gray
                tertiary: '#FFFFFF',     // Pure white
                elevated: '#FFFFFF',     // White cards
            },
            surface: {
                base: '#FFFFFF',
                hover: '#F8FAFC',
                active: '#F1F5F9',
            },
            text: {
                primary: '#0F172A',      // Dark charcoal
                secondary: '#475569',    // Medium gray
                tertiary: '#64748B',     // Light gray
                disabled: '#94A3B8',
            },
            accent: {
                primary: '#8B5CF6',      // Violet
                secondary: '#6366F1',    // Indigo
                tertiary: '#3B82F6',     // Blue
                gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            },
            border: {
                subtle: 'rgba(15, 23, 42, 0.06)',
                light: 'rgba(15, 23, 42, 0.1)',
                medium: 'rgba(15, 23, 42, 0.2)',
            },
            success: '#059669',
            warning: '#D97706',
            error: '#DC2626',
            info: '#2563EB',
        },
    },

    // Typography
    typography: {
        fontFamily: {
            sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
        fontSize: {
            xs: '0.75rem',     // 12px
            sm: '0.875rem',    // 14px
            base: '1rem',      // 16px
            lg: '1.125rem',    // 18px
            xl: '1.25rem',     // 20px
            '2xl': '1.5rem',   // 24px
            '3xl': '1.875rem', // 30px
            '4xl': '2.25rem',  // 36px
            '5xl': '3rem',     // 48px
        },
        fontWeight: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
        lineHeight: {
            tight: '1.2',
            normal: '1.5',
            relaxed: '1.75',
        },
    },

    // Spacing
    spacing: {
        xs: '0.25rem',   // 4px
        sm: '0.5rem',    // 8px
        md: '1rem',      // 16px
        lg: '1.5rem',    // 24px
        xl: '2rem',      // 32px
        '2xl': '3rem',   // 48px
        '3xl': '4rem',   // 64px
    },

    // Border Radius
    borderRadius: {
        sm: '0.5rem',    // 8px
        md: '0.75rem',   // 12px
        lg: '1rem',      // 16px
        xl: '1.5rem',    // 24px
        '2xl': '2rem',   // 32px
        full: '9999px',
    },

    // Shadows
    shadows: {
        dark: {
            sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
            md: '0 4px 16px rgba(0, 0, 0, 0.4)',
            lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
            xl: '0 12px 32px rgba(0, 0, 0, 0.6)',
            glow: '0 0 24px rgba(139, 92, 246, 0.3)',
            glowHover: '0 0 32px rgba(139, 92, 246, 0.5)',
        },
        light: {
            sm: '0 2px 8px rgba(15, 23, 42, 0.08)',
            md: '0 4px 16px rgba(15, 23, 42, 0.12)',
            lg: '0 8px 24px rgba(15, 23, 42, 0.16)',
            xl: '0 12px 32px rgba(15, 23, 42, 0.2)',
            glow: '0 0 24px rgba(139, 92, 246, 0.2)',
            glowHover: '0 0 32px rgba(139, 92, 246, 0.3)',
        },
    },

    // Transitions
    transitions: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
        smooth: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Z-Index
    zIndex: {
        base: 0,
        dropdown: 1000,
        sticky: 1100,
        fixed: 1200,
        modal: 1300,
        popover: 1400,
        tooltip: 1500,
    },
};

// Breakpoints
export const breakpoints = {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

// Component Variants
export const componentVariants = {
    button: {
        primary: {
            dark: {
                bg: designTokens.colors.dark.accent.gradient,
                text: designTokens.colors.dark.text.primary,
                shadow: designTokens.shadows.dark.glow,
                hoverShadow: designTokens.shadows.dark.glowHover,
            },
            light: {
                bg: designTokens.colors.light.accent.gradient,
                text: designTokens.colors.light.background.primary,
                shadow: designTokens.shadows.light.glow,
                hoverShadow: designTokens.shadows.light.glowHover,
            },
        },
        secondary: {
            dark: {
                bg: designTokens.colors.dark.surface.base,
                text: designTokens.colors.dark.text.primary,
                border: designTokens.colors.dark.border.light,
            },
            light: {
                bg: designTokens.colors.light.surface.base,
                text: designTokens.colors.light.text.primary,
                border: designTokens.colors.light.border.light,
            },
        },
    },
    card: {
        dark: {
            bg: designTokens.colors.dark.background.tertiary,
            border: designTokens.colors.dark.border.subtle,
            shadow: designTokens.shadows.dark.md,
        },
        light: {
            bg: designTokens.colors.light.background.tertiary,
            border: designTokens.colors.light.border.subtle,
            shadow: designTokens.shadows.light.md,
        },
    },
};

export type Theme = 'dark' | 'light';
