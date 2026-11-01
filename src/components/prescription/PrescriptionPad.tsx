import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  CheckCircle2, 
  Upload, 
  RotateCcw 
} from 'lucide-react';
import { Prescription } from '../../types/clinic';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import { 
  PRESCRIPTION_COORDINATES, 
  getActivePrescriptionTemplate, 
  saveActivePrescriptionTemplate, 
  resetActivePrescriptionTemplate,
  getActivePrescriptionBanner
} from '../../utils/prescriptionTemplate';
import { compressImageFile } from '../../utils/fileStorageHelper';

interface PrescriptionPadProps {
  prescription: Partial<Prescription>;
  isEditable?: boolean;
  onChange?: (updated: Partial<Prescription>) => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onSave?: () => void;
  showActions?: boolean;
}

export const PrescriptionPad: React.FC<PrescriptionPadProps> = ({
  prescription,
  isEditable = false,
  onChange,
  onPrint,
  onDownloadPdf,
  onSave,
  showActions = true,
}) => {
  // THREE AND ONLY THREE EDITABLE PRESCRIPTION FIELDS:
  // 1. Patient Name
  // 2. Date
  // 3. Age / Sex
  const patientName = prescription.patientName || '';
  const date = prescription.date || new Date().toLocaleDateString('en-GB');
  const ageSex = prescription.ageSex || (
    prescription.age && prescription.gender 
      ? `${prescription.age} / ${prescription.gender.charAt(0).toUpperCase()}` 
      : (prescription.age ? `${prescription.age} Yrs` : '')
  ) || '';

  // Active template image (Original image scan or SVG letterhead with active custom banner)
  const [templateImage, setTemplateImage] = useState<string>(() => 
    getActivePrescriptionTemplate(null, prescription.customBannerUrl)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const showFeedback = (text: string, isError = false) => {
    setFeedbackMsg({ text, isError });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  useEffect(() => {
    const handleTemplateChanged = () => {
      setTemplateImage(getActivePrescriptionTemplate(null, prescription.customBannerUrl));
    };
    window.addEventListener('prescription_template_changed', handleTemplateChanged);
    return () => {
      window.removeEventListener('prescription_template_changed', handleTemplateChanged);
    };
  }, [prescription.customBannerUrl]);

  const handleFieldChange = (field: keyof Prescription, value: any) => {
    if (onChange) {
      onChange({
        ...prescription,
        [field]: value
      });
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      const activeBanner = prescription.customBannerUrl || getActivePrescriptionBanner();
      generatePrescriptionPDF({
        patientName: patientName || 'Patient',
        patientPhone: prescription.patientPhone || 'N/A',
        showPhoneOnPrescription: false,
        date,
        ageSex,
        customBannerUrl: activeBanner || undefined,
        doctorName: prescription.doctorName || 'Dr. Anup Kumar Hota',
        doctorDegree: prescription.doctorDegree || 'DENTAL SURGEON (BDS)',
        doctorRegNo: prescription.doctorRegNo || 'CGDC/G/26/4876',
        createdAt: new Date().toISOString()
      } as Prescription, isCustomScanActive ? templateImage : null, {
        customBannerUrl: activeBanner || undefined
      });
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showFeedback('Please upload an image file (PNG, JPG, WebP).', true);
      return;
    }
    try {
      const { dataUrl } = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1600, quality: 0.8, maxSizeBytes: 140 * 1024 });
      if (dataUrl) {
        saveActivePrescriptionTemplate(dataUrl);
        setTemplateImage(dataUrl);
        showFeedback('Prescription template loaded successfully!');
      }
    } catch {
      showFeedback('Failed to process prescription image.', true);
    }
  };

  const handleResetTemplate = () => {
    resetActivePrescriptionTemplate();
    setTemplateImage(getActivePrescriptionTemplate());
    showFeedback('Restored default prescription template.');
  };

  const isCustomScanActive = (() => {
    try {
      return !!localStorage.getItem('anujay_custom_prescription_template');
    } catch {
      return false;
    }
  })();

  return (
    <div className="space-y-4">
      {feedbackMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedbackMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${feedbackMsg.isError ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span>{feedbackMsg.text}</span>
        </div>
      )}
      {/* Top Action Bar (hidden when printing) */}
      {showActions && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-serif font-black text-sm text-white">
              ℞
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Official Clinic Prescription Pad</span>
                {isCustomScanActive ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-normal border border-emerald-500/30">
                    Uploaded Scan Active
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded font-normal border border-sky-500/30">
                    Approved Template Active
                  </span>
                )}
              </p>
              <p className="text-[10px] text-slate-300">Anujay Dental Clinic • Letterhead Format (A4 Standard)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Hidden File Input for template upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />

            {/* Template Upload / Replace button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium rounded-xl transition flex items-center gap-1.5 border border-slate-700"
              title="Upload reference prescription image (image.png)"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>{isCustomScanActive ? 'Replace Image Scan' : 'Upload Image Scan'}</span>
            </button>

            {isCustomScanActive && (
              <button
                type="button"
                onClick={handleResetTemplate}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 text-xs rounded-xl transition flex items-center gap-1 border border-slate-700"
                title="Reset to Master Template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Template</span>
              </button>
            )}

            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm hover:scale-[1.02]"
                title="Save Edits to Patient Directory"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Save Changes</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-600 text-white font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              title="Print on Letterhead"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              <span>Print A4 Letterhead</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTHORITATIVE PRESCRIPTION TEMPLATE WITH EXACT THREE OVERLAID FIELDS       */}
      {/* ========================================================================= */}
      <div 
        id="printable-prescription-pad"
        className="prescription-pad-container bg-white text-slate-900 border border-slate-300 shadow-xl rounded-none sm:rounded-xl mx-auto w-full max-w-[840px] font-sans relative overflow-hidden select-text print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none"
        style={{ aspectRatio: '1 / 1.414' }}
      >
        {/* Exact Approved Prescription Template Image as Background */}
        <img 
          src={templateImage} 
          alt="Anujay Dental Clinic Prescription Letterhead" 
          className="w-full h-full object-contain pointer-events-none select-none block"
          style={{ width: '100%', height: '100%' }}
        />

        {/* OVERLAY FIELD 1: PATIENT NAME */}
        <div 
          className="absolute flex items-end pb-0.5"
          style={{
            top: PRESCRIPTION_COORDINATES.patientName.css.top,
            left: PRESCRIPTION_COORDINATES.patientName.css.left,
            width: PRESCRIPTION_COORDINATES.patientName.css.width,
            height: PRESCRIPTION_COORDINATES.patientName.css.height
          }}
        >
          {isEditable ? (
            <input
              type="text"
              value={patientName}
              onChange={(e) => handleFieldChange('patientName', e.target.value)}
              placeholder="Patient Full Name"
              className="w-full h-full bg-transparent text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-[15px] px-1 focus:outline-none focus:bg-blue-50/70 rounded"
              title="1. Patient Full Name"
            />
          ) : (
            <span className="w-full text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-[15px] px-1 truncate">
              {patientName}
            </span>
          )}
        </div>

        {/* OVERLAY FIELD 2: DATE */}
        <div 
          className="absolute flex items-end pb-0.5"
          style={{
            top: PRESCRIPTION_COORDINATES.date.css.top,
            left: PRESCRIPTION_COORDINATES.date.css.left,
            width: PRESCRIPTION_COORDINATES.date.css.width,
            height: PRESCRIPTION_COORDINATES.date.css.height
          }}
        >
          {isEditable ? (
            <input
              type="text"
              value={date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full h-full bg-transparent text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-[14px] px-1 focus:outline-none focus:bg-blue-50/70 rounded"
              title="2. Date"
            />
          ) : (
            <span className="w-full text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-[14px] px-1 truncate">
              {date}
            </span>
          )}
        </div>

        {/* OVERLAY FIELD 3: AGE / SEX (Single Combined Field) */}
        <div 
          className="absolute flex items-end pb-0.5"
          style={{
            top: PRESCRIPTION_COORDINATES.ageSex.css.top,
            left: PRESCRIPTION_COORDINATES.ageSex.css.left,
            width: PRESCRIPTION_COORDINATES.ageSex.css.width,
            height: PRESCRIPTION_COORDINATES.ageSex.css.height
          }}
        >
          {isEditable ? (
            <input
              type="text"
              value={ageSex}
              onChange={(e) => handleFieldChange('ageSex', e.target.value)}
              placeholder="e.g. 28 / M"
              className="w-full h-full bg-transparent text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-[14px] px-1 focus:outline-none focus:bg-blue-50/70 rounded"
              title="3. Age / Sex"
            />
          ) : (
            <span className="w-full text-slate-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-[14px] px-1 truncate">
              {ageSex}
            </span>
          )}
        </div>
      </div>

      {/* Sticky Save Toolbar while editing prescription */}
      {isEditable && onSave && (
        <div className="print:hidden sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 p-3 bg-white/95 backdrop-blur-md border border-emerald-200 shadow-xl rounded-2xl max-w-[840px] mx-auto animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-900">
              Prescription Edit Mode Active
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              • 3 editable fields: Name, Date, Age/Sex
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-200"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
