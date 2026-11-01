import React, { useEffect, useState } from 'react';
import { 
  Home, 
  Stethoscope, 
  Calendar, 
  FileText, 
  User,
  LogOut,
  Phone,
  MessageCircle,
  ShieldCheck,
  X,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Patient, ClinicSettings } from '../../types/clinic';

export type NavItemKey = 'home' | 'services' | 'booking' | 'reports' | 'profile';

interface MobileBottomNavProps {
  currentView: 'public' | 'patient';
  currentPatient: Patient | null;
  settings?: ClinicSettings;
  onNavigateHome: () => void;
  onNavigateServices: () => void;
  onNavigateBooking: () => void;
  onNavigateReports: () => void;
  onNavigateProfile?: () => void;
  onPatientLogout?: () => void;
  onOpenWhatsAppPrefs?: () => void;
  activePatientTab?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  currentPatient,
  settings,
  onNavigateHome,
  onNavigateServices,
  onNavigateBooking,
  onNavigateReports,
  onNavigateProfile,
  onPatientLogout,
  onOpenWhatsAppPrefs,
  activePatientTab
}) => {
  const [activeItem, setActiveItem] = useState<NavItemKey>('home');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Sync active section based on scroll in public website
  useEffect(() => {
    if (currentView === 'patient') {
      if (activePatientTab === 'reports' || activePatientTab === 'prescriptions' || activePatientTab === 'xrays') {
        setActiveItem('reports');
      } else {
        setActiveItem('reports');
      }
      return;
    }

    // Public website scroll spy
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      const bookEl = document.getElementById('book') || document.getElementById('booking');
      const servicesEl = document.getElementById('services');
      const homeEl = document.getElementById('home');

      if (bookEl) {
        const rect = bookEl.getBoundingClientRect();
        if (rect.top <= windowHeight * 0.45 && rect.bottom >= 100) {
          setActiveItem('booking');
          return;
        }
      }

      if (servicesEl) {
        const rect = servicesEl.getBoundingClientRect();
        if (rect.top <= windowHeight * 0.45 && rect.bottom >= 100) {
          setActiveItem('services');
          return;
        }
      }

      if (scrollY < 400 || (homeEl && homeEl.getBoundingClientRect().top <= 100)) {
        setActiveItem('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView, activePatientTab]);

  const cleanPhone = (settings?.phone || '917692808120').replace(/\D/g, '');
  const cleanWhatsApp = (settings?.whatsappNumber || '917692808120').replace(/\D/g, '');

  const handleItemClick = (key: NavItemKey) => {
    setActiveItem(key);
    if (key === 'home') {
      onNavigateHome();
    } else if (key === 'services') {
      onNavigateServices();
    } else if (key === 'booking') {
      onNavigateBooking();
    } else if (key === 'reports') {
      onNavigateReports();
    } else if (key === 'profile') {
      if (currentView === 'patient' || currentPatient) {
        setProfileModalOpen(true);
      } else if (onNavigateProfile) {
        onNavigateProfile();
      } else {
        onNavigateReports();
      }
    }
  };

  return (
    <>
      {/* 
        Mobile Bottom Navigation Bar
        - STRICTLY hidden on tablet/desktop (md:hidden)
        - Visible on all mobile screens (< 768px width)
        - Safe area padding for iPhones with home bars
        - Fixed at bottom with high z-index
      */}
      <nav 
        role="navigation"
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,32,91,0.08)] transition-all select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="w-full max-w-lg mx-auto px-1 sm:px-2 flex items-center justify-around h-15">
          
          {/* 1. HOME */}
          <button
            type="button"
            onClick={() => handleItemClick('home')}
            className={`relative flex-1 min-h-[48px] py-1 px-0.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation group ${
              activeItem === 'home' 
                ? 'text-[#00205b]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Home"
            aria-current={activeItem === 'home' ? 'page' : undefined}
          >
            <div className={`relative p-1 rounded-xl transition-all ${
              activeItem === 'home' ? 'bg-blue-50/90 text-[#00205b]' : 'group-hover:bg-slate-100/60'
            }`}>
              <Home className={`w-5 h-5 transition-transform ${activeItem === 'home' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
              {activeItem === 'home' && (
                <span className="absolute -top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[58px] ${
              activeItem === 'home' ? 'font-extrabold text-[#00205b]' : 'font-medium'
            }`}>
              Home
            </span>
          </button>

          {/* 2. SERVICES */}
          <button
            type="button"
            onClick={() => handleItemClick('services')}
            className={`relative flex-1 min-h-[48px] py-1 px-0.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation group ${
              activeItem === 'services' 
                ? 'text-[#00205b]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Dental Services"
            aria-current={activeItem === 'services' ? 'page' : undefined}
          >
            <div className={`relative p-1 rounded-xl transition-all ${
              activeItem === 'services' ? 'bg-blue-50/90 text-[#00205b]' : 'group-hover:bg-slate-100/60'
            }`}>
              <Stethoscope className={`w-5 h-5 transition-transform ${activeItem === 'services' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
              {activeItem === 'services' && (
                <span className="absolute -top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[58px] ${
              activeItem === 'services' ? 'font-extrabold text-[#00205b]' : 'font-medium'
            }`}>
              Services
            </span>
          </button>

          {/* 3. BOOKING (Prominent Center Action) */}
          <button
            type="button"
            onClick={() => handleItemClick('booking')}
            className="relative flex-1 min-h-[48px] py-1 px-0.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer touch-manipulation group"
            aria-label="Book Appointment"
            aria-current={activeItem === 'booking' ? 'page' : undefined}
          >
            <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200 ${
              activeItem === 'booking'
                ? 'bg-gradient-to-tr from-[#00205b] to-blue-600 text-white shadow-blue-900/30 ring-2 ring-blue-400/40 scale-105'
                : 'bg-gradient-to-tr from-[#00205b] to-[#003882] text-white shadow-slate-900/15 group-hover:scale-105'
            }`}>
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[58px] ${
              activeItem === 'booking' ? 'font-black text-[#00205b]' : 'font-semibold text-slate-600'
            }`}>
              Book
            </span>
          </button>

          {/* 4. REPORTS / RECORDS */}
          <button
            type="button"
            onClick={() => handleItemClick('reports')}
            className={`relative flex-1 min-h-[48px] py-1 px-0.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation group ${
              activeItem === 'reports' 
                ? 'text-[#00205b]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Dental Reports & Prescriptions"
            aria-current={activeItem === 'reports' ? 'page' : undefined}
          >
            <div className={`relative p-1 rounded-xl transition-all ${
              activeItem === 'reports' ? 'bg-blue-50/90 text-[#00205b]' : 'group-hover:bg-slate-100/60'
            }`}>
              <FileText className={`w-5 h-5 transition-transform ${activeItem === 'reports' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
              {activeItem === 'reports' && (
                <span className="absolute -top-0.5 right-0.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[58px] ${
              activeItem === 'reports' ? 'font-extrabold text-[#00205b]' : 'font-medium'
            }`}>
              Reports
            </span>
          </button>

          {/* 5. PROFILE / ACCOUNT */}
          <button
            type="button"
            onClick={() => handleItemClick('profile')}
            className={`relative flex-1 min-h-[48px] py-1 px-0.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation group ${
              activeItem === 'profile' 
                ? 'text-[#00205b]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            aria-label="Profile and Portal"
            aria-current={activeItem === 'profile' ? 'page' : undefined}
          >
            <div className={`relative p-1 rounded-xl transition-all ${
              activeItem === 'profile' ? 'bg-blue-50/90 text-[#00205b]' : 'group-hover:bg-slate-100/60'
            }`}>
              <User className={`w-5 h-5 transition-transform ${activeItem === 'profile' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
              {currentPatient && (
                <span className="absolute -top-0.5 right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
              )}
            </div>
            <span className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[58px] ${
              activeItem === 'profile' ? 'font-extrabold text-[#00205b]' : 'font-medium'
            }`}>
              Profile
            </span>
          </button>

        </div>
      </nav>

      {/* Patient Profile Sheet / Modal when tapping Profile on mobile */}
      {profileModalOpen && currentPatient && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center animate-in fade-in duration-200"
          onClick={() => setProfileModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00205b] to-sky-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {currentPatient.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{currentPatient.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Patient Account</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Details Cards */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registered Phone:</span>
                <strong className="text-slate-900 font-mono">+91 {currentPatient.phone}</strong>
              </div>

              {currentPatient.totalVisits !== undefined && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Completed Visits:</span>
                  <strong className="text-blue-900 font-bold">{currentPatient.totalVisits} visits</strong>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              {onOpenWhatsAppPrefs && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    onOpenWhatsAppPrefs();
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Care Alerts</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </button>
              )}

              <a
                href={`tel:${cleanPhone}`}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>Call Clinic Desk ({settings?.phone || '+91 76928 08120'})</span>
                </span>
                <ChevronRight className="w-4 h-4 text-blue-600" />
              </a>

              <a
                href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent('Hello Dr. Anujay, I have an inquiry regarding my dental records.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat with Doctor on WhatsApp</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {/* Logout Button */}
            {onPatientLogout && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setProfileModalOpen(false);
                    onPatientLogout();
                  }}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 border border-rose-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Patient Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
