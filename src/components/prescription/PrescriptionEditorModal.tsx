import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  User, 
  Sparkles,
  RotateCcw,
  History,
  FileText,
  Clock,
  Phone,
  FolderCheck,
  Search,
  ExternalLink,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { Prescription, Patient } from '../../types/clinic';
import { PrescriptionPad } from './PrescriptionPad';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { SaveButton } from '../common/SaveButton';

interface PrescriptionEditorModalProps {
  initialPrescription?: Partial<Prescription> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (prescription: Omit<Prescription, 'id' | 'createdAt'>) => Promise<{ success: boolean; id?: string }>;
}

export const PrescriptionEditorModal: React.FC<PrescriptionEditorModalProps> = ({
  initialPrescription,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const { patients, prescriptions } = useClinic();
  const { staffUser, role } = useAuth();
  const isStaff = role === 'staff';

  // The 3 Editable Fields for the Prescription Template + Optional Patient Contact
  const [patientName, setPatientName] = useState(initialPrescription?.patientName || '');
  const [patientPhone, setPatientPhone] = useState(
    initialPrescription?.patientPhone && initialPrescription.patientPhone !== 'N/A' 
      ? initialPrescription.patientPhone 
      : ''
  );
  const [date, setDate] = useState(
    initialPrescription?.date || new Date().toISOString().slice(0, 10)
  );
  const initialAgeSex = initialPrescription?.ageSex || (
    initialPrescription?.age && initialPrescription?.gender
      ? `${initialPrescription.age} / ${initialPrescription.gender.charAt(0).toUpperCase()}`
      : (initialPrescription?.age ? `${initialPrescription.age} Y` : '')
  ) || '';
  const [ageSex, setAgeSex] = useState(initialAgeSex);

  // Visit Notes for clinical record keeping associated with this patient
  const [visitNotes, setVisitNotes] = useState(initialPrescription?.visitNotes || '');

  // Generated state to display entered values in preview
  const [previewData, setPreviewData] = useState<{
    patientName: string;
    date: string;
    ageSex: string;
  }>({
    patientName: initialPrescription?.patientName || '',
    date: initialPrescription?.date || new Date().toISOString().slice(0, 10),
    ageSex: initialAgeSex
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [directorySavedNotice, setDirectorySavedNotice] = useState<string | null>(null);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  // Matched Patient & Previous Visit Notes History
  const matchedPatient = patients.find(
    p => (initialPrescription?.patientId && p.id === initialPrescription.patientId) ||
         (p.name && patientName.trim() && p.name.trim().toLowerCase() === patientName.trim().toLowerCase()) ||
         (patientPhone.trim().length >= 10 && p.phone && p.phone.replace(/\D/g, '').slice(-10) === patientPhone.replace(/\D/g, '').slice(-10))
  );

  const matchedPrescriptions = prescriptions.filter(
    p => (matchedPatient?.id && p.patientId === matchedPatient.id) ||
         (p.patientName && patientName.trim() && p.patientName.trim().toLowerCase() === patientName.trim().toLowerCase())
  );

  // Filtered Directory Suggestions as user types
  const patientSuggestions = patients.filter(p => {
    if (!patientName.trim()) return false;
    const q = patientName.trim().toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
  }).slice(0, 5);

  // Quick Age/Sex helper chips
  const quickAgeSexPresets = [
    '22 / M', '25 / F', '28 / M', '32 / F', '35 / M', '42 / F', '50 / M', '65 / F'
  ];

  const handleSelectExistingPatient = (p: Patient) => {
    setPatientName(p.name);
    if (p.phone && p.phone !== 'N/A') setPatientPhone(p.phone);
    const calculatedAgeSex = `${p.age || 30} / ${p.gender ? p.gender.charAt(0).toUpperCase() : 'M'}`;
    setAgeSex(calculatedAgeSex);
    setPreviewData({
      patientName: p.name,
      date,
      ageSex: calculatedAgeSex
    });
    setShowPatientSuggestions(false);
  };

  const handleClear = () => {
    setPatientName('');
    setPatientPhone('');
    setDate(new Date().toISOString().slice(0, 10));
    setAgeSex('');
    setVisitNotes('');
    setPreviewData({
      patientName: '',
      date: new Date().toISOString().slice(0, 10),
      ageSex: ''
    });
  };

  const buildPayload = (): Omit<Prescription, 'id' | 'createdAt'> => {
    const finalName = (previewData.patientName || patientName).trim();
    const finalAgeSex = (previewData.ageSex || ageSex).trim() || '—';
    const finalDate = previewData.date || date || new Date().toISOString().slice(0, 10);

    let parsedAge = 30;
    let parsedGender = 'Male';
    const parts = finalAgeSex.split('/');
    if (parts.length >= 1) {
      const numMatch = parts[0].match(/\d+/);
      if (numMatch) parsedAge = parseInt(numMatch[0], 10);
    }
    if (parts.length >= 2) {
      const g = parts[1].trim().toLowerCase();
      if (g.startsWith('f')) parsedGender = 'Female';
      else if (g.startsWith('m')) parsedGender = 'Male';
      else parsedGender = 'Other';
    }

    return {
      patientId: matchedPatient?.id,
      patientName: finalName,
      patientPhone: patientPhone.trim() || matchedPatient?.phone || 'N/A',
      date: finalDate,
      age: parsedAge,
      gender: parsedGender,
      ageSex: finalAgeSex,
      serviceTaken: 'Dental Consultation',
      chiefComplaint: '',
      onExamination: '',
      pastMedicalHistory: '',
      treatmentAdvised: '',
      resultUpdate: `Prescription issued for ${finalName}`,
      prescriptionText: '',
      visitNotes: visitNotes.trim(),
      doctorName: 'Dr. Anup Kumar Hota',
      doctorDegree: 'DENTAL SURGEON (BDS)',
      doctorRegNo: 'CGDC/G/26/4876',
      isPublishedToPortal: isStaff ? false : true,
      createdByRole: isStaff ? 'staff' : 'admin',
      createdByName: isStaff ? (staffUser?.name || 'Clinic Staff') : 'Doctor Anujay (Admin)',
      approvalStatus: isStaff ? 'pending_approval' : 'approved',
      approvedBy: isStaff ? undefined : 'Doctor Anujay (Admin)',
      approvedAt: isStaff ? undefined : new Date().toISOString()
    };
  };

  // AUTOMATIC STORE IN PATIENT DIRECTORY
  const autoSaveToDirectory = async (): Promise<boolean> => {
    const pName = (previewData.patientName || patientName).trim();
    if (!pName) return false;

    try {
      const payload = buildPayload();
      const res = await onSave(payload);
      if (res.success) {
        setDirectorySavedNotice(`✓ Automatically stored in Patient Directory (${pName})`);
        setTimeout(() => setDirectorySavedNotice(null), 4000);
        return true;
      }
    } catch (err) {
      console.warn("Auto save prescription to directory failed:", err);
    }
    return false;
  };

  const handleGeneratePrescription = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPreviewData({
      patientName,
      date,
      ageSex
    });
    if (patientName.trim()) {
      setIsSaving(true);
      await autoSaveToDirectory();
      setIsSaving(false);
    }
  };

  const handleSubmit = async (): Promise<boolean> => {
    const pName = (previewData.patientName || patientName).trim();
    if (!pName) {
      setValidationError('Please enter a patient name first.');
      return false;
    }
    setValidationError(null);
    try {
      const ok = await autoSaveToDirectory();
      if (ok) {
        setTimeout(() => onClose(), 1200);
        return true;
      } else {
        setValidationError('Failed to save prescription. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
      setValidationError('Failed to save prescription. Please try again.');
      return false;
    }
  };

  const handleDownloadPdf = async () => {
    const pName = (previewData.patientName || patientName).trim();
    if (pName) {
      await autoSaveToDirectory();
    }
    const payload = buildPayload();
    generatePrescriptionPDF({
      ...payload,
      createdAt: new Date().toISOString()
    } as Prescription);
  };

  const handlePrint = async () => {
    const pName = (previewData.patientName || patientName).trim();
    if (pName) {
      await autoSaveToDirectory();
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-[#00205b] text-white flex items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-serif font-black text-lg">
              ℞
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-none text-white">
                ANUJAY DENTAL CLINIC — Official Prescription Generator
              </h2>
              <p className="text-[11px] text-sky-200 mt-0.5 flex items-center gap-1.5">
                <span>Exact fixed letterhead template</span>
                <span>•</span>
                <span className="font-semibold text-emerald-300">Auto-saves to Patient Directory</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SaveButton
              type="button"
              onSave={handleSubmit}
              defaultText={initialPrescription?.id ? 'Save Changes' : 'Save Prescription'}
              savingText="Saving..."
              successText="Saved Successfully"
              errorText="Save Failed. Please Try Again"
              className="px-3.5 py-1.5 font-bold text-xs shadow-md"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-xl transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Directory Auto-Save Notice Toast */}
        {directorySavedNotice && (
          <div className="bg-emerald-600 text-white px-5 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{directorySavedNotice}</span>
            </div>
            <span className="text-[11px] text-emerald-100 bg-emerald-700/60 px-2 py-0.5 rounded">
              Synced with Patients Directory
            </span>
          </div>
        )}

        {/* Modal Body: Left Inputs + Right Fixed Prescription Pad */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ================= VIEW A: PATIENT DETAILS FORM ================= */}
            <div className="lg:col-span-4 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm sticky top-0">
              
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Patient Details & Directory Entry</span>
                </h3>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition"
                  title="Clear all fields"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Fields</span>
                </button>
              </div>

              <form onSubmit={handleGeneratePrescription} className="space-y-4">
                
                {isStaff && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-xs text-amber-900 shadow-2xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px] text-amber-950">Staff Prescription Workflow</p>
                      <p className="text-[10.5px] text-amber-800 mt-0.5">
                        This prescription is recorded in clinic dossier only and is <strong>hidden from Patient Portal</strong> until approved by Doctor/Admin.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1. Patient Name with Live Directory Search */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      1. Patient Name *
                    </label>
                    {matchedPatient && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <FolderCheck className="w-3 h-3 text-emerald-600" />
                        Directory Patient
                      </span>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    required
                    value={patientName}
                    onFocus={() => setShowPatientSuggestions(true)}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      setPreviewData(prev => ({ ...prev, patientName: e.target.value }));
                      setShowPatientSuggestions(true);
                    }}
                    placeholder="e.g. Ramesh Chandra Verma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none shadow-xs"
                  />

                  {/* Autocomplete suggestion drop-down */}
                  {showPatientSuggestions && patientSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Select from Patient Directory</span>
                        <button 
                          type="button" 
                          onClick={() => setShowPatientSuggestions(false)}
                          className="text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      {patientSuggestions.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectExistingPatient(p)}
                          className="w-full text-left px-3.5 py-2 hover:bg-blue-50/80 transition flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {p.phone && p.phone !== 'N/A' ? `+91 ${p.phone} • ` : ''}
                              {p.age ? `${p.age} Yrs` : ''} {p.gender ? `• ${p.gender}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                            {p.totalVisits || 1} visits
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 mt-1">
                    Overlays the “Name :” line on prescription and registers patient in directory
                  </p>
                </div>

                {/* 2. Patient Mobile Contact in Front (For Patient Portal Reports & Directory) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. Mobile / Phone No. *</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Patient Portal Access
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="e.g. 8839475969"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used for patient to view their reports in Patient Portal • Will NOT appear on prescription letterhead
                  </p>
                </div>

                {/* 3. Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    3. Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setPreviewData(prev => ({ ...prev, date: e.target.value }));
                    }}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Overlays the “Date :” line on the prescription
                  </p>
                </div>

                {/* 4. Age / Sex */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    4. Age / Sex *
                  </label>
                  <input
                    type="text"
                    required
                    value={ageSex}
                    onChange={(e) => {
                      setAgeSex(e.target.value);
                      setPreviewData(prev => ({ ...prev, ageSex: e.target.value }));
                    }}
                    placeholder="e.g. 28 / M or 35 Y / Female"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-blue-900 focus:bg-white focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Overlays the “Age / Sex :” line on the prescription
                  </p>
                  
                  {/* Quick Age/Sex helper pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quickAgeSexPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAgeSex(preset);
                          setPreviewData(prev => ({ ...prev, ageSex: preset }));
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition font-bold ${
                          ageSex === preset 
                            ? 'bg-[#00205b] text-white border-[#00205b] shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visit Notes / Clinical Record Keeping for this Patient */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Clinic Visit Notes / Clinical Record</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Clinic History
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="e.g. Scaling performed, advised soft diet, review in 7 days..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none resize-none shadow-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Stored directly into the permanent Patient Directory for <strong>{patientName || 'this patient'}</strong>
                  </p>

                  {/* Previous Visit History associated with patient's name */}
                  {(matchedPatient?.notes || matchedPrescriptions.length > 0) && (
                    <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-amber-600" />
                          <span>Previous Visit Records ({matchedPrescriptions.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          {showHistoryPanel ? 'Hide' : 'View History'}
                        </button>
                      </div>

                      {showHistoryPanel && (
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto text-[11px]">
                          {matchedPatient?.notes && (
                            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                              <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Patient Record Notes:
                              </p>
                              <p className="whitespace-pre-line text-xs font-normal">{matchedPatient.notes}</p>
                            </div>
                          )}
                          {matchedPrescriptions.map((pr, idx) => (
                            <div key={pr.id || idx} className="p-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-0.5">
                                <span>Visit: {pr.date || '—'}</span>
                                <span className="text-blue-600">{pr.ageSex || '—'}</span>
                              </div>
                              {pr.visitNotes ? (
                                <p className="text-xs text-slate-800 font-medium">{pr.visitNotes}</p>
                              ) : (
                                <p className="text-[11px] text-slate-500 italic">{pr.serviceTaken || 'Prescription issued'}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Automatic Storing Notice Banner */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">
                    <strong>Automatic Directory Storage:</strong> Generating, printing, downloading, or saving this prescription automatically archives this patient's details into the <strong>Patients Directory</strong>.
                  </span>
                </div>

                {/* Generate Prescription & Clear Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSaving ? 'Storing in Directory...' : 'Generate Prescription & Store in Directory'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Clear Fields</span>
                  </button>
                </div>
              </form>

              {/* Action Buttons: Print, PDF, Save */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                {validationError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2.5 bg-[#00205b] hover:bg-[#001740] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-sky-300" />
                  <span>Print Prescription (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-2 bg-sky-700 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF & Auto-Store</span>
                </button>

                <SaveButton
                  type="button"
                  onSave={handleSubmit}
                  defaultText={initialPrescription?.id ? 'Save Changes & Update Directory' : 'Save Prescription & Store in Directory'}
                  savingText="Saving..."
                  successText="Saved Successfully"
                  errorText="Save Failed. Please Try Again"
                  className="w-full py-2 font-bold text-xs shadow-sm"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <p className="font-bold">Official Document Standard:</p>
                <p className="text-slate-600 mt-0.5">
                  The clinic header, doctor details, services, dual language declaration, and footer remain permanent. Only patient details are overlaid.
                </p>
              </div>
            </div>

            {/* ================= VIEW B: PRESCRIPTION PREVIEW ================= */}
            <div className="lg:col-span-8">
              <PrescriptionPad
                prescription={{
                  patientName: previewData.patientName,
                  date: previewData.date,
                  ageSex: previewData.ageSex,
                  doctorName: 'Dr. Anup Kumar Hota',
                  doctorDegree: 'DENTAL SURGEON (BDS)',
                  doctorRegNo: 'CGDC/G/26/4876'
                }}
                isEditable={true}
                onChange={(updated) => {
                  if (updated.patientName !== undefined) {
                    setPatientName(updated.patientName);
                    setPreviewData(prev => ({ ...prev, patientName: updated.patientName || '' }));
                  }
                  if (updated.date !== undefined) {
                    setDate(updated.date);
                    setPreviewData(prev => ({ ...prev, date: updated.date || '' }));
                  }
                  if (updated.ageSex !== undefined) {
                    setAgeSex(updated.ageSex);
                    setPreviewData(prev => ({ ...prev, ageSex: updated.ageSex || '' }));
                  }
                }}
                onPrint={handlePrint}
                onDownloadPdf={handleDownloadPdf}
                onSave={handleSubmit}
                showActions={true}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
