import React, { useEffect, useState } from 'react';
import { MessageSquare, Zap, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { smsOtpDispatcher, SmsOtpMessage } from '../../services/smsOtpNotification';

export const SmsOtpBanner: React.FC = () => {
  const [activeMessage, setActiveMessage] = useState<SmsOtpMessage | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    const unsubscribe = smsOtpDispatcher.subscribeSms((msg) => {
      setActiveMessage(msg);
      setCopied(false);
      setAutoFilled(false);
    });
    return unsubscribe;
  }, []);

  if (!activeMessage) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeMessage.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleAutoFill = () => {
    smsOtpDispatcher.triggerAutoFill(activeMessage.code);
    setAutoFilled(true);
    setTimeout(() => {
      setAutoFilled(false);
      smsOtpDispatcher.dismissSms();
    }, 1200);
  };

  const handleDismiss = () => {
    smsOtpDispatcher.dismissSms();
  };

  // Masked phone display (e.g. +91 98*** **344)
  const phone = activeMessage.phoneNumber;
  const maskedPhone = phone.length > 7
    ? `${phone.slice(0, 5)}•••••${phone.slice(-3)}`
    : phone;

  return (
    <aside 
      aria-label="SMS Notification"
      className="fixed top-4 right-4 sm:right-6 z-[99999] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-sky-500/30 backdrop-blur-md ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200">MESSAGES</span>
                <span className="text-[10px] text-sky-400 font-medium px-1.5 py-0.2 bg-sky-950/80 rounded border border-sky-800/60">
                  FREE OTP
                </span>
                <span className="text-[10px] text-slate-400">• Just now</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">To: {maskedPhone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SMS Message Body */}
        <div className="space-y-2 mb-3">
          <p className="text-xs text-slate-200 leading-relaxed">
            <span className="font-semibold text-sky-300">Anujay Dental Clinic:</span> Your phone verification code is{' '}
            <span className="inline-block px-2 py-0.5 bg-sky-500/20 text-sky-300 font-mono font-bold text-sm rounded border border-sky-400/30 tracking-widest">
              {activeMessage.code}
            </span>
            . Valid for 10 minutes.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero carrier charges applied • Free Instant SMS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleAutoFill}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            {autoFilled ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Auto-Filled!</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Fill {activeMessage.code}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
