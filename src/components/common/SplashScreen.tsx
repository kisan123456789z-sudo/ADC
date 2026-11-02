import React, { useEffect, useState } from 'react';
import ajLogoAsset from '../../assets/aj-logo.png';
import { AJ_LOGO_DATA_URL } from '../../assets/ajLogoData';

interface SplashScreenProps {
  isLoading?: boolean;
  minDurationMs?: number;
  onFinished?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading = false,
  minDurationMs = 2400,
  onFinished
}) => {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [progress, setProgress] = useState(8);
  const [statusMessage, setStatusMessage] = useState('Initializing clinic systems...');
  // Initialize with exact base64 data URL for 0ms network latency, falling back to bundled asset URL
  const [logoSrc, setLogoSrc] = useState<string>(AJ_LOGO_DATA_URL || ajLogoAsset);

  // Smooth continuous filling animation across minDurationMs
  useEffect(() => {
    const startTime = Date.now();
    const duration = minDurationMs;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(94, Math.round((elapsed / duration) * 94));
      
      setProgress((prev) => (pct > prev ? pct : prev));

      if (pct > 72) {
        setStatusMessage('Preparing clinic experience...');
      } else if (pct > 35) {
        setStatusMessage('Loading services & dental records...');
      } else {
        setStatusMessage('Initializing clinic systems...');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setMinTimeElapsed(true);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [minDurationMs]);

  useEffect(() => {
    // When both minimum display duration and data loading are done
    if (minTimeElapsed && !isLoading && !isExiting && !isDismissed) {
      setProgress(100);
      setStatusMessage('Welcome to AnuJay Dental');
      
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 350);

      const unmountTimer = setTimeout(() => {
        setIsDismissed(true);
        if (onFinished) onFinished();
      }, 950);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [minTimeElapsed, isLoading, isExiting, isDismissed, onFinished]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-out select-none ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 36%, #002d72 0%, #001a45 50%, #000f28 100%)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Ambient background glow rings */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, #38bdf8 0%, #0284c7 60%, transparent 80%)',
          animationDuration: '3.5s',
        }}
      />
      
      <div 
        className="absolute w-72 h-72 rounded-full border border-sky-400/10 pointer-events-none animate-ping"
        style={{ animationDuration: '4.5s' }}
      />

      {/* Main Brand Card / Container */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 max-w-sm w-full text-center">
        {/* Animated AJ Dental Tooth Logo Container */}
        <div className="relative mb-5 animate-[logoEntrance_0.9s_cubic-bezier(0.16,1,0.3,1)_both]">
          {/* Subtle outer rotating halo */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-sky-400/20 via-blue-500/15 to-teal-400/20 blur-lg opacity-80 animate-pulse" />

          {/* Logo Frame: Centered, maintaining original proportions and dark theme */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#00173d]/90 border border-sky-300/30 shadow-[0_16px_40px_rgba(0,18,51,0.8),0_0_30px_rgba(56,189,248,0.25)] flex items-center justify-center p-2.5 overflow-hidden backdrop-blur-md">
            {/* Shimmer sweep effect across logo */}
            <div 
              className="absolute inset-0 -translate-x-full animate-[shimmerSweep_2.6s_infinite_ease-in-out] pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                transform: 'skewX(-20deg)',
              }}
            />

            {/* Official AJ Tooth Logo Asset */}
            <img
              src={logoSrc}
              alt="AnuJay Dental AJ Logo"
              loading="eager"
              decoding="sync"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(56,189,248,0.45)] select-none pointer-events-none"
              onError={() => {
                if (logoSrc !== AJ_LOGO_DATA_URL) {
                  setLogoSrc(AJ_LOGO_DATA_URL);
                } else if (logoSrc !== ajLogoAsset) {
                  setLogoSrc(ajLogoAsset);
                } else {
                  setLogoSrc('/assets/aj-logo.png');
                }
              }}
            />

            {/* Sparkle Glint Star */}
            <div className="absolute top-2 right-2 w-3.5 h-3.5 text-sky-300 animate-[spinSlow_4s_linear_infinite]">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Clinic Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 drop-shadow-md flex items-center justify-center gap-1.5 animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
          <span>AnuJay</span>
          <span className="text-sky-300 font-semibold">Dental</span>
          <span className="text-white">Clinic</span>
        </h1>

        {/* Required Tagline - Exact text: UNIQUE BY NATURE, UNBEATABLE IN CARE. */}
        <div className="animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.4s_both] px-2 mb-6">
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.14em] text-sky-200/95 uppercase drop-shadow-sm leading-relaxed">
            UNIQUE BY NATURE, UNBEATABLE IN CARE.
          </p>
        </div>

        {/* Highly Visible Mobile-Optimized Loading Line Container */}
        <div className="w-64 sm:w-72 max-w-[85vw] mb-3 animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.5s_both]">
          {/* Status Label & Percentage Indicator */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-sky-200/80 mb-2 px-1">
            <span className="truncate">{statusMessage}</span>
            <span className="font-bold tabular-nums text-sky-300 ml-2 drop-shadow-sm">{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar Track (Visible 8px height on mobile, distinct glowing border) */}
          <div className="relative w-full h-2.5 sm:h-3 bg-[#001333]/95 border border-sky-400/40 rounded-full overflow-hidden p-[2px] shadow-[0_0_15px_rgba(56,189,248,0.3),inset_0_1px_3px_rgba(0,0,0,0.7)]">
            {/* Smooth Filling Line */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-white transition-all duration-150 ease-out shadow-[0_0_12px_rgba(56,189,248,0.85)]"
              style={{ width: `${Math.max(6, progress)}%` }}
            >
              {/* Internal high-frequency shimmer wave */}
              <div 
                className="absolute inset-0 animate-[fillShimmer_1.6s_infinite_linear] rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                }}
              />
              {/* Glowing lead tip on the filling head */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#38bdf8,0_0_3px_#ffffff]" />
            </div>
          </div>
        </div>

        {/* Live Loading Pulse Dots */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-sky-200/60 font-medium tracking-wide min-h-[18px]">
          <span>Syncing portal data</span>
          <span className="flex space-x-1">
            <span className="w-1 h-1 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-sky-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>

      {/* Subtle Bottom Trust Badges */}
      <div className="absolute bottom-6 sm:bottom-8 text-center px-4">
        <p className="text-[10px] sm:text-[11px] text-sky-200/50 font-medium tracking-widest uppercase">
          Safe &bull; Hygienic &bull; Certified Dental Specialist
        </p>
      </div>

      <style>{`
        @keyframes logoEntrance {
          0% { opacity: 0; transform: scale(0.75) translateY(12px); }
          60% { transform: scale(1.04) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          50%, 100% { transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes fillShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg) scale(0.9); opacity: 0.7; }
          50% { transform: rotate(180deg) scale(1.15); opacity: 1; }
          100% { transform: rotate(360deg) scale(0.9); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

