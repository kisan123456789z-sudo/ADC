import React, { useState } from 'react';
import { 
  Calendar, 
  Phone, 
  MessageCircle, 
  Star, 
  Sparkles, 
  CheckCircle2,
  Award,
  FileText,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';

interface HeroSectionProps {
  onBookClick: () => void;
  onOpenMap: () => void;
  onOpenPatientLogin?: (phone?: string) => void;
  onEditDoctorCard?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  onBookClick, 
  onOpenMap, 
  onOpenPatientLogin,
  onEditDoctorCard 
}) => {
  const { settings, about } = useClinic();
  const { role } = useAuth();
  const [phoneInput, setPhoneInput] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onOpenPatientLogin) {
      onOpenPatientLogin(phoneInput);
    }
  };

  const cleanWhatsApp = (settings?.whatsappNumber || '919876543210').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello ${settings?.clinicName || 'Anujay Dental Clinic'}, I want to book an appointment.`
  )}`;

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50 pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/60">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-200/20 via-sky-100/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6 text-center lg:text-left">
            <div className="space-y-6">
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-900 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>{settings.heroBadge || "Multi-Specialty Dental & Oral Implant Center"}</span>
                <span className="hidden sm:inline text-sky-400">•</span>
                <span className="hidden sm:inline text-blue-700">
                  {settings.openingHours ? `Open Daily` : "Open Daily 9 AM - 8 PM"}
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-[3.2rem] font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                {settings.heroTitle ? (
                  settings.heroTitle
                ) : (
                  <>
                    Painless Dental Care For Your Family's{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      Healthiest Smile
                    </span>
                  </>
                )}
              </h1>

              {/* Subtitle / Description */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {settings.heroSubtitle || `Experience gentle, stress-free dentistry with modern German digital diagnostics, computerized anesthesia, and single-sitting root canals under chief specialist ${settings.doctorName}.`}
              </p>

              {/* Key USPs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 text-left">
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">{settings.heroUsp1 || "100% Painless Protocol"}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">{settings.heroUsp2 || "Free Sunday Checkup"}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">{settings.heroUsp3 || "Pay at Clinic (Cash)"}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-2">
                {/* 1. Primary Book Appointment CTA */}
                <button
                  type="button"
                  onClick={onBookClick}
                  className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-blue-600/25 ring-1 ring-blue-500/30 flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Calendar className="w-5 h-5 text-white/95 shrink-0" />
                  <span>Book Instant Appointment</span>
                </button>

                {/* 2. Authentic WhatsApp Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto h-12 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-500/30 flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform shrink-0" />
                  <span>Chat on WhatsApp</span>
                </a>

                {/* 3. Patient Portal Access Button */}
                {onOpenPatientLogin && (
                  <button
                    type="button"
                    onClick={() => onOpenPatientLogin()}
                    className="w-full sm:w-auto h-12 px-5 bg-white hover:bg-indigo-50/80 text-indigo-950 font-bold text-sm sm:text-base rounded-full border border-indigo-200 shadow-md shadow-indigo-950/5 flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                  >
                    <FileText className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span>Patient Portal (Reports & Bills)</span>
                  </button>
                )}

                {/* 4. Direct Call Button */}
                <a
                  href={`tel:${(settings?.phone || '+919876543210').replace(/\s+/g, '')}`}
                  className="w-full sm:w-auto h-12 px-4.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm sm:text-base rounded-full border border-slate-200/90 shadow-2xs flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Call Now</span>
                </a>
              </div>

              {/* QUICK PHONE NUMBER INPUT FOR PATIENT TO SEE REPORTS & PRESCRIPTIONS DIRECTLY */}
              {onOpenPatientLogin && (
                <div className="mt-2 p-4 bg-gradient-to-r from-[#00205b] to-blue-900 text-white rounded-2xl shadow-xl border border-blue-400/30 text-left">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-500/30 flex items-center justify-center text-sky-300">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        View Your Dental Reports & Prescriptions
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30">
                      Quick Access
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200/90 mb-3">
                    Enter your registered phone number to view your dental reports, prescriptions, and billing receipts.
                  </p>
                  <form onSubmit={handlePhoneSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-blue-300">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-12 pr-3 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-blue-200/60 font-bold text-xs rounded-xl border border-blue-300/30 focus:border-white focus:outline-none transition shadow-inner"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-[#00205b] font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0 hover:scale-[1.02] cursor-pointer"
                    >
                      <span>View My Reports</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Social proof stars */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-xs text-slate-600">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-800 text-sm">4.9 / 5.0</span>
              <span className="text-slate-400">•</span>
              <span>Based on 850+ verified patient reviews</span>
            </div>
          </div>

          {/* Right Column: Visual Doctor Card & Clinic Highlights */}
          <div className="lg:col-span-6 relative flex flex-col">
            <div className="relative w-full h-full flex flex-col">
              
              {/* Doctor Card Profile - Sized to neatly cover the full banner height */}
              <div className="bg-white rounded-3xl p-4 sm:p-7 lg:p-9 shadow-2xl border border-slate-200/90 relative z-10 flex flex-col justify-between h-full space-y-4 sm:space-y-6">
                
                {/* Doctor Header & Bio */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                  <div className="relative shrink-0 group">
                    <img 
                      src={about.doctorPhotoUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=80"} 
                      alt={about.doctorName || settings.doctorName}
                      className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-2xl object-cover ring-4 ring-blue-100 shadow-md group-hover:ring-purple-300 transition"
                    />
                    <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                      Chief
                    </div>
                    {onEditDoctorCard && (
                      <button
                        type="button"
                        onClick={onEditDoctorCard}
                        title="Change Doctor Photo"
                        className="absolute inset-0 rounded-2xl bg-slate-950/45 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 cursor-pointer font-bold text-xs"
                      >
                        <Edit3 className="w-5 h-5 text-white drop-shadow-sm" />
                        <span>Change Photo</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black uppercase tracking-wider rounded-full">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        Chief Dental Surgeon
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{about.doctorName || settings.doctorName}</h3>
                    <p className="text-xs sm:text-base text-blue-900 font-semibold">{about.doctorDegree || settings.doctorDegree}</p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">{about.doctorSpecialization || settings.doctorSpecialization}</p>
                    <p className="text-[11px] font-mono text-slate-400">Reg No: {about.doctorRegNo || settings.doctorRegNo}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-blue-700 font-semibold pt-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Verified Dental Surgeon & Implantologist</span>
                    </div>
                  </div>
                </div>

                {/* Key clinical metrics */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 sm:p-3.5 sm:p-4 bg-blue-50/70 rounded-xl sm:rounded-2xl border border-blue-100/60">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-700">{about.experienceYears || '12+ Yrs'}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-0.5 leading-tight">Clinical Practice</p>
                  </div>
                  <div className="p-2 sm:p-3.5 sm:p-4 bg-indigo-50/70 rounded-xl sm:rounded-2xl border border-indigo-100/60">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-indigo-700">{about.happyPatients || '15,000+'}</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-0.5 leading-tight">Smiles Transformed</p>
                  </div>
                  <div className="p-2 sm:p-3.5 sm:p-4 bg-amber-50/70 rounded-xl sm:rounded-2xl border border-amber-100/60">
                    <p className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600">4.9 ★</p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-0.5 leading-tight">Patient Rating</p>
                  </div>
                </div>

                {/* Clinical Focus Highlights & Consultation Bar */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-700">Single Sitting RCT</span>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-700">Digital RVG Sensors</span>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-700">CAD/CAM Crowns</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg font-semibold">100% Painless Tech</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      Consulting: {settings.openingHours || '9:00 AM - 8:00 PM'}
                    </span>
                    <button
                      type="button"
                      onClick={onBookClick}
                      className="text-xs text-blue-700 font-bold hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <span>Book with Dr. Anujay</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
