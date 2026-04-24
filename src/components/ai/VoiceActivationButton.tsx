import { useState } from 'react';
import { Volume2, MicOff } from 'lucide-react';
import { voiceService } from '../../lib/voiceService';

interface VoiceActivationButtonProps {
    onActivated: () => void;
}

// Possible states for the activation flow
type ActivationState = 'idle' | 'activating' | 'activated' | 'denied';

export default function VoiceActivationButton({ onActivated }: VoiceActivationButtonProps) {
    const [state, setState] = useState<ActivationState>(
        voiceService.isActivated() ? 'activated' : 'idle'
    );

    const handleActivate = async () => {
        setState('activating');

        try {
            await voiceService.activate();
            console.log('🎤 [VoiceButton] activate() completed');
            setState('activated');
            onActivated();
        } catch (error) {
            console.error('🎤 [VoiceButton] Unexpected error:', error);
            // Never show denied banner — activate handles errors internally
            setState('activated');
            onActivated();
        }
    };

    // Already activated — no button needed
    if (state === 'activated') return null;

    // Microphone permission was denied on Android
    if (state === 'denied') {
        return (
            <div className="fixed bottom-40 right-6 z-50">
                <div className="flex items-center gap-3 px-5 py-4 bg-red-900/80 border border-red-600 text-white rounded-2xl shadow-2xl backdrop-blur-sm">
                    <MicOff className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                        <div className="font-semibold text-sm">Microphone Access Denied</div>
                        <div className="text-xs text-red-300 mt-0.5">
                            Please allow microphone in your device settings, then reload.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-40 right-6 z-50 animate-bounce">
            <button
                onClick={handleActivate}
                disabled={state === 'activating'}
                className="group relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Activate BĀBU Voice"
            >
                {/* Pulsing glow effect */}
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />

                {/* Icon */}
                <div className="relative">
                    {state === 'activating' ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Volume2 className="w-6 h-6" />
                    )}
                </div>

                {/* Text */}
                <div className="relative">
                    <div className="font-bold text-lg">
                        {state === 'activating' ? 'Activating...' : 'Activate BĀBU'}
                    </div>
                    <div className="text-xs text-purple-100">
                        {state === 'activating' ? 'Allow microphone access' : 'Enable voice assistant'}
                    </div>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </button>

            {/* Helper tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Click to enable voice features
                <div className="absolute top-full right-8 w-0 h-0 border-8 border-transparent border-t-gray-900" />
            </div>
        </div>
    );
}
