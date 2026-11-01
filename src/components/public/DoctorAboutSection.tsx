import React, { useState } from 'react';
import { 
  Award, 
  Stethoscope, 
  GraduationCap, 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  MessageCircle,
  CheckCircle2,
  Quote,
  Camera
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface DoctorAboutSectionProps {
  onBookClick?: (service?: string) => void;
}

export const DoctorAboutSection: React.FC<DoctorAboutSectionProps> = ({ onBookClick }) => {
  const { about, settings } = useClinic();
  
  // If admin toggled off the doctor section, hide cleanly
  if (about.showDoctorSection === false) {
    return null;
  }

  const primaryPhoto = about.doctorPhotoUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80";
  const allPhotos = about.doctorPhotos && about.doctorPhotos.length > 0 
    ? about.doctorPhotos 
    : [primaryPhoto];
  
  const [selectedPhoto, setSelectedPhoto] = useState<string>(primaryPhoto);

  // Sync if primary photo changes in context
  React.useEffect(() => {
    setSelectedPhoto(primaryPhoto);
  }, [primaryPhoto]);

  const whatsappMessage = encodeURIComponent(
    `Hello ${about.doctorName || 'Dr. Anujay Sharma'}, I would like to consult with you regarding a dental checkup at AnuJay Dental Clinic.`
  );
  const whatsappUrl = `https://wa.me/${(settings?.phone || '917692808120').replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-slate-50 border-t border-slate-200/60 relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header Tag */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
            <span>Meet Your Chief Dental Surgeon</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            {about.title || "About AnuJay Dental Clinic"}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium">
            {about.subtitle || "World-Class Dental Care with a Gentle Touch"}
          </p>
        </div>

        {/* Main Content Grid: Left Doctor Photo & Gallery | Right Credentials & Bio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT: DOCTOR PHOTO & GALLERY THUMBNAILS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-md">
              
              {/* Golden/Blue Backdrop Aura Frame */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 rounded-3xl blur-md opacity-25 group-hover:opacity-40 transition" />
              
              <div className="relative bg-white rounded-3xl p-3 shadow-xl border border-slate-200 overflow-hidden">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 shadow-inner group">
                  <img
                    src={selectedPhoto}
                    alt={about.doctorName || "Chief Dental Surgeon"}
                    className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay for bottom text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Top Badge: Experience */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-md text-blue-950 font-extrabold text-xs rounded-full shadow-md border border-white/60 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{about.experienceYears || "12+ Years"} Excellence</span>
                  </div>

                  {/* Floating Top Right Badge: DCI Verified */}
                  {about.doctorRegNo && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-full shadow-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{about.doctorRegNo}</span>
                    </div>
                  )}

                  {/* Bottom Doctor Overlay Info */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-lg font-extrabold leading-tight drop-shadow-md">
                      {about.doctorName || "Dr. Anujay Sharma"}
                    </p>
                    <p className="text-xs text-blue-200 font-medium">
                      {about.doctorSpecialization || "Chief Dental Surgeon & Implantologist"}
                    </p>
                  </div>
                </div>

                {/* Additional Photos Thumbnails if more than 1 exists */}
                {allPhotos.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-500">
                      <Camera className="w-3 h-3 text-blue-600" />
                      <span>Doctor & Clinical Views:</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {allPhotos.map((photoUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhoto(photoUrl)}
                          className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                            selectedPhoto === photoUrl 
                              ? 'border-blue-600 ring-2 ring-blue-300 scale-105' 
                              : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img 
                            src={photoUrl} 
                            alt={`Doctor view ${idx + 1}`} 
                            className="w-full h-full object-cover object-top"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Bottom Metric Badge */}
              <div className="absolute -bottom-5 right-4 sm:-right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 leading-none">
                    {about.happyPatients || "15,000+"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Smiles Restored
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CREDENTIALS, CLINIC BIO & PHILOSOPHY (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Degrees */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>{about.doctorDegree || "B.D.S., M.D.S. (Orthodontics & Implantology)"}</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {about.doctorName || "Dr. Anujay Sharma"}
              </h3>
              
              <p className="text-sm sm:text-base font-semibold text-blue-700">
                {about.doctorSpecialization || "Chief Dental Surgeon & Implantologist"}
              </p>
            </div>

            {/* Detailed Clinic Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {about.description || "Anujay Dental Clinic is a premier multi-specialty dental centre dedicated to delivering painless, ethical, and modern dental treatments. Equipped with cutting-edge German digital imaging, ultrasonic scalers, and Class-B autoclave sterilization, we ensure maximum patient comfort and safety."}
            </p>

            {/* Clinic Highlights / Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Painless Modern Anesthesia</p>
                  <p className="text-slate-500">Computerized gentle delivery for calm visits</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">German Class-B Sterilization</p>
                  <p className="text-slate-500">6-stage hospital-grade autoclave protection</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Digital Dental Imaging</p>
                  <p className="text-slate-500">Instant HD low-radiation X-Rays & OPG</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Ethical & Transparent Pricing</p>
                  <p className="text-slate-500">Clear estimates with no hidden clinic charges</p>
                </div>
              </div>
            </div>

            {/* Philosophy Quote Card */}
            {about.clinicPhilosophy && (
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md relative overflow-hidden">
                <Quote className="absolute right-3 top-3 w-14 h-14 text-white/10 pointer-events-none" />
                <div className="flex items-start gap-3 relative z-10">
                  <div className="p-2 bg-white/10 rounded-xl text-amber-400 shrink-0">
                    <Heart className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Our Clinical Philosophy
                    </p>
                    <p className="text-xs sm:text-sm text-blue-100 italic leading-relaxed">
                      "{about.clinicPhilosophy}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions: Direct Booking & WhatsApp */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onBookClick && onBookClick()}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Book Appointment with {about.doctorName?.split(' ')[0] || 'Doctor'}</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
                <span>Ask Doctor on WhatsApp</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
