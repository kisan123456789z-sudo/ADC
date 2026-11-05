import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  DollarSign, 
  Download, 
  Eye, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  User, 
  Phone, 
  Receipt, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X, 
  Filter, 
  ArrowLeft,
  Sparkles,
  Smartphone,
  CreditCard,
  Banknote,
  Printer,
  ChevronRight,
  HelpCircle,
  FileBadge,
  Pill,
  Stethoscope,
  Activity,
  ArrowUpDown,
  MessageCircle,
  Megaphone
} from 'lucide-react';
import { PatientNoticeBoard } from './notices/PatientNoticeBoard';
import { LegalInformationSection } from '../public/LegalInformationSection';
import { useClinic } from '../../context/ClinicContext';
import { 
  Patient, 
  PatientDocument, 
  Invoice, 
  PatientPayment, 
  Prescription,
  DocumentCategory 
} from '../../types/clinic';
import { generatePrescriptionPDF } from '../../utils/pdfGenerator';
import { PrescriptionPad } from '../prescription/PrescriptionPad';

interface PatientDashboardProps {
  patient: Patient;
  onLogout: () => void;
  initialTab?: 'reports' | 'prescriptions' | 'xrays' | 'invoices' | 'payments' | 'updates';
  activeTabOverride?: 'reports' | 'prescriptions' | 'xrays' | 'invoices' | 'payments' | 'updates';
  onTabChange?: (tab: 'reports' | 'prescriptions' | 'xrays' | 'invoices' | 'payments' | 'updates') => void;
  openWhatsAppPrefSignal?: number;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  onLogout,
  initialTab = 'reports',
  activeTabOverride,
  onTabChange,
  openWhatsAppPrefSignal
}) => {
  const {
    documents,
    invoices,
    patientPayments,
    prescriptions,
    settings,
    updatePatient
  } = useClinic();

  // WhatsApp Notification Preferences state
  const [isWhatsAppPrefModalOpen, setIsWhatsAppPrefModalOpen] = useState(false);
  const [isOptedOut, setIsOptedOut] = useState(patient.whatsappOptOut === true);
  const [prefSaveNotice, setPrefSaveNotice] = useState('');

  // Active section tab
  const [activeTab, setActiveTabState] = useState<'reports' | 'prescriptions' | 'xrays' | 'invoices' | 'payments' | 'updates'>(activeTabOverride || initialTab);

  const setActiveTab = (tab: 'reports' | 'prescriptions' | 'xrays' | 'invoices' | 'payments' | 'updates') => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab);
  };

  useEffect(() => {
    if (activeTabOverride && activeTabOverride !== activeTab) {
      setActiveTabState(activeTabOverride);
    }
  }, [activeTabOverride]);

  useEffect(() => {
    if (openWhatsAppPrefSignal && openWhatsAppPrefSignal > 0) {
      setIsWhatsAppPrefModalOpen(true);
    }
  }, [openWhatsAppPrefSignal]);

  // Preview modals
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [previewRx, setPreviewRx] = useState<Prescription | null>(null);
  const [selectedRxDetails, setSelectedRxDetails] = useState<Prescription | null>(null);
  const [reprintRx, setReprintRx] = useState<Prescription | null>(null);
  const [reprintViewMode, setReprintViewMode] = useState<'letterhead' | 'pad'>('letterhead');
  const [reprintDoc, setReprintDoc] = useState<PatientDocument | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filters & Search
  const [reportSearch, setReportSearch] = useState('');
  const [reportCategory, setReportCategory] = useState<string>('All');
  const [rxSearch, setRxSearch] = useState('');
  const [rxSortOrder, setRxSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Helper to parse dates for reliable chronological comparison
  const parseDateToTimestamp = (dStr?: string): number => {
    if (!dStr) return 0;
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(d.getTime())) return d.getTime();
      }
    }
    const t = new Date(dStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Helper for human-friendly date display
  const formatDisplayDate = (dStr?: string): string => {
    if (!dStr) return 'Date not specified';
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dStr;
  };

  // Helper to extract Day number and Month/Year for chronological badges
  const getDayAndMonth = (dStr?: string): { day: string; monthYear: string } => {
    if (!dStr) return { day: '--', monthYear: 'VISIT' };
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(d.getTime())) {
          return {
            day: d.getDate().toString().padStart(2, '0'),
            monthYear: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()
          };
        }
      }
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return {
        day: d.getDate().toString().padStart(2, '0'),
        monthYear: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()
      };
    }
    return { day: 'RX', monthYear: dStr.slice(0, 7) };
  };

  // Patient documents that are published
  const patientPublishedDocs = useMemo(() => {
    return documents.filter(d => d.patientId === patient.id && d.isPublished);
  }, [documents, patient.id]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    let list = [...patientPublishedDocs];
    if (reportCategory !== 'All') {
      list = list.filter(d => d.category === reportCategory);
    }
    if (reportSearch.trim()) {
      const q = reportSearch.trim().toLowerCase();
      list = list.filter(d => 
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => (b.documentDate || b.createdAt || '').localeCompare(a.documentDate || a.createdAt || ''));
    return list;
  }, [patientPublishedDocs, reportCategory, reportSearch]);

  // X-Rays
  const patientXrays = useMemo(() => {
    return patientPublishedDocs.filter(d => d.category === 'X-Ray / Dental Imaging');
  }, [patientPublishedDocs]);

  // Prescriptions: match by patientId OR patient phone/name with Chronological Ordering & Search
  const patientPrescriptions = useMemo(() => {
    const cleanPatPhone = patient.phone.replace(/\D/g, '').slice(-10);
    const patNameLower = patient.name.trim().toLowerCase();
    
    // Match prescriptions from collection (Staff-issued prescriptions awaiting approval are NOT added to patient portal)
    const fromRxCol = prescriptions.filter(rx => {
      // Must not be an unapproved or unpublished prescription (e.g. prepared by staff)
      if (rx.isPublishedToPortal === false || rx.approvalStatus === 'pending_approval' || rx.approvalStatus === 'draft') {
        return false;
      }
      if (rx.patientId && rx.patientId === patient.id) return true;
      if (rx.patientPhone && rx.patientPhone.replace(/\D/g, '').slice(-10) === cleanPatPhone) return true;
      if (rx.patientName && rx.patientName.trim().toLowerCase() === patNameLower) return true;
      return false;
    });

    // Chronologically sort prescriptions
    fromRxCol.sort((a, b) => {
      const timeA = parseDateToTimestamp(a.date || a.createdAt);
      const timeB = parseDateToTimestamp(b.date || b.createdAt);
      return rxSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    // Filter by user search query
    let filteredRx = fromRxCol;
    if (rxSearch.trim()) {
      const q = rxSearch.trim().toLowerCase();
      filteredRx = fromRxCol.filter(rx => 
        (rx.serviceTaken && rx.serviceTaken.toLowerCase().includes(q)) ||
        (rx.chiefComplaint && rx.chiefComplaint.toLowerCase().includes(q)) ||
        (rx.treatmentAdvised && rx.treatmentAdvised.toLowerCase().includes(q)) ||
        (rx.doctorName && rx.doctorName.toLowerCase().includes(q)) ||
        (rx.date && rx.date.toLowerCase().includes(q)) ||
        (rx.medicinesList && rx.medicinesList.some(m => 
          m.name.toLowerCase().includes(q) || 
          m.instructions.toLowerCase().includes(q) ||
          m.frequency.toLowerCase().includes(q)
        ))
      );
    }

    // Match document prescriptions (scanned papers/PDFs)
    const fromDocsCol = patientPublishedDocs.filter(d => d.category === 'Dental Prescription');
    fromDocsCol.sort((a, b) => {
      const timeA = parseDateToTimestamp(a.documentDate || a.createdAt);
      const timeB = parseDateToTimestamp(b.documentDate || b.createdAt);
      return rxSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    const totalCount = fromRxCol.length + fromDocsCol.length;
    return { fromRxCol, filteredRx, fromDocsCol, totalCount };
  }, [prescriptions, patientPublishedDocs, patient, rxSortOrder, rxSearch]);

  // Invoices for this patient
  const patientInvoices = useMemo(() => {
    return invoices.filter(inv => inv.patientId === patient.id);
  }, [invoices, patient.id]);

  // Payments for this patient
  const patientPaymentsList = useMemo(() => {
    return patientPayments.filter(p => p.patientId === patient.id);
  }, [patientPayments, patient.id]);

  // Financial summary
  const financials = useMemo(() => {
    const totalBilled = patientInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalPaid = patientInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const pendingBalance = Math.max(0, totalBilled - totalPaid);
    return { totalBilled, totalPaid, pendingBalance };
  }, [patientInvoices]);

  // Check if document was uploaded recently (within last 7 days)
  const isRecentDoc = (createdAt?: string) => {
    if (!createdAt) return false;
    const diffDays = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      {/* Patient Portal Header */}
      <header className="bg-gradient-to-r from-[#00205b] to-[#003882] text-white shadow-md sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-sky-300 shrink-0">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                  {settings.clinicName || 'Anujay Dental Clinic'}
                </span>
                <span className="text-[10px] bg-sky-500/30 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Patient Portal
                </span>
              </div>
              <p className="text-xs text-sky-200/80 truncate">
                Welcome back, <strong className="text-white">{patient.name}</strong> • Mobile: {patient.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsWhatsAppPrefModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">WhatsApp Alerts</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 sm:px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
            >
              <LogOut className="w-3.5 h-3.5 text-sky-300" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>

        {/* Portal Sub-Header Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-sky-800/60 text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'reports'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-sky-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Reports ({patientPublishedDocs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'prescriptions'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-sky-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileBadge className="w-4 h-4" />
            <span>My Prescriptions ({patientPrescriptions.fromRxCol.length + patientPrescriptions.fromDocsCol.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('xrays')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'xrays'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-sky-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>My X-Rays ({patientXrays.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'invoices'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-sky-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>My Invoices ({patientInvoices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'payments'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-sky-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>My Payments ({patientPaymentsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'updates'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-sky-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-300" />
            <span>Clinic Updates</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Billed Amount
              </span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                ₹ {financials.totalBilled.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400">Total treatment charges</span>
            </div>
            <Receipt className="w-8 h-8 text-blue-500/40" />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Total Amount Paid
              </span>
              <span className="text-xl font-bold text-emerald-800 mt-1 block">
                ₹ {financials.totalPaid.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-600">Recorded receipts</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            financials.pendingBalance > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">
                Pending Balance
              </span>
              <span className="text-xl font-bold mt-1 block">
                ₹ {financials.pendingBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] opacity-75">
                {financials.pendingBalance > 0 ? 'Payable at clinic desk' : 'Zero balance due'}
              </span>
            </div>
            <DollarSign className="w-8 h-8 opacity-40" />
          </div>

          <div 
            onClick={() => setActiveTab('prescriptions')}
            className="p-4 bg-purple-50 hover:bg-purple-100/70 rounded-2xl border border-purple-200/80 flex items-center justify-between cursor-pointer transition group"
          >
            <div>
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                Past Prescriptions
              </span>
              <span className="text-xl font-bold text-purple-900 mt-1 block">
                {patientPrescriptions.totalCount} {patientPrescriptions.totalCount === 1 ? 'Record' : 'Records'}
              </span>
              <span className="text-[11px] text-purple-600 group-hover:underline flex items-center gap-1 font-semibold">
                <span>View Timeline & Re-print</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <FileBadge className="w-8 h-8 text-purple-600/40 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* ================= TAB A: MY REPORTS ================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Quick Chronological Prescription Summary Banner */}
            {patientPrescriptions.filteredRx.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border border-purple-200/90 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                      <FileBadge className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          Past Prescriptions & Medication Records
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          {patientPrescriptions.totalCount} {patientPrescriptions.totalCount === 1 ? 'Record' : 'Records'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chronological record of clinical prescriptions issued for your dental consultations.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('prescriptions')}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto cursor-pointer active:scale-95"
                  >
                    <span>View Full Chronological Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Latest Prescription Quick Action Card */}
                {(() => {
                  const latestRx = patientPrescriptions.filteredRx[0];
                  return (
                    <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-[#00205b]">
                            {latestRx.serviceTaken || 'Dental Consultation'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                            LATEST VISIT
                          </span>
                          <span className="text-xs text-slate-400">
                            • Date: <strong className="text-slate-800">{formatDisplayDate(latestRx.date || latestRx.createdAt)}</strong>
                          </span>
                        </div>
                        {latestRx.chiefComplaint && (
                          <p className="text-xs text-slate-600 line-clamp-1">
                            <strong className="text-slate-700">Complaint:</strong> {latestRx.chiefComplaint}
                          </p>
                        )}
                        {latestRx.medicinesList && latestRx.medicinesList.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold pt-0.5">
                            <Pill className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {latestRx.medicinesList.length} medicines prescribed: {latestRx.medicinesList.map(m => m.name).slice(0, 3).join(', ')}{latestRx.medicinesList.length > 3 ? '...' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedRxDetails(latestRx)}
                          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReprintRx(latestRx)}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition cursor-pointer active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5 text-purple-200" />
                          <span>Re-print</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Published Reports & Records</h2>
                <p className="text-xs text-slate-500">Official medical, imaging, and laboratory documents shared with your account.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map(docItem => {
                  const recent = isRecentDoc(docItem.createdAt);
                  const isImage = docItem.fileType?.startsWith('image/') || docItem.fileName?.endsWith('.svg') || docItem.fileName?.endsWith('.png') || docItem.fileName?.endsWith('.jpg');
                  return (
                    <div
                      key={docItem.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {docItem.category}
                          </span>
                          {recent && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                          {docItem.title}
                        </h3>
                        {docItem.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {docItem.description}
                          </p>
                        )}

                        {/* Thumbnail */}
                        <div 
                          onClick={() => setPreviewDoc(docItem)}
                          className="mt-3 h-28 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-300 transition"
                        >
                          {isImage ? (
                            <img
                              src={docItem.fileUrl}
                              alt={docItem.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400">
                              <FileText className="w-8 h-8 text-blue-500" />
                              <span className="text-[10px] font-semibold text-slate-600">{docItem.fileName}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Report Date:</span>
                          <span className="font-semibold text-slate-700">{docItem.documentDate}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(docItem)}
                          className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={docItem.fileUrl}
                          download={docItem.fileName || 'report'}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No reports available</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When Dr. Anujay Sharma or the clinic staff publishes medical records, lab reports, or diagnostics for your profile, they will appear here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB B: MY PRESCRIPTIONS (CHRONOLOGICAL TIMELINE) ================= */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            {/* Header & Search/Sort Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <FileBadge className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Chronological Prescription History</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Timeline of doctor visits, diagnoses, and medical schedules issued by {settings.doctorName || 'Dr. Anujay Sharma'}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search medicines, complaint, date..."
                    value={rxSearch}
                    onChange={(e) => setRxSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  {rxSearch && (
                    <button
                      onClick={() => setRxSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Order Toggle */}
                <button
                  type="button"
                  onClick={() => setRxSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Toggle Chronological Sorting"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>{rxSortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                </button>
              </div>
            </div>

            {/* Prescriptions Chronological Timeline List */}
            {patientPrescriptions.filteredRx.length > 0 || (patientPrescriptions.fromDocsCol.length > 0 && !rxSearch) ? (
              <div className="relative pl-4 sm:pl-6 space-y-6 before:absolute before:left-[19px] sm:before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-blue-100">
                {/* Regular Prescriptions from Database */}
                {patientPrescriptions.filteredRx.map((rx, idx) => {
                  const { day, monthYear } = getDayAndMonth(rx.date || rx.createdAt);
                  const isLatest = idx === 0 && rxSortOrder === 'newest';

                  return (
                    <div key={rx.id || idx} className="relative flex items-start gap-3 sm:gap-5 group">
                      {/* Timeline Node Badge */}
                      <div className="relative z-10 shrink-0 flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white border-2 border-blue-500 shadow-md text-center p-1 group-hover:scale-105 transition-transform">
                        <span className="text-base sm:text-lg font-black text-blue-900 leading-none">
                          {day}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 tracking-tight mt-0.5 uppercase leading-none">
                          {monthYear}
                        </span>
                      </div>

                      {/* Main Card */}
                      <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4">
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-[#00205b] tracking-wide">
                                {rx.serviceTaken || 'Dental Consultation & Treatment'}
                              </span>
                              {isLatest && (
                                <span className="text-[10px] font-black px-2 py-0.5 bg-blue-600 text-white rounded-full shadow-2xs">
                                  LATEST VISIT
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                Visit #{patientPrescriptions.fromRxCol.length - idx}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                                {rx.doctorName || settings.doctorName || 'Dr. Anujay Sharma'}
                              </span>
                              <span>•</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                Reg: {rx.doctorRegNo || settings.doctorRegNo || 'DC-58921'}
                              </span>
                            </div>
                          </div>

                          {/* Quick Date display */}
                          <div className="text-xs text-slate-400 font-medium sm:text-right">
                            <span>Visit Date: <strong className="text-slate-800">{formatDisplayDate(rx.date || rx.createdAt)}</strong></span>
                          </div>
                        </div>

                        {/* Clinical Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {rx.chiefComplaint && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Chief Complaint (C / C)
                              </span>
                              <p className="font-semibold text-slate-800 mt-0.5 line-clamp-2">
                                {rx.chiefComplaint}
                              </p>
                            </div>
                          )}

                          {rx.treatmentAdvised && (
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                                Treatment Advised
                              </span>
                              <p className="font-semibold text-blue-950 mt-0.5 line-clamp-2">
                                {rx.treatmentAdvised}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Prescribed Medicines Pills */}
                        {rx.medicinesList && rx.medicinesList.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Prescribed Medicines ({rx.medicinesList.length})</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {rx.medicinesList.slice(0, 4).map((med, mIdx) => (
                                <div 
                                  key={mIdx} 
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 rounded-xl text-xs font-semibold"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  <span>{med.name}</span>
                                  {med.dosage && <span className="text-[10px] text-emerald-700 bg-white/80 px-1 rounded">({med.dosage})</span>}
                                  {med.frequency && (
                                    <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                                      {med.frequency}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {rx.medicinesList.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRxDetails(rx)}
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition"
                                >
                                  +{rx.medicinesList.length - 4} more medicines...
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Bar: View Details + Re-print + Download PDF */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-400">
                            Valid verified clinical record
                          </span>

                          <div className="flex items-center gap-2">
                            {/* 1. View Details Action */}
                            <button
                              type="button"
                              onClick={() => setSelectedRxDetails(rx)}
                              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>View Details</span>
                            </button>

                            {/* 2. Re-print Action */}
                            <button
                              type="button"
                              onClick={() => setReprintRx(rx)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95"
                            >
                              <Printer className="w-4 h-4 text-purple-200" />
                              <span>Re-print</span>
                            </button>

                            {/* 3. Download Official PDF */}
                            <button
                              type="button"
                              onClick={() => generatePrescriptionPDF(rx)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                              title="Download PDF copy"
                            >
                              <Download className="w-4 h-4 text-slate-600" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Uploaded Physical Prescription Documents */}
                {!rxSearch && patientPrescriptions.fromDocsCol.map((docItem, dIdx) => (
                  <div key={docItem.id || dIdx} className="relative flex items-start gap-3 sm:gap-5 group">
                    <div className="relative z-10 shrink-0 flex flex-col items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-white border-2 border-emerald-500 shadow-md text-center p-1">
                      <FileBadge className="w-5 h-5 text-emerald-600" />
                      <span className="text-[9px] font-bold text-emerald-700 uppercase mt-0.5">DOC</span>
                    </div>

                    <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Prescription Document
                          </span>
                          <span className="text-xs text-slate-400">Date: {docItem.documentDate || 'Recorded'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base mt-1">{docItem.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{docItem.description || `Uploaded file on ${docItem.documentDate}`}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(docItem)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReprintDoc(docItem)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95"
                        >
                          <Printer className="w-4 h-4 text-purple-200" />
                          <span>Re-print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
                <FileBadge className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {rxSearch ? 'No prescriptions match your search' : 'No past prescriptions on record yet'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {rxSearch 
                      ? `We couldn't find any prescriptions matching "${rxSearch}". Please try a different search keyword.`
                      : `Official medical prescriptions issued by Dr. Anujay Sharma will appear here chronologically with medicine schedules and instructions.`}
                  </p>
                </div>
                {rxSearch && (
                  <button
                    type="button"
                    onClick={() => setRxSearch('')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB C: MY X-RAYS ================= */}
        {activeTab === 'xrays' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Dental X-Rays & Imaging</h2>
              <p className="text-xs text-slate-500">High-resolution digital RVG radiographs, bitewings, and panoramic scans.</p>
            </div>

            {patientXrays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientXrays.map(xray => (
                  <div
                    key={xray.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-white flex flex-col justify-between"
                  >
                    <div 
                      onClick={() => setPreviewDoc(xray)}
                      className="h-44 bg-black flex items-center justify-center cursor-pointer group relative overflow-hidden"
                    >
                      <img
                        src={xray.fileUrl}
                        alt={xray.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </span>
                        <span className="text-xs font-bold text-white">Click to Zoom</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-white text-sm line-clamp-1">{xray.title}</h3>
                      {xray.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{xray.description}</p>
                      )}
                      <div className="text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-800">
                        <span>Scan Date:</span>
                        <span className="text-slate-300 font-semibold">{xray.documentDate}</span>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(xray)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Zoom</span>
                        </button>
                        <a
                          href={xray.fileUrl}
                          download={xray.fileName}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No X-rays uploaded</h3>
                <p className="text-xs text-slate-500 mt-1">Diagnostic radiographs and digital sensor scans taken at the clinic will be stored here.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB D: MY INVOICES ================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Clinical Invoices</h2>
              <p className="text-xs text-slate-500">Transparent statement of dental procedures, charges, discounts, and payment balances.</p>
            </div>

            {patientInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientInvoices.map(inv => (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        #{inv.invoiceNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentStatus === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{inv.treatmentDescription}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Date: {inv.invoiceDate}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Charges:</span>
                        <span>₹ {inv.totalCharges?.toLocaleString('en-IN')}</span>
                      </div>
                      {inv.discount > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span>Discount Applied:</span>
                          <span>- ₹ {inv.discount?.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                        <span>Net Final Amount:</span>
                        <span>₹ {inv.finalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Amount Paid:</span>
                        <span>₹ {inv.amountPaid?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                        <span>Remaining Balance:</span>
                        <span>₹ {inv.outstandingBalance?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPrintInvoice(inv)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View / Print Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No invoices recorded</h3>
                <p className="text-xs text-slate-500 mt-1">Official bills and receipts will appear here after clinic visits.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB E: MY PAYMENTS ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Payment History</h2>
              <p className="text-xs text-slate-500">Complete receipt ledger of all transactions received against your treatments.</p>
            </div>

            {patientPaymentsList.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Payment Date</th>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4 text-right">Amount Paid</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference / Receipt</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientPaymentsList.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {pay.paymentDate}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          #{pay.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                          ₹ {pay.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            {pay.paymentMethod === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                            {pay.paymentMethod === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-sky-600" />}
                            {pay.paymentMethod === 'Card' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                            <span>{pay.paymentMethod}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {pay.referenceNumber || 'Counter Receipt'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {pay.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No payment records yet</h3>
                <p className="text-xs text-slate-500 mt-1">Receipts for payments made via Cash, UPI, or Card will be displayed here.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= CLINIC UPDATES & NOTICE BOARD TAB ================= */}
        {activeTab === 'updates' && (
          <PatientNoticeBoard />
        )}

        {/* Visually highlighted Medical & Privacy Disclaimer */}
        <LegalInformationSection isCompact={true} className="mt-10" />
      </main>

      {/* ================= MODAL: DOCUMENT PREVIEW ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30">
                  {previewDoc.category}
                </span>
                <h3 className="font-bold text-sm text-white mt-1">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 bg-slate-800 text-white rounded-lg text-xs"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  className="p-1.5 bg-slate-800 text-white rounded-lg text-xs"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold px-3 ml-2 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    setZoomLevel(1);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[400px]">
              {previewDoc.fileType?.startsWith('image/') || previewDoc.fileUrl?.startsWith('data:image/') ? (
                <div 
                  className="transition duration-150 origin-center flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[65vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[65vh] rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRESCRIPTION LETTERHEAD PREVIEW ================= */}
      {previewRx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Doctor Prescription Letterhead</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generatePrescriptionPDF(previewRx)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setPreviewRx(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
              <PrescriptionPad
                prescription={previewRx}
                isEditable={false}
                onDownloadPdf={() => generatePrescriptionPDF(previewRx)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE INVOICE ================= */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#00205b]">ANUJAY DENTAL CLINIC</h2>
                <p className="text-xs font-semibold text-sky-700">Official Patient Treatment Receipt</p>
                <p className="text-[11px] text-slate-500 mt-1">Shop 12-14, Health Plaza, New Delhi • Tel: +91 98765 43210</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-blue-700 block">#{printInvoice.invoiceNumber}</span>
                <span className="text-[11px] text-slate-500 block">Date: {printInvoice.invoiceDate}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient</span>
                <span className="font-bold text-slate-900 text-sm block">{printInvoice.patientName}</span>
                <span className="text-slate-600 block">Phone: {printInvoice.patientPhone || patient.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Attending Surgeon</span>
                <span className="font-bold text-slate-900 block">Dr. Anujay Sharma</span>
                <span className="text-slate-500 text-[11px] block">B.D.S., M.D.S. (Chief Surgeon)</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Treatment / Procedure</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">{printInvoice.treatmentDescription}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹ {printInvoice.totalCharges?.toLocaleString('en-IN')}</td>
                  </tr>
                  {printInvoice.discount > 0 && (
                    <tr className="bg-rose-50/40 text-rose-700">
                      <td className="py-2 px-4">Special Clinic Discount</td>
                      <td className="py-2 px-4 text-right font-bold">- ₹ {printInvoice.discount?.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td className="py-2 px-4 text-slate-700">Net Final Amount:</td>
                    <td className="py-2 px-4 text-right text-slate-900">₹ {printInvoice.finalAmount?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-emerald-700">Total Paid:</td>
                    <td className="py-2 px-4 text-right text-emerald-700">₹ {printInvoice.amountPaid?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-900 text-sm">
                    <td className="py-2.5 px-4 text-slate-900 font-extrabold">OUTSTANDING BALANCE:</td>
                    <td className={`py-2.5 px-4 text-right font-extrabold ${
                      printInvoice.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      ₹ {printInvoice.outstandingBalance?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
              <div className="text-[11px] text-slate-500 max-w-sm">
                <p>• Thank you for visiting Anujay Dental Clinic.</p>
                <p>• Valid computer-generated clinic receipt.</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-400 w-36 mb-1" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Authorized Signatory
                </span>
              </div>
            </div>

            {/* Actions for modal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setPrintInvoice(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#00205b] hover:bg-[#001740] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: PRESCRIPTION FULL CLINICAL DETAILS ================= */}
      {selectedRxDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#00205b] to-[#003882] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-sky-300">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-white">Prescription Details</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      Verified Clinical Record
                    </span>
                  </div>
                  <p className="text-xs text-sky-200/80 mt-0.5">
                    Visit Date: {formatDisplayDate(selectedRxDetails.date || selectedRxDetails.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRxDetails(null)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
              {/* Doctor & Clinic Info Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {selectedRxDetails.doctorName || settings.doctorName || 'Dr. Anujay Sharma'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedRxDetails.doctorDegree || settings.doctorDegree || 'B.D.S., M.D.S. (Oral & Maxillofacial Surgeon)'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Registration: {selectedRxDetails.doctorRegNo || settings.doctorRegNo || 'DC-58921'}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right text-xs text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span className="font-bold text-slate-700 block">{settings.clinicName || 'Anujay Dental Clinic'}</span>
                  <span>{settings.address || 'Shop 12-14, Health Plaza, New Delhi'}</span>
                </div>
              </div>

              {/* Patient & Consultation Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedRxDetails.patientName || patient.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedRxDetails.ageSex || (selectedRxDetails.age ? `${selectedRxDetails.age} Yrs / ${selectedRxDetails.gender || patient.gender || 'M'}` : `${patient.age} Yrs / ${patient.gender}`)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mobile No.</span>
                  <span className="font-mono text-slate-800 mt-0.5 block">{selectedRxDetails.patientPhone || patient.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Procedure / Service</span>
                  <span className="font-bold text-blue-900 mt-0.5 block truncate">
                    {selectedRxDetails.serviceTaken || 'Dental Consultation'}
                  </span>
                </div>
              </div>

              {/* Clinical Examination & Diagnoses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedRxDetails.chiefComplaint && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Chief Complaint (C / C)
                    </span>
                    <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedRxDetails.chiefComplaint}
                    </p>
                  </div>
                )}

                {selectedRxDetails.onExamination && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      On Examination (O / E)
                    </span>
                    <p className="font-semibold text-slate-900 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedRxDetails.onExamination}
                    </p>
                  </div>
                )}

                {selectedRxDetails.treatmentAdvised && (
                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Treatment Advised
                    </span>
                    <p className="font-semibold text-blue-950 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedRxDetails.treatmentAdvised}
                    </p>
                  </div>
                )}

                {selectedRxDetails.pastMedicalHistory && (
                  <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/70">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Past Medical History & Allergies (PMH)
                    </span>
                    <p className="font-semibold text-amber-950 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedRxDetails.pastMedicalHistory}
                    </p>
                  </div>
                )}
              </div>

              {/* Clinical Notes / Result Update if present */}
              {selectedRxDetails.resultUpdate && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Clinical Findings & Procedure Notes
                  </span>
                  <p className="font-medium text-slate-800 mt-1 whitespace-pre-line leading-relaxed">
                    {selectedRxDetails.resultUpdate}
                  </p>
                </div>
              )}

              {/* Prescribed Medications Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-serif font-black text-xs">
                      ℞
                    </span>
                    <span>Prescribed Medications ({selectedRxDetails.medicinesList?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Strictly adhere to doctor's dosage</span>
                </div>

                {selectedRxDetails.medicinesList && selectedRxDetails.medicinesList.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">#</th>
                          <th className="py-2.5 px-3">Medicine Name</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency / Schedule</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedRxDetails.medicinesList.map((med, mIdx) => (
                          <tr key={mIdx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-3 text-center font-bold text-slate-400">{mIdx + 1}</td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{med.name}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {med.dosage || '1 Tab'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                                {med.frequency || '1-0-1'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {med.duration || '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                                {med.instructions || 'After food'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    No specific pharmaceutical medicines listed for this visit.
                  </div>
                )}
              </div>

              {/* General Advice & Care Instructions */}
              {selectedRxDetails.prescriptionText && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/70 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    General Dietary & Oral Care Instructions
                  </span>
                  <p className="font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                    {selectedRxDetails.prescriptionText}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Issued by {selectedRxDetails.doctorName || settings.doctorName || 'Dr. Anujay Sharma'}
              </span>

              <div className="flex items-center gap-2">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedRxDetails(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => generatePrescriptionPDF(selectedRxDetails)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>Download PDF</span>
                </button>

                {/* Re-print Action */}
                <button
                  type="button"
                  onClick={() => {
                    setReprintRx(selectedRxDetails);
                    setSelectedRxDetails(null);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-purple-200" />
                  <span>Re-print Prescription</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRESCRIPTION RE-PRINT (LETTERHEAD & PAD VIEW) ================= */}
      {reprintRx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-backdrop">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print-modal-container">
            {/* Top Toolbar (Hidden when printing via print:hidden) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-serif font-black text-sm">
                  <Printer className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Re-print Prescription Letterhead
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: <strong className="text-white">{reprintRx.patientName}</strong> • Date: {formatDisplayDate(reprintRx.date || reprintRx.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Format Switcher */}
                <div className="bg-slate-800 p-0.5 rounded-xl flex items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setReprintViewMode('letterhead')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      reprintViewMode === 'letterhead'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Official Letterhead
                  </button>
                  <button
                    type="button"
                    onClick={() => setReprintViewMode('pad')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      reprintViewMode === 'pad'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Template Pad
                  </button>
                </div>

                {/* Download PDF button */}
                <button
                  type="button"
                  onClick={() => generatePrescriptionPDF(reprintRx)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* Print Now button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition cursor-pointer active:scale-95"
                  title="Print to printer"
                >
                  <Printer className="w-4 h-4 text-purple-200" />
                  <span>Print Now</span>
                </button>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setReprintRx(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
              {reprintViewMode === 'pad' ? (
                /* Pad Template View */
                <div className="bg-white p-2 rounded-2xl shadow-inner max-w-[840px] mx-auto print:shadow-none print:p-0">
                  <PrescriptionPad
                    prescription={reprintRx}
                    isEditable={false}
                    showActions={false}
                    onDownloadPdf={() => generatePrescriptionPDF(reprintRx)}
                  />
                </div>
              ) : (
                /* High-Fidelity Official Clinical Letterhead View */
                <div 
                  id="printable-rx-letterhead"
                  className="prescription-pad-container bg-white text-slate-900 border border-slate-300 shadow-xl rounded-2xl mx-auto w-full max-w-[800px] p-6 sm:p-10 font-sans select-text print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none relative"
                >
                  {/* Letterhead Header Banner */}
                  <div className="border-b-2 border-[#00205b] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-[#00205b] tracking-tight">
                        {settings.clinicName || 'ANUJAY DENTAL CLINIC'}
                      </h1>
                      <p className="text-xs font-bold text-sky-800 uppercase tracking-wider mt-0.5">
                        Multi-Speciality Dental Clinic & Implant Center
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-md">
                        {settings.address || 'Shop 12-14, Health Plaza, New Delhi'} • Tel: {settings.phone || '+91 98765 43210'}
                      </p>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <h2 className="text-base font-extrabold text-slate-900">
                        {reprintRx.doctorName || settings.doctorName || 'Dr. Anujay Sharma'}
                      </h2>
                      <p className="text-xs font-semibold text-blue-700">
                        {reprintRx.doctorDegree || settings.doctorDegree || 'B.D.S., M.D.S. (Chief Surgeon)'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Reg. No: {reprintRx.doctorRegNo || settings.doctorRegNo || 'DC-58921'}
                      </p>
                    </div>
                  </div>

                  {/* Watermark / Duplicate Notice */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-200 text-[11px]">
                    <span className="font-extrabold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 print:border-purple-300">
                      Official Clinical Prescription • Duplicate Copy / Re-print
                    </span>
                    <span className="text-slate-500 font-mono">
                      Rx Ref: #{reprintRx.id ? reprintRx.id.slice(0, 8).toUpperCase() : 'RX-' + Math.abs((reprintRx.patientName || '').length * 482)}
                    </span>
                  </div>

                  {/* Patient Details Bar */}
                  <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Patient Name</span>
                      <strong className="text-slate-900 block mt-0.5 text-sm">{reprintRx.patientName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Age / Sex</span>
                      <span className="text-slate-800 font-semibold block mt-0.5">
                        {reprintRx.ageSex || (reprintRx.age ? `${reprintRx.age} Yrs / ${reprintRx.gender || 'M'}` : '—')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
                      <span className="text-slate-900 font-bold block mt-0.5">
                        {formatDisplayDate(reprintRx.date || reprintRx.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact / Mobile</span>
                      <span className="text-slate-700 font-mono block mt-0.5">
                        {reprintRx.patientPhone || patient.phone || 'On Record'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Diagnosis & Procedure if recorded */}
                  {(reprintRx.serviceTaken || reprintRx.chiefComplaint || reprintRx.treatmentAdvised) && (
                    <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1.5">
                      {reprintRx.serviceTaken && (
                        <div className="flex gap-2">
                          <span className="font-bold text-blue-900 min-w-28">Procedure / Service:</span>
                          <span className="font-semibold text-slate-800">{reprintRx.serviceTaken}</span>
                        </div>
                      )}
                      {reprintRx.chiefComplaint && (
                        <div className="flex gap-2">
                          <span className="font-bold text-slate-700 min-w-28">Chief Complaint (C/C):</span>
                          <span className="text-slate-800">{reprintRx.chiefComplaint}</span>
                        </div>
                      )}
                      {reprintRx.treatmentAdvised && (
                        <div className="flex gap-2">
                          <span className="font-bold text-blue-800 min-w-28">Treatment Advised:</span>
                          <span className="text-slate-800 font-medium">{reprintRx.treatmentAdvised}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Classical Rx Heading */}
                  <div className="flex items-center gap-2 mb-3 mt-4">
                    <span className="font-serif font-black text-2xl text-[#00205b]">℞</span>
                    <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                      Medication Schedule
                    </span>
                  </div>

                  {/* Prescribed Medications Table */}
                  {reprintRx.medicinesList && reprintRx.medicinesList.length > 0 ? (
                    <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                          <tr>
                            <th className="py-2.5 px-3 w-8 text-center">#</th>
                            <th className="py-2.5 px-3">Medicine & Strength</th>
                            <th className="py-2.5 px-3">Dosage</th>
                            <th className="py-2.5 px-3">Frequency / Schedule</th>
                            <th className="py-2.5 px-3">Duration</th>
                            <th className="py-2.5 px-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {reprintRx.medicinesList.map((med, mIdx) => (
                            <tr key={mIdx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 text-center font-bold text-slate-400">{mIdx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{med.name}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">{med.dosage || '1 Tab'}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{med.frequency}</td>
                              <td className="py-2.5 px-3 text-slate-700">{med.duration || '—'}</td>
                              <td className="py-2.5 px-3 text-slate-700">{med.instructions || 'After food'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs text-slate-500 italic">
                      No specific oral medications prescribed for this session. Clinical advice applies as noted.
                    </div>
                  )}

                  {/* Doctor's Advice & Dietary / Oral Hygiene Instructions */}
                  {reprintRx.prescriptionText && (
                    <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Doctor's Instructions & Care Advice
                      </span>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                        {reprintRx.prescriptionText}
                      </p>
                    </div>
                  )}

                  {/* Letterhead Sign-off & Signature Area */}
                  <div className="pt-8 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6 text-xs">
                    <div className="text-[11px] text-slate-500 max-w-sm space-y-1">
                      <p className="font-semibold text-slate-700">• Valid clinical prescription issued by licensed dental practitioner.</p>
                      <p>• In case of emergency or unexpected acute symptoms, contact clinic desk immediately.</p>
                      <p className="text-[10px] text-slate-400">Re-printed from verified patient electronic records at {new Date().toLocaleDateString('en-IN')}.</p>
                    </div>

                    <div className="text-center sm:text-right min-w-44">
                      <div className="h-12 border-b border-slate-400 w-44 mx-auto sm:ml-auto mb-1 flex items-end justify-center sm:justify-end pb-1">
                        <span className="font-serif italic font-bold text-blue-900 text-sm opacity-80">
                          {reprintRx.doctorName || settings.doctorName || 'Dr. Anujay Sharma'}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {reprintRx.doctorName || settings.doctorName || 'Dr. Anujay Sharma'}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        Authorized Dental Surgeon
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOADED PRESCRIPTION DOCUMENT RE-PRINT ================= */}
      {reprintDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print-modal-backdrop">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print-modal-container">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div>
                <h3 className="font-bold text-sm text-white">Re-print Prescription Document</h3>
                <p className="text-xs text-slate-400">{reprintDoc.title} • Date: {reprintDoc.documentDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-purple-200" />
                  <span>Print Document</span>
                </button>
                <a
                  href={reprintDoc.fileUrl}
                  download={reprintDoc.fileName || 'prescription_document'}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setReprintDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 print:bg-white print:p-0">
              <img
                src={reprintDoc.fileUrl}
                alt={reprintDoc.title}
                className="max-h-[70vh] object-contain rounded-xl border border-slate-200 shadow-sm print:max-h-none print:w-full print:border-none print:shadow-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: WHATSAPP NOTIFICATION PREFERENCES ================= */}
      {isWhatsAppPrefModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-200">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">WhatsApp Notification Preferences</h3>
                  <p className="text-xs text-emerald-100">Manage clinic alerts & broadcast communications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppPrefModalOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <p className="font-bold text-emerald-900">Registered Mobile: {patient.phone}</p>
                  <p className="text-emerald-800">
                    We use your verified mobile number to send essential care instructions, appointment confirmations, treatment updates, and exclusive seasonal clinic packages.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Communication Channels
                </label>

                {/* Important Clinical Alerts (Mandatory) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <p className="text-xs font-bold text-slate-800">Critical Medical & Appointment Alerts</p>
                    <p className="text-[11px] text-slate-500">
                      Appointment schedules, doctor notes, prescription ready alerts, and invoices.
                    </p>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                    Required
                  </span>
                </div>

                {/* Promotional & Clinic Broadcasts */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <p className="text-xs font-bold text-slate-800">Clinic Broadcasts & Seasonal Offers</p>
                    <p className="text-[11px] text-slate-500">
                      Festival greetings, special dental packages (scaling, whitening), and revised holiday hours.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={!isOptedOut}
                      onChange={(e) => setIsOptedOut(!e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {prefSaveNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{prefSaveNotice}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppPrefModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (patient.id) {
                      const now = new Date().toISOString();
                      await updatePatient(patient.id, {
                        whatsappOptOut: isOptedOut,
                        whatsappConsent: !isOptedOut,
                        whatsappConsentDate: now,
                        whatsappConsentSource: 'patient_portal'
                      });
                    }
                    setPrefSaveNotice('Preferences updated successfully!');
                    setTimeout(() => {
                      setPrefSaveNotice('');
                      setIsWhatsAppPrefModalOpen(false);
                    }, 1400);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
