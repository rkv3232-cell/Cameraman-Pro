import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { voiceService } from '../../lib/voiceService';

interface VoiceIndicatorProps {
    className?: string;
}

export default function VoiceIndicator({ className = '' }: VoiceIndicatorProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isActivated, setIsActivated] = useState(voiceService.isActivated());

    useEffect(() => {
        // Poll for speaking status
        const interval = setInterval(() => {
            setIsSpeaking(voiceService.isSpeaking());
            setIsActivated(voiceService.isActivated());
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleToggle = () => {
        if (voiceService.isSpeaking()) {
            voiceService.stop();
        }
    };

    if (!isActivated) {
        return (
            <div className={`flex items-center gap-2 text-gray-400 text-sm ${className}`}>
                <VolumeX className="w-4 h-4" />
                <span>Voice Off</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-2 text-sm transition-colors ${isSpeaking
                    ? 'text-purple-600 hover:text-purple-700'
                    : 'text-green-600 hover:text-green-700'
                } ${className}`}
            title={isSpeaking ? 'Click to stop speaking' : 'Voice is active'}
        >
            {isSpeaking ? (
                <>
                    <div className="relative">
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-sm opacity-50 animate-ping"></div>
                    </div>
                    <span className="font-medium">Speaking...</span>
                </>
            ) : (
                <>
                    <Volume2 className="w-4 h-4" />
                    <span>Voice On</span>
                </>
            )}
        </button>
    );
}
