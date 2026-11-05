import React from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  Lock, 
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LegalInformationSectionProps {
  className?: string;
  isCompact?: boolean;
}

export const LegalInformationSection: React.FC<LegalInformationSectionProps> = ({ 
  className = '',
  isCompact = false
}) => {
  return (
    <section 
      id="legal" 
      aria-labelledby="medical-privacy-disclaimer-title"
      className={`scroll-mt-24 transition-all duration-300 ${className}`}
    >
      <div className={isCompact ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6'}>
        
        {/* Section Header (Compact & Professional) */}
        {!isCompact && (
          <div className="mb-6 sm:mb-8 text-center max-w-2xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Legal Information & Patient Policies</span>
            </div>
            <h3 
              id="medical-privacy-disclaimer-title" 
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            >
              Medical & Privacy
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Transparent clinical guidelines, patient data privacy, and digital terms of use for Anujay Dental Clinic.
            </p>
          </div>
        )}

        {/* 4 Pastel Cards Grid */}
        <div className={`grid gap-4 ${
          isCompact 
            ? 'grid-cols-1 sm:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          
          {/* 1. Medical Disclaimer: Light Blue */}
          <div className="bg-sky-50/75 border border-sky-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-sky-100/90 text-sky-700 border border-sky-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5 text-sky-700" />
                </div>
                {/* Small Coloured Accent Highlight */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-100/90 border border-sky-200 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3 h-3 text-sky-600" />
                  <span>Advisory Only</span>
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-sky-950 tracking-tight">
                  Medical Disclaimer
                </h4>
                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  This app is intended for appointment booking and viewing dental reports only. It does not provide medical diagnosis or treatment. Please consult Dr. Anujay Dental Clinic for professional dental care.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-200/60 flex items-center gap-1.5 text-[11px] font-medium text-sky-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>In-clinic consultation required</span>
            </div>
          </div>

          {/* 2. Privacy Policy: Soft Mint Green */}
          <div className="bg-emerald-50/75 border border-emerald-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                {/* Small Coloured Accent Highlight */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>100% Confidential</span>
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-emerald-950 tracking-tight">
                  Privacy Policy
                </h4>
                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  Your personal and dental information is handled securely by the clinic and is not sold or shared with third parties except when necessary to provide healthcare services.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center gap-1.5 text-[11px] font-medium text-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>No third-party data selling</span>
            </div>
          </div>

          {/* 3. Data Protection: Light Lavender */}
          <div className="bg-purple-50/75 border border-purple-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100/90 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5 text-purple-700" />
                </div>
                {/* Small Coloured Accent Highlight */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100/90 border border-purple-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                  <span>Encrypted Storage</span>
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-purple-950 tracking-tight">
                  Data Protection
                </h4>
                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  Patient medical histories, diagnostic digital scans, and contact records are protected through clinical encryption and restricted strictly to authorized clinic staff.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center gap-1.5 text-[11px] font-medium text-purple-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Encrypted data handling</span>
            </div>
          </div>

          {/* 4. Terms of Use: Soft Peach */}
          <div className="bg-orange-50/75 border border-orange-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100/90 text-orange-700 border border-orange-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-orange-700" />
                </div>
                {/* Small Coloured Accent Highlight */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-800 bg-orange-100/90 border border-orange-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-orange-600" />
                  <span>Standard Clinic Terms</span>
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-orange-950 tracking-tight">
                  Terms of Use
                </h4>
                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  Use of this web portal and electronic report viewer is provided solely to facilitate dental appointments and patient care or comply with legal requirements.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-orange-200/60 flex items-center gap-1.5 text-[11px] font-medium text-orange-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>Statutory legal compliance</span>
            </div>
          </div>

        </div>

        {/* Verbatim Combined Clinic Notice Strip */}
        <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
          <p className="leading-relaxed">
            <strong className="text-slate-900 font-bold">Official Disclaimer:</strong> This app is intended for appointment booking and viewing dental reports only. It does not provide medical diagnosis or treatment. Please consult Dr. Anujay Dental Clinic for professional dental care. Your personal and dental information is handled securely by the clinic and is not sold or shared with third parties except when necessary to provide services or comply with legal requirements.
          </p>
        </div>

      </div>
    </section>
  );
};
