import React, { useState } from 'react';
import { 
  MapPin, 
  MessageCircle, 
  Calendar, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronRight,
  FileText
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMap: () => void;
  onOpenLogin: (tab?: 'staff' | 'admin') => void;
  onBookClick: () => void;
  onOpenPatientLogin?: (phone?: string) => void;
  onOpenAndroidApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenMap, 
  onOpenLogin, 
  onBookClick,
  onOpenPatientLogin,
  onOpenAndroidApp
}) => {
  const { settings, newBookingsCount } = useClinic();
  const { role, staffUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanWhatsApp = (settings?.whatsappNumber || '917692808120').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello ${settings?.clinicName || 'Anujay Dental Clinic'}, I would like to inquire about dental consultation and appointment.`
  )}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Clinic Logo & Brand (Left) */}
        <a href="#home" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 flex-1 max-w-[200px] sm:max-w-none">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt={settings.clinicName} 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-sm ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition shrink-0" 
            />
          ) : (
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.5 2 6 4.5 6 7.5C6 9.5 7 11.5 7.5 13.5C8 15.5 8.5 18 9.5 21C10 22 11 22 11.5 21C12 20 12 18 12 16C12 18 12 20 12.5 21C13 22 14 22 14.5 21C15.5 18 16 15.5 16.5 13.5C17 11.5 18 9.5 18 7.5C18 4.5 15.5 2 12 2ZM9 8C8.4 8 8 7.6 8 7C8 6.4 8.4 6 9 6C9.6 6 10 6.4 10 7C10 7.6 9.6 8 9 8Z" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-700 transition truncate">
                {settings.clinicName}
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                CLINIC
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 tracking-tight mt-0.5 hidden sm:block truncate">
              {settings.tagline || 'Excellence in Modern Painless Dentistry'}
            </p>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-semibold text-slate-600">
          <a href="#services" className="hover:text-blue-600 transition">Services & Pricing</a>
          <a href="#location" className="hover:text-blue-600 transition">Location & Map</a>
          <a href="#gallery" className="hover:text-blue-600 transition">Clinic Tour</a>
          <a href="#reviews" className="hover:text-blue-600 transition">Reviews</a>
          <a href="#about" className="hover:text-blue-600 transition">About Doctor</a>
          <a href="#faq" className="hover:text-blue-600 transition">FAQs</a>
          <a href="#highlights" className="hover:text-blue-600 transition">Free Sunday Checkup</a>
        </nav>

        {/* Navigation Controls on Right */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* 1. WhatsApp Us Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/90 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all duration-150 group"
            title="Chat directly with clinic desk on WhatsApp"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-tight">WhatsApp Us</span>
          </a>

          {/* 2. Patient Portal (Reports, Invoices, Prescriptions) */}
          {onOpenPatientLogin && (
            <button
              type="button"
              onClick={() => onOpenPatientLogin()}
              className="inline-flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full text-xs font-semibold bg-indigo-50/90 hover:bg-indigo-100 text-indigo-950 border border-indigo-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all duration-150 cursor-pointer group shrink-0"
              title="Access your Dental Prescriptions, X-Rays, Invoices & Payment Ledger"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-bold tracking-tight hidden sm:inline">Patient Portal</span>
              <span className="font-bold tracking-tight sm:hidden">Portal</span>
              <span className="hidden 2xl:inline-block text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                Reports & Bills
              </span>
            </button>
          )}

          {/* 3. Book Button */}
          <button
            type="button"
            onClick={onBookClick}
            className="inline-flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-4 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-white/95 shrink-0" />
            <span className="hidden sm:inline">Book Appointment</span>
            <span className="sm:hidden">Book</span>
          </button>

          {/* Active staff/admin badge when logged in */}
          {role !== 'public' && (
            <div className="flex items-center gap-1.5 ml-1">
              <a
                href={role === 'admin' ? '#admin-dashboard' : '#staff-dashboard'}
                className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold rounded-full transition-all shadow-2xs border ${
                  role === 'admin' 
                    ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100' 
                    : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-purple-600 animate-pulse' : 'bg-blue-600'}`} />
                <span>{role === 'admin' ? 'Admin Portal' : `Staff (${staffUser?.name?.split(' ')[0] || 'User'})`}</span>
                {newBookingsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full">
                    {newBookingsCount}
                  </span>
                )}
              </a>
              <button
                type="button"
                onClick={logout}
                className="h-9 px-2.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer font-medium"
                title="Logout"
              >
                Logout
              </button>
            </div>
          )}

          {/* Hamburger menu */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
          
          {/* Quick Action Cards in Mobile Menu */}
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            {/* Book Appointment Card */}
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onBookClick(); }}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-sm text-xs font-bold cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            {/* WhatsApp Card */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl shadow-2xs text-xs font-bold cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>WhatsApp Us</span>
            </a>

            {/* Patient Portal Card */}
            {onOpenPatientLogin && (
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); onOpenPatientLogin(); }}
                className="flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-2xl shadow-2xs text-xs font-bold cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Patient Portal</span>
              </button>
            )}

            {/* Staff / Admin Login Card */}
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onOpenLogin('staff'); }}
              className="flex items-center justify-center gap-2 p-3 bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl shadow-2xs text-xs font-bold cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Staff / Admin</span>
            </button>
          </div>

          <nav className="flex flex-col space-y-1.5 text-sm font-semibold text-slate-700">
            <a 
              href="#services" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>Services & Pricing</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#location" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between text-blue-700 font-bold"
            >
              <span>Clinic Location & Live Map (Bhilai)</span>
              <ChevronRight className="w-4 h-4 text-blue-400" />
            </a>
            <a 
              href="#gallery" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>Clinic Tour (Reception & Machines)</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#reviews" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>Patient Reviews & Feedback</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>About Dr. Anujay Sharma</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>Frequently Asked Questions</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#highlights" 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between"
            >
              <span>Free Sunday Community Camp</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onOpenMap(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>View Clinic Map & Route</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
