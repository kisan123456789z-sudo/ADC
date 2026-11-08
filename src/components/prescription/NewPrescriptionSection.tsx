import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Save, 
  RotateCcw, 
  Search, 
  Upload, 
  CheckCircle2, 
  Trash2, 
  Printer, 
  Calendar, 
  User, 
  UserCheck, 
  Eye, 
  Sparkles,
  RefreshCw,
  Phone,
  Image as ImageIcon,
  Check,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Prescription, Patient } from '../../types/clinic';
import { SaveButton } from '../common/SaveButton';
import { 
  PRESCRIPTION_COORDINATES, 
  getActivePrescriptionTemplate, 
  saveActivePrescriptionTemplate, 
  resetActivePrescriptionTemplate,
  getActivePrescriptionBanner,
  saveActivePrescriptionBanner,
  resetActivePrescriptionBanner,
  getPrescriptionDoctorPreset,
  setPrescriptionDoctorPreset
} from '../../utils/prescriptionTemplate';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import { compressImageFile } from '../../utils/fileStorageHelper';
import { ConfirmModal } from '../common/ConfirmModal';

export const NewPrescriptionSection: React.FC = () => {
  const { 
    patients, 
    prescriptions, 
    addPrescription, 
    updatePrescription, 
    deletePrescription,
    settings
  } = useClinic();
  const { staffUser, role } = useAuth();
  const isStaff = role === 'staff';
  const isAdmin = role === 'admin';

  // Portal publication state: Default to false for staff (so it directly NOT added to patient portal), true for admin
  const [publishDirectlyToPortal, setPublishDirectlyToPortal] = useState<boolean>(!isStaff);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'published'>('all');

  // EDITABLE PRESCRIPTION FIELDS & OPTIONS (Name, Date, Age/Sex strictly on letterhead)
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ageSex, setAgeSex] = useState('');

  // Internal patient record linkage
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
  const [internalPatientPhone, setInternalPatientPhone] = useState('');

  // Currently editing prescription ID (if editing existing)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);

  // Replaced Header Banner Image state (supports custom uploaded banner image)
  const [customBanner, setCustomBanner] = useState<string | null>(() => getActivePrescriptionBanner());
  const [doctorPreset, setDoctorPreset] = useState<'anup_hota' | 'anujay_sharma'>(() => getPrescriptionDoctorPreset());
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Template image state
  const [templateImage, setTemplateImage] = useState<string>(() => getActivePrescriptionTemplate());
  const [isCustomTemplateActive, setIsCustomTemplateActive] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('anujay_custom_prescription_template');
    } catch {
      return false;
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync template changes when banner or full template changes
  useEffect(() => {
    const handleTemplateChanged = () => {
      setCustomBanner(getActivePrescriptionBanner());
      setDoctorPreset(getPrescriptionDoctorPreset());
      setTemplateImage(getActivePrescriptionTemplate());
    };
    window.addEventListener('prescription_template_changed', handleTemplateChanged);
    return () => {
      window.removeEventListener('prescription_template_changed', handleTemplateChanged);
    };
  }, []);

  // Feedback states
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const showErrorMsg = (msg: string) => {
    setSaveErrorMsg(msg);
    setTimeout(() => setSaveErrorMsg(null), 4000);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Confirm delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    prescriptionId: string;
    patientName: string;
  }>({
    isOpen: false,
    prescriptionId: '',
    patientName: ''
  });

  // Handle banner image upload (replaces the header banner for both preview and downloaded PDF)
  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showErrorMsg('Please upload a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }
    try {
      const { dataUrl } = await compressImageFile(file, { maxWidth: 1000, maxHeight: 400, quality: 0.82, maxSizeBytes: 80 * 1024 });
      if (dataUrl) {
        saveActivePrescriptionBanner(dataUrl);
        setCustomBanner(dataUrl);
        setTemplateImage(getActivePrescriptionTemplate(null, dataUrl));
        setSaveSuccessMsg('Prescription header banner replaced successfully for both preview and downloaded PDF!');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch {
      showErrorMsg('Failed to process banner image.');
    }
  };

  // Reset banner back to default letterhead
  const handleResetBanner = () => {
    resetActivePrescriptionBanner();
    setCustomBanner(null);
    setTemplateImage(getActivePrescriptionTemplate());
    setSaveSuccessMsg('Prescription banner restored to default letterhead.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Switch doctor letterhead preset
  const handleSelectDoctorPreset = (preset: 'anup_hota' | 'anujay_sharma') => {
    setPrescriptionDoctorPreset(preset);
    setDoctorPreset(preset);
    if (customBanner) {
      resetActivePrescriptionBanner();
      setCustomBanner(null);
    }
    setTemplateImage(getActivePrescriptionTemplate());
    setSaveSuccessMsg(`Letterhead banner updated to ${preset === 'anujay_sharma' ? 'Dr. Anujay Sharma (Chief Surgeon)' : 'Dr. Anup Kumar Hota (Letterhead)'}`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Handle whole-template image upload
  const handleTemplateUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showErrorMsg('Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }
    try {
      const { dataUrl } = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1600, quality: 0.8, maxSizeBytes: 150 * 1024 });
      if (dataUrl) {
        saveActivePrescriptionTemplate(dataUrl);
        setTemplateImage(dataUrl);
        setIsCustomTemplateActive(true);
        setSaveSuccessMsg('Original prescription image loaded successfully as the active template!');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      }
    } catch {
      showErrorMsg('Failed to process template image.');
    }
  };

  // Reset to default template
  const handleResetTemplate = () => {
    resetActivePrescriptionTemplate();
    setTemplateImage(getActivePrescriptionTemplate());
    setIsCustomTemplateActive(false);
    setSaveSuccessMsg('Prescription template reset to standard official letterhead.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Quick select an existing patient (autofills Name, Phone, and Age/Sex)
  const handleSelectPatient = (patient: Patient) => {
    setPatientName(patient.name);
    setSelectedPatientId(patient.id);
    const pPhone = patient.phone && patient.phone !== 'N/A' ? patient.phone : '';
    setPhone(pPhone);
    setInternalPatientPhone(pPhone);
    if (patient.age && patient.gender) {
      setAgeSex(`${patient.age} / ${patient.gender.charAt(0).toUpperCase()}`);
    } else if (patient.age) {
      setAgeSex(`${patient.age} Yrs`);
    }
  };

  // Clear form
  const handleClearForm = () => {
    setPatientName('');
    setPhone('');
    setDate(new Date().toISOString().slice(0, 10));
    setAgeSex('');
    setSelectedPatientId(undefined);
    setInternalPatientPhone('');
    setEditingPrescriptionId(null);
  };

  // Save prescription to database
  const handleSave = async (downloadPdfAfter = false) => {
    if (!patientName.trim()) {
      showErrorMsg('Please enter Patient Name.');
      return;
    }

    // Parse age and gender for database records if possible
    let parsedAge = 30;
    let parsedGender = 'Other';
    const parts = ageSex.split('/');
    if (parts.length >= 1) {
      const numMatch = parts[0].match(/\d+/);
      if (numMatch) parsedAge = parseInt(numMatch[0], 10);
    }
    if (parts.length >= 2) {
      const g = parts[1].trim().toLowerCase();
      if (g.startsWith('f')) parsedGender = 'Female';
      else if (g.startsWith('m')) parsedGender = 'Male';
    }

    const cleanPhone = phone.trim() ? phone.trim().replace(/\D/g, '').slice(-10) : '';
    const isAnujay = doctorPreset === 'anujay_sharma';
    const activeDoctorName = isAnujay ? (settings.doctorName || 'Dr. Anujay Sharma') : 'Dr. Anup Kumar Hota';
    const activeDoctorDegree = isAnujay ? (settings.doctorDegree || 'CHIEF DENTAL SURGEON (BDS, MDS)') : 'DENTAL SURGEON (BDS)';
    const activeDoctorReg = isAnujay ? (settings.doctorRegNo || 'DC-58921 / DCI') : 'CGDC/G/26/4876';

    const isStaffAction = isStaff;
    const shouldPublish = isStaffAction ? false : publishDirectlyToPortal;

    const payload: Omit<Prescription, 'id' | 'createdAt'> = {
      patientId: selectedPatientId,
      patientName: patientName.trim(),
      patientPhone: cleanPhone || phone.trim() || 'N/A',
      showPhoneOnPrescription: false,
      date: date || new Date().toISOString().slice(0, 10),
      age: parsedAge,
      gender: parsedGender,
      ageSex: ageSex.trim() || '—',
      customBannerUrl: customBanner || undefined,
      serviceTaken: 'Dental Consultation',
      chiefComplaint: '',
      onExamination: '',
      pastMedicalHistory: '',
      treatmentAdvised: '',
      resultUpdate: `Prescription issued for ${patientName.trim()}`,
      prescriptionText: '',
      medicinesList: [],
      doctorName: activeDoctorName,
      doctorDegree: activeDoctorDegree,
      doctorRegNo: activeDoctorReg,
      isPublishedToPortal: shouldPublish,
      createdByRole: isStaffAction ? 'staff' : 'admin',
      createdByName: isStaffAction ? (staffUser?.name || 'Clinic Staff') : 'Doctor Anujay (Admin)',
      approvalStatus: shouldPublish ? 'approved' : (isStaffAction ? 'pending_approval' : 'draft'),
      approvedBy: shouldPublish ? 'Doctor Anujay (Admin)' : undefined,
      approvedAt: shouldPublish ? new Date().toISOString() : undefined
    };

    let ok = false;
    if (editingPrescriptionId) {
      const success = await updatePrescription(editingPrescriptionId, payload);
      ok = Boolean(success);
      if (success) {
        setSaveSuccessMsg(
          shouldPublish 
            ? `Prescription updated & published to Patient Portal for "${patientName.trim()}".`
            : `Prescription updated for "${patientName.trim()}" (Stored in clinic records • Not published to patient portal).`
        );
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      }
    } else {
      const res = await addPrescription(payload);
      ok = Boolean(res && res.success);
      if (res.success) {
        setSaveSuccessMsg(
          shouldPublish 
            ? `Prescription saved & published to Patient Portal for "${patientName.trim()}".`
            : `Prescription saved to clinic records for "${patientName.trim()}" (Pending Doctor Approval • Not visible on patient portal).`
        );
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      }
    }

    if (downloadPdfAfter && ok) {
      handleDownloadPdf();
    }
    return ok;
  };

  // Download identical single-page PDF (matching the live preview and replaced banner exactly)
  const handleDownloadPdf = async () => {
    if (!patientName.trim()) {
      showErrorMsg('Please enter Patient Name before downloading PDF.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const isAnujay = doctorPreset === 'anujay_sharma';
      const prescObj: Prescription = {
        patientName: patientName.trim(),
        patientPhone: phone.trim() || 'N/A',
        showPhoneOnPrescription: false,
        date: date || new Date().toISOString().slice(0, 10),
        ageSex: ageSex.trim() || '—',
        customBannerUrl: customBanner || undefined,
        doctorName: isAnujay ? (settings.doctorName || 'Dr. Anujay Sharma') : 'Dr. Anup Kumar Hota',
        doctorDegree: isAnujay ? (settings.doctorDegree || 'CHIEF DENTAL SURGEON (BDS, MDS)') : 'DENTAL SURGEON (BDS)',
        doctorRegNo: isAnujay ? (settings.doctorRegNo || 'DC-58921 / DCI') : 'CGDC/G/26/4876',
        createdAt: new Date().toISOString()
      };

      await generatePrescriptionPDF(
        prescObj, 
        isCustomTemplateActive ? templateImage : null, 
        { 
          customBannerUrl: customBanner || undefined
        }
      );
    } catch (err) {
      console.error('PDF error:', err);
      showErrorMsg('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Load an existing prescription into the editor
  const handleLoadPrescription = (p: Prescription) => {
    setPatientName(p.patientName);
    setDate(p.date || new Date().toISOString().slice(0, 10));
    setAgeSex(p.ageSex || (p.age ? `${p.age} / ${p.gender?.[0] || 'M'}` : ''));
    setPhone(p.patientPhone && p.patientPhone !== 'N/A' ? p.patientPhone : '');
    setSelectedPatientId(p.patientId);
    setInternalPatientPhone(p.patientPhone || '');
    setEditingPrescriptionId(p.id || null);
    if (p.customBannerUrl) {
      setCustomBanner(p.customBannerUrl);
      setTemplateImage(getActivePrescriptionTemplate(null, p.customBannerUrl));
    }
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Pending approvals count (prescriptions not on patient portal)
  const pendingApprovalsCount = prescriptions.filter(
    p => p.isPublishedToPortal === false || p.approvalStatus === 'pending_approval' || p.approvalStatus === 'draft'
  ).length;

  // Filtered prescription history
  const filteredPrescriptions = prescriptions.filter(p => {
    const isPending = p.isPublishedToPortal === false || p.approvalStatus === 'pending_approval' || p.approvalStatus === 'draft';
    if (historyFilter === 'pending' && !isPending) return false;
    if (historyFilter === 'published' && isPending) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.patientName.toLowerCase().includes(q) ||
      (p.patientPhone && p.patientPhone.includes(q)) ||
      p.date.includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-100 text-blue-900 rounded-2xl">
              <FileText className="w-6 h-6 text-blue-700" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Official Clinic Prescription Section
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic AnuJay Dental Clinic Letterhead • Patient Details & Phone No. Option • 100% Identical Preview & PDF
              </p>
            </div>
          </div>
        </div>

        {/* Prescription Template & Banner Replacement Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Hidden file input for custom banner image */}
          <input
            type="file"
            ref={bannerFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleBannerUpload(file);
            }}
          />
          {/* Hidden file input for full prescription template scan */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleTemplateUpload(file);
            }}
          />

          {/* Primary Action: Replace Header Banner */}
          <button
            type="button"
            onClick={() => bannerFileInputRef.current?.click()}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
            title="Upload custom image to replace prescription top banner (applies to preview & downloaded PDF)"
          >
            <Upload className="w-4 h-4 text-sky-200" />
            <span>{customBanner ? 'Change Prescription Banner' : 'Replace Prescription Banner'}</span>
          </button>

          {/* Permanent Official Doctor Banner */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Permanent Banner: Dr. Anup Kumar Hota</span>
          </div>

          {/* Reset Banner Button (if custom banner active) */}
          {customBanner && (
            <button
              type="button"
              onClick={handleResetBanner}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold rounded-xl transition flex items-center gap-1 border border-slate-200"
              title="Restore standard letterhead banner"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Banner</span>
            </button>
          )}

          {/* Full Page scan upload toggle */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-xl transition flex items-center gap-1 border border-slate-200"
            title="Upload full scanned prescription page"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Full Scan</span>
          </button>

          {isCustomTemplateActive && (
            <button
              type="button"
              onClick={handleResetTemplate}
              className="px-2.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-medium rounded-xl transition text-[11px]"
              title="Reset full scan back to letterhead"
            >
              Reset Scan
            </button>
          )}

          {/* Banner status pill */}
          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
            customBanner 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : isCustomTemplateActive 
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {customBanner 
              ? '✓ Replaced Banner Active (Preview & PDF)' 
              : isCustomTemplateActive 
                ? '✓ Full Scan Active'
                : `Letterhead: ${doctorPreset === 'anujay_sharma' ? 'Dr. Anujay' : 'Dr. Anup Hota'}`
            }
          </span>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Save Error Alert */}
      {saveErrorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-3 text-red-900 text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Editor + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT COLUMN: 3 EDITABLE FIELDS FORM ================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Prescription Details</span>
              </h3>
              {editingPrescriptionId && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  Editing Past Record
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Enter patient details and phone number. Toggle whether to display Phone No. on the official letterhead or keep for Patient Portal access.
            </p>

            {/* Quick patient lookup helper */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-600">
                Fast Patient Autofill (Optional)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search registered patient by name or phone..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().trim();
                      if (val.length >= 2) {
                        const match = patients.find(p => 
                          p.name.toLowerCase().includes(val) || 
                          (p.phone && p.phone.includes(val))
                        );
                        if (match) handleSelectPatient(match);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* FIELD 1: PATIENT NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Patient Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* PATIENT PHONE (INTERNAL LOOKUP ONLY – EXCLUDED FROM PRESCRIPTION) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Patient Phone</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Internal Lookup)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Records only • Hidden from Letterhead
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPhone(val);
                      const clean = val.replace(/\D/g, '').slice(-10);
                      if (clean.length === 10) {
                        const match = patients.find(p => p.phone && p.phone.replace(/\D/g, '').slice(-10) === clean);
                        if (match && !patientName) {
                          handleSelectPatient(match);
                        }
                      }
                    }}
                    placeholder="e.g. 9876543210 (internal record only)"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1 pl-1">
                  Used internally for patient history. Excluded from main prescription letterhead and PDF.
                </p>
              </div>

              {/* FIELD 3: DATE */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  3. Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* FIELD 4: AGE / SEX (Single Combined Field) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    4. Age / Sex <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-semibold">Single combined field</span>
                </div>
                <input
                  type="text"
                  required
                  value={ageSex}
                  onChange={(e) => setAgeSex(e.target.value)}
                  placeholder="e.g. 28 / M or 35 / F"
                  className="w-full px-4 py-2.5 bg-white border-2 border-blue-400 rounded-xl text-xs font-black text-blue-950 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />

                {/* Quick Age/Sex chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-400">Presets:</span>
                  {['22 / F', '28 / M', '35 / F', '42 / M', '50 / M', '65 / F'].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAgeSex(chip)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                        ageSex === chip 
                          ? 'bg-blue-600 text-white font-bold border-blue-600' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* PORTAL PUBLICATION CONTROLS & STAFF SAFETY NOTICE */}
            {/* PORTAL PUBLICATION & APPROVAL STATUS CONTROLS */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block sm:inline">Prescription Approval & Portal Status:</span>
                  <span className="text-[11px] text-slate-500 block sm:inline sm:ml-2">
                    Controls whether this prescription appears on the Patient's online portal
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 font-bold cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-blue-300 shadow-2xs self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={publishDirectlyToPortal}
                  onChange={(e) => setPublishDirectlyToPortal(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-700 focus:ring-blue-600 cursor-pointer"
                />
                <span className={publishDirectlyToPortal ? 'text-emerald-700' : 'text-amber-800'}>
                  {publishDirectlyToPortal ? '✓ Approved & Live on Portal' : 'Pending Approval (Internal Record Only)'}
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SaveButton
                  type="button"
                  onSave={() => handleSave(false)}
                  defaultText={editingPrescriptionId ? 'Update Record' : 'Save Prescription'}
                  savingText="Saving..."
                  successText="Saved Successfully"
                  errorText="Save Failed. Please Try Again"
                  className="w-full py-3 text-xs font-bold shadow-sm"
                />

                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdf}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  {isGeneratingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-sky-400" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="text-slate-500 hover:text-slate-800 font-semibold underline text-[11px]"
                >
                  Clear Fields / New
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="text-blue-700 hover:text-blue-900 font-bold text-[11px] flex items-center gap-1"
                >
                  <span>Save & Download Together</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ================= RIGHT COLUMN: LIVE IDENTICAL PREVIEW ================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Live Template Preview</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Matches the downloaded PDF pixel-for-pixel at A4 portrait aspect ratio (1 : 1.414).
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition"
                title="Download single-page PDF letterhead"
              >
                <Download className="w-3.5 h-3.5 text-blue-700" />
                <span>PDF Export</span>
              </button>
            </div>

            {/* A4 Proportion Canvas Frame */}
            <div className="max-w-[620px] mx-auto bg-slate-100 p-2 sm:p-4 rounded-2xl border border-slate-300 shadow-inner">
              <div 
                className="relative w-full bg-white shadow-xl overflow-hidden select-none border border-slate-200"
                style={{ aspectRatio: '1 / 1.414' }}
              >
                {/* 1. Original Prescription Image Background (with Replaced Banner) */}
                <img
                  src={templateImage}
                  alt="AnuJay Dental Clinic Prescription Letterhead"
                  className="w-full h-full object-contain pointer-events-none select-none block"
                  style={{ width: '100%', height: '100%' }}
                />

                {/* Direct Banner Action Overlay on Preview */}
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="absolute top-1.5 right-1.5 z-20 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md text-[10px] font-bold shadow-md backdrop-blur-xs flex items-center gap-1.5 transition opacity-80 hover:opacity-100 cursor-pointer"
                  title="Click to replace prescription header banner (both preview & PDF)"
                >
                  <Upload className="w-3 h-3 text-sky-400" />
                  <span>{customBanner ? 'Change Banner' : 'Replace Banner'}</span>
                </button>

                {/* 2. OVERLAY FIELD 1: PATIENT NAME */}
                <div
                  className="absolute flex items-end pb-0.5 overflow-hidden"
                  style={{
                    top: PRESCRIPTION_COORDINATES.patientName.css.top,
                    left: PRESCRIPTION_COORDINATES.patientName.css.left,
                    width: PRESCRIPTION_COORDINATES.patientName.css.width,
                    height: PRESCRIPTION_COORDINATES.patientName.css.height
                  }}
                >
                  <span className="w-full text-slate-950 font-bold text-[10px] sm:text-xs md:text-sm lg:text-[14px] px-1 truncate leading-none">
                    {patientName || <span className="text-slate-300 italic font-normal">Patient Name</span>}
                  </span>
                </div>

                {/* 3. OVERLAY FIELD 2: DATE */}
                <div
                  className="absolute flex items-end pb-0.5 overflow-hidden"
                  style={{
                    top: PRESCRIPTION_COORDINATES.date.css.top,
                    left: PRESCRIPTION_COORDINATES.date.css.left,
                    width: PRESCRIPTION_COORDINATES.date.css.width,
                    height: PRESCRIPTION_COORDINATES.date.css.height
                  }}
                >
                  <span className="w-full text-slate-950 font-bold text-[9px] sm:text-[11px] md:text-xs lg:text-[13px] px-1 truncate leading-none">
                    {date}
                  </span>
                </div>

                {/* 4. OVERLAY FIELD 3: AGE / SEX */}
                <div
                  className="absolute flex items-end pb-0.5 overflow-hidden"
                  style={{
                    top: PRESCRIPTION_COORDINATES.ageSex.css.top,
                    left: PRESCRIPTION_COORDINATES.ageSex.css.left,
                    width: PRESCRIPTION_COORDINATES.ageSex.css.width,
                    height: PRESCRIPTION_COORDINATES.ageSex.css.height
                  }}
                >
                  <span className="w-full text-slate-950 font-bold text-[9px] sm:text-[11px] md:text-xs lg:text-[13px] px-1 truncate leading-none">
                    {ageSex || <span className="text-slate-300 italic font-normal">Age/Sex</span>}
                  </span>
                </div>

              </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 italic">
              Exact single-page A4 letterhead • All original doctor, clinic, logo, timing, services, declaration, and footer elements preserved.
            </p>
          </div>
        </div>

      </div>

      {/* ================= SAVED PRESCRIPTIONS HISTORY TABLE ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Saved Prescriptions History ({prescriptions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Stored securely in clinic database. Staff prescriptions require approval before appearing on Patient Portal.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setHistoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              historyFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({prescriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              historyFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Pending Approval ({pendingApprovalsCount})</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setHistoryFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              historyFilter === 'published'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Published on Patient Portal ({prescriptions.length - pendingApprovalsCount})</span>
          </button>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            <p className="font-semibold text-slate-700">No prescriptions found in this view.</p>
            <p className="mt-1">Fill the fields above and click "Save Prescription".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Age / Sex</th>
                  <th className="py-3 px-4">Patient Phone</th>
                  <th className="py-3 px-4">Portal Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.map((p, idx) => {
                  const isPending = p.isPublishedToPortal === false || p.approvalStatus === 'pending_approval' || p.approvalStatus === 'draft';
                  return (
                    <tr key={p.id ? `${p.id}-${idx}` : `pr-${idx}`} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium">{p.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.patientName}</td>
                      <td className="py-3 px-4 font-semibold text-blue-900">
                        {p.ageSex || (p.age ? `${p.age} / ${p.gender?.[0] || 'M'}` : '—')}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.patientPhone && p.patientPhone !== 'N/A' ? (
                          <span className="font-mono text-slate-600">+91 {p.patientPhone}</span>
                        ) : (
                          <span className="text-slate-400 italic">In-Clinic</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isPending ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              <EyeOff className="w-3 h-3 text-amber-600" />
                              <span>Hidden from Patient Portal</span>
                            </span>
                            {p.createdByName && (
                              <p className="text-[10px] text-slate-400">By {p.createdByName} ({p.createdByRole || 'staff'})</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>In Patient Portal</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Approval & Publish to Patient Portal Button */}
                        {isPending && p.id && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updatePrescription(p.id!, {
                                isPublishedToPortal: true,
                                approvalStatus: 'approved',
                                approvedBy: isAdmin ? 'Doctor Anujay Sharma (Admin)' : (staffUser?.name ? `${staffUser.name} (Staff)` : 'Doctor / Authorized Staff'),
                                approvedAt: new Date().toISOString()
                              });
                              setSaveSuccessMsg(`✓ Prescription for "${p.patientName}" approved & published to Patient Portal!`);
                              setTimeout(() => setSaveSuccessMsg(null), 4000);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Approve prescription and publish to Patient Portal"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Publish</span>
                          </button>
                        )}

                        {/* Unpublish / Hide from Patient Portal Button */}
                        {!isPending && p.id && (
                          <button
                            type="button"
                            onClick={async () => {
                              await updatePrescription(p.id!, {
                                isPublishedToPortal: false,
                                approvalStatus: 'draft'
                              });
                              setSaveSuccessMsg(`Prescription for "${p.patientName}" unpublished from Patient Portal.`);
                              setTimeout(() => setSaveSuccessMsg(null), 4000);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                            title="Hide prescription from Patient Portal"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleLoadPrescription(p)}
                          className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                          title="Load into Live Letterhead Pad"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-700" />
                          <span>Load on Pad</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => generatePrescriptionPDF(p, isCustomTemplateActive ? templateImage : null, { 
                            customBannerUrl: p.customBannerUrl ?? customBanner ?? undefined
                          })}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                          title="Download identical PDF with replaced banner"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (p.id) {
                              setDeleteConfirm({
                                isOpen: true,
                                prescriptionId: p.id,
                                patientName: p.patientName
                              });
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition inline-flex items-center"
                          title="Delete Prescription"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Prescription Record?"
        message={`Are you sure you want to delete the prescription for "${deleteConfirm.patientName}"? This action cannot be undone.`}
        confirmText="Confirm Delete"
        onConfirm={async () => {
          if (deleteConfirm.prescriptionId) {
            await deletePrescription(deleteConfirm.prescriptionId);
            setSaveSuccessMsg(`Prescription for ${deleteConfirm.patientName} was deleted.`);
            setTimeout(() => setSaveSuccessMsg(null), 3500);
          }
          setDeleteConfirm({ isOpen: false, prescriptionId: '', patientName: '' });
        }}
        onClose={() => setDeleteConfirm({ isOpen: false, prescriptionId: '', patientName: '' })}
      />

    </div>
  );
};
