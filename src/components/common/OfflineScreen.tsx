import React, { useState } from 'react';
import { ConnectivityStatus } from '../../services/connectivityService';

interface OfflineScreenProps {
  status?: ConnectivityStatus;
  statusMessage?: string;
  hintText?: string;
  onRetry?: (force?: boolean) => Promise<boolean>;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  status = 'offline',
  statusMessage = 'Internet connection unavailable',
  hintText = 'Your clinic information is protected. Reconnect to the internet and try again.',
  onRetry
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const isChecking = isRetrying || status === 'checking';
  const isBackendIssue = status === 'backend_unavailable';

  const handleRetryClick = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setLocalFeedback('Checking connection…');

    try {
      if (onRetry) {
        const ok = await onRetry(true);
        if (!ok) {
          setTimeout(() => {
            setIsRetrying(false);
            setLocalFeedback(null);
          }, 600);
        }
      } else {
        // Fallback probe
        const probeRes = await fetch('./manifest.json?_t=' + Date.now(), {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (probeRes.ok) {
          window.location.reload();
        } else {
          setIsRetrying(false);
          setLocalFeedback(null);
        }
      }
    } catch {
      setTimeout(() => {
        setIsRetrying(false);
        setLocalFeedback(null);
      }, 700);
    }
  };

  // Determine active status text and pill styling
  let displayStatus = localFeedback || statusMessage;
  if (!displayStatus) {
    displayStatus = isChecking 
      ? 'Checking connection…' 
      : isBackendIssue 
        ? 'Backend temporarily unreachable' 
        : 'Internet connection unavailable';
  }

  let statusContainerClass = 'inline-flex items-center gap-2 my-6 px-3.5 py-2 rounded-full text-xs font-bold transition-all';
  let dotClass = 'w-2 h-2 rounded-full shrink-0 transition-all';

  if (isChecking) {
    statusContainerClass += ' bg-[#e8f4f2] text-[#167d78]';
    dotClass += ' bg-[#167d78] animate-pulse';
  } else if (isBackendIssue) {
    statusContainerClass += ' bg-[#fef2f2] text-[#991b1b]';
    dotClass += ' bg-[#ef4444]';
  } else {
    statusContainerClass += ' bg-[#fff5e8] text-[#93601d]';
    dotClass += ' bg-[#e5a33d]';
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none"
      style={{
        background: `
          radial-gradient(circle at 12% 12%, rgba(22,125,120,.09), transparent 30%),
          radial-gradient(circle at 90% 85%, rgba(22,125,120,.07), transparent 28%),
          #f3f8f7
        `,
        color: '#173b3b',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        paddingTop: 'max(24px, env(safe-area-inset-top, 24px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
      role="alert"
      aria-live="assertive"
    >
      <main className="w-full max-w-[520px] text-center">
        
        {/* Brand Header */}
        <div className="inline-flex items-center gap-2.5 mb-6 font-bold text-[17px] tracking-[-0.02em]" style={{ color: '#173b3b' }}>
          <span 
            className="w-[38px] h-[38px] rounded-[13px] grid place-items-center text-white shrink-0"
            style={{
              background: 'linear-gradient(145deg, #23958e, #11645f)',
              boxShadow: '0 7px 18px rgba(22,125,120,.2)'
            }}
            aria-hidden="true"
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
          <span>Anujay Dental Clinic</span>
        </div>

        {/* Offline Card */}
        <section 
          className="rounded-[26px] p-8 sm:p-[42px_34px_34px] relative"
          style={{
            background: 'rgba(255,255,255,.94)',
            border: '1px solid #e1ece9',
            boxShadow: '0 20px 60px rgba(25,65,61,.08)'
          }}
        >
          {/* Circular Illustration */}
          <div 
            className="w-[126px] h-[126px] sm:w-[142px] sm:h-[142px] mx-auto mb-6 rounded-full grid place-items-center relative"
            style={{ background: '#eaf5f2' }}
            aria-hidden="true"
          >
            <svg width="86" height="86" viewBox="0 0 100 100" fill="none">
              <path d="M17 39c18-17 48-17 66 0" stroke="#167d78" strokeWidth="6" strokeLinecap="round"/>
              <path d="M28 51c12-11 32-11 44 0" stroke="#167d78" strokeWidth="6" strokeLinecap="round"/>
              <path d="M40 63c6-5 14-5 20 0" stroke="#167d78" strokeWidth="6" strokeLinecap="round"/>
              <circle cx="50" cy="76" r="4.5" fill="#167d78"/>
              <path d="M19 18l62 64" stroke="#e09b43" strokeWidth="7" strokeLinecap="round"/>
            </svg>
            {/* Accent floating dot from reference */}
            <span 
              className="absolute w-[13px] h-[13px] rounded-full pointer-events-none"
              style={{
                background: '#f1bd65',
                right: '9px',
                top: '19px',
                boxShadow: '-112px 65px 0 -3px #8dc9bf'
              }}
            />
          </div>

          {/* Heading */}
          <h1 
            id="offline-title"
            className="m-0 mb-3 text-[27px] sm:text-[34px] font-extrabold tracking-[-0.045em] leading-tight"
            style={{ color: '#173b3b' }}
          >
            You're Offline
          </h1>

          {/* Message */}
          <p 
            className="max-w-[370px] mx-auto text-[15px] leading-[1.7] m-0"
            style={{ color: '#607575' }}
          >
            {isBackendIssue 
              ? "Internet connection detected, but the clinic server is temporarily unreachable. Please retry shortly."
              : "No internet connection detected. Please check your connection to continue using Anujay Dental Clinic."}
          </p>

          {/* Status Badge */}
          <div className={statusContainerClass} role="status" aria-live="polite">
            <span className={dotClass} />
            <span>{displayStatus}</span>
          </div>

          {/* Try Again Button */}
          <div>
            <button
              id="retry-button"
              type="button"
              disabled={isChecking}
              onClick={handleRetryClick}
              className="w-full max-w-[240px] min-h-[48px] rounded-[13px] px-5 py-3 text-white text-[14px] font-bold cursor-pointer transition-all disabled:opacity-70 disabled:cursor-wait active:scale-[0.98]"
              style={{
                background: '#167d78',
                boxShadow: '0 8px 18px rgba(22,125,120,.2)'
              }}
            >
              {isChecking ? 'Checking…' : 'Try Again'}
            </button>
          </div>

          {/* Hint */}
          <p className="mt-[18px] mb-0 text-[12px] leading-[1.6]" style={{ color: '#829391' }}>
            {hintText}
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-[22px] text-[11px]" style={{ color: '#8a9b99' }}>
          © Anujay Dental Clinic
        </footer>
      </main>
    </div>
  );
};
