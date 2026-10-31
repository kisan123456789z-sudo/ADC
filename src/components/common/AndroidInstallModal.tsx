import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Terminal,
  HelpCircle
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt
}) => {
  const [activeTab, setActiveTab] = useState<'instant_pwa' | 'apk_builder' | 'capacitor'>('instant_pwa');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installed' | 'dismissed'>('idle');

  if (!isOpen) return null;

  const appLiveUrl = window.location.origin;
  const pwaBuilderUrl = `https://www.pwabuilder.com?site=${encodeURIComponent(appLiveUrl)}`;

  const handleInstantInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallStatus('installed');
        } else {
          setInstallStatus('dismissed');
        }
      } catch {
        // Fallback to instruction
      }
    } else {
      // Show manual instructions
    }
  };

  const copyCapacitorCommands = () => {
    const commands = `npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap add android\nnpx cap sync\nnpx cap open android`;
    navigator.clipboard.writeText(commands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#00205b] via-[#002e80] to-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-sky-300 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  Get Android App (APK)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Android Ready
                </span>
              </div>
              <p className="text-xs text-sky-200 truncate">
                Install directly on your phone or generate a signed APK file
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('instant_pwa')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'instant_pwa'
                ? 'border-blue-600 text-blue-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>1-Tap Install (WebAPK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk_builder')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'apk_builder'
                ? 'border-blue-600 text-blue-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Online APK Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'capacitor'
                ? 'border-blue-600 text-blue-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-600" />
            <span>Capacitor Project</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          
          {/* TAB 1: 1-Tap Native Install */}
          {activeTab === 'instant_pwa' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-sm">Recommended: Instant WebAPK Installation</p>
                  <p className="text-slate-600 leading-relaxed">
                    Android Google Play Services automatically compiles and installs this app as an authentic <strong>WebAPK</strong> on your phone. No security warnings, no file downloads, and instant launch from your home screen.
                  </p>
                </div>
              </div>

              {deferredPrompt ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <p className="font-bold text-emerald-900 text-sm">Your Android browser is ready to install!</p>
                  <button
                    type="button"
                    onClick={handleInstantInstall}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Anujay Clinic App on Phone</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="font-bold text-slate-900 text-sm">How to install right now on Android Chrome / Edge:</p>
                  <ol className="list-decimal pl-4 space-y-2 text-slate-600 leading-relaxed">
                    <li>Open this clinic website in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on your phone.</li>
                    <li>Tap the <strong>Three Dots Menu (⋮)</strong> at the top right of Chrome.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>Tap <strong>Install</strong> when prompted — the app icon appears immediately on your phone desktop!</li>
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">Offline Mode</span>
                  <span className="text-[11px] text-slate-500">Works without network</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">Fullscreen UI</span>
                  <span className="text-[11px] text-slate-500">Native app feel & speed</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Online APK Builder */}
          {activeTab === 'apk_builder' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Download className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950 text-sm">Instant APK & AAB Generator</p>
                  <p className="text-emerald-900 leading-relaxed">
                    You can generate a downloadable <strong>.apk</strong> or Google Play ready <strong>.aab</strong> package in 30 seconds using Microsoft's free PWABuilder cloud tool.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="font-bold text-slate-900">Step 1: Your App URL</p>
                <div className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-[11px] text-slate-700 break-all select-all">
                  {appLiveUrl}
                </div>

                <p className="font-bold text-slate-900 pt-1">Step 2: Generate APK</p>
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open PWABuilder & Download APK</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[11px] text-slate-500 text-center">
                  Clicking the button above tests the manifest and gives you an instant <strong>"Generate Android APK"</strong> download button.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Capacitor Project */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-start gap-3">
                <Terminal className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-purple-950 text-sm">Pre-Configured Capacitor Android Project</p>
                  <p className="text-purple-900 leading-relaxed">
                    We have already placed <strong>capacitor.config.json</strong> in your codebase configured with <code>appId: "com.anujay.dentalclinic"</code> and <code>appName: "Anujay Dental Clinic"</code>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-slate-400 font-sans font-bold">Terminal Commands (Local Android Studio)</span>
                  <button
                    type="button"
                    onClick={copyCapacitorCommands}
                    className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-sans cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
                  npm run build{'\n'}
                  npx @capacitor/cli add android{'\n'}
                  npx @capacitor/cli open android
                </pre>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Running <code>npx cap open android</code> opens Android Studio where you can click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> to export the signed release APK file.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Package: <strong className="text-slate-800">com.anujay.dentalclinic</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
