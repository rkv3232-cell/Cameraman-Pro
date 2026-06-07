export const LoadingSpinner = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        
        {/* Animated Lens/Shutter Element */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            {/* Outer spinning dashed ring */}
            <div className="absolute inset-0 border-t-2 border-r-2 border-purple-500/40 rounded-full animate-[spin_3s_linear_infinite]"></div>
            
            {/* Middle counter-spinning ring */}
            <div className="absolute inset-3 border-b-2 border-l-2 border-indigo-500/60 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
            
            {/* Inner pulsing gradient ring */}
            <div className="absolute inset-6 border-4 border-transparent border-t-indigo-400 border-l-purple-400 rounded-full animate-[spin_1.5s_cubic-bezier(0.5,0,0.5,1)_infinite]"></div>
            
            {/* Center glowing core */}
            <div className="w-6 h-6 bg-purple-400 rounded-full shadow-[0_0_25px_rgba(168,85,247,1)] animate-pulse"></div>
        </div>

        {/* Branding Typography */}
        <div className="flex flex-col items-center z-10">
            <h2 className="text-2xl font-black tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-[length:200%_auto] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
                Cameraman
            </h2>
            <p className="text-xs text-purple-300/60 tracking-[0.5em] mt-2 uppercase font-semibold">
                Pro Studio
            </p>
        </div>
    </div>
);
