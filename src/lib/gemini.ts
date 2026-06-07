/// <reference types="vite/client" />

export interface BabuResponse {
    text: string;
    metadata?: {
        intent?: string;
        confidence?: number;
        entities?: string[];
        actions_available?: string[];
        requires_confirmation?: boolean;
    };
    ui_components?: {
        type: 'button' | 'link' | 'select' | 'input';
        label: string;
        action?: string;
        style?: 'primary' | 'secondary' | 'danger';
    }[];
}

// Legacy or unused function removed to resolve TS6133.

