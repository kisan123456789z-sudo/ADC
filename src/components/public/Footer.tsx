import React from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  MessageCircle, 
  ShieldCheck, 
  Heart,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface FooterProps {
  onOpenLogin: (tab?: 'staff' | 'admin') => void;
  onOpenMap: () => void;
  onOpenPatientLogin?: () => void;
  onOpenAndroidApp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenLogin, 
  onOpenMap, 
  onOpenPatientLogin,
  onOpenAndroidApp 
}) => {
  const { settings } = useClinic();

  const cleanWhatsApp = (settings?.whatsappNumber || '919876543210').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello ${settings?.clinicName || 'Anujay Dental Clinic'}, I would like to inquire about dental services.`
  )}`;

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Clinic Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C8.5 2 6 4.5 6 7.5C6 9.5 7 11.5 7.5 13.5C8 15.5 8.5 18 9.5 21C10 22 11 22 11.5 21C12 20 12 18 12 16C12 18 12 20 12.5 21C13 22 14 22 14.5 21C15.5 18 16 15.5 16.5 13.5C17 11.5 18 9.5 18 7.5C18 4.5 15.5 2 12 2Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{settings.clinicName}</h3>
                <p className="text-xs text-sky-400 font-medium">Dr. Anujay Sharma (BDS, MDS)</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leading dental healthcare clinic providing pain-free treatments, digital smile design, 
              single sitting root canals, and modern implant dentistry.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row lg:flex-col gap-2">
              {onOpenPatientLogin && (
                <button
                  type="button"
                  onClick={onOpenPatientLogin}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-indigo-950/60 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500/50 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Patient Portal (Reports & Bills)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenLogin('staff')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Staff & Admin Portal Login</span>
              </button>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Clinic Sections</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li><a href="#services" className="hover:text-sky-400 transition">Services & Transparent Fees</a></li>
              <li><a href="#gallery" className="hover:text-sky-400 transition">Clinic Infrastructure & Tour</a></li>
              <li><a href="#reviews" className="hover:text-sky-400 transition">Patient Reviews & Add Feedback</a></li>
              <li><a href="#about" className="hover:text-sky-400 transition">About Dr. Anujay Sharma</a></li>
              <li><a href="#faq" className="hover:text-sky-400 transition">Frequently Asked Questions</a></li>
              <li><a href="#highlights" className="hover:text-sky-400 transition">Free Sunday Checkup Camp</a></li>
            </ul>
          </div>

          {/* Col 3: Contact & Timings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Timings & Contact</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">{settings.openingHours || '9:00 AM - 8:00 PM'}</p>
                  <p className="text-[11px] text-slate-400">Monday to Sunday (Open All 7 Days)</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <a href={`tel:${(settings?.phone || '+919876543210').replace(/\s+/g, '')}`} className="hover:text-white font-semibold">
                  {settings?.phone || '+91 98765 43210'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 font-semibold text-emerald-400">
                  WhatsApp: +91 {cleanWhatsApp}
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Location & Map */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Clinic Location</h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{settings.address}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenMap}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Open Google Map Location</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-10 mt-10 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings.clinicName}. All rights reserved. Hospital-grade Class-B Sterilization.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Mode: Pay at Clinic - Cash</span>
            <button 
              onClick={() => onOpenLogin('admin')}
              className="text-slate-400 hover:text-purple-300 transition"
            >
              Admin Access
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
