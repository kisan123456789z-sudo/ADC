import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  DollarSign, 
  Upload, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Layers, 
  CreditCard, 
  Banknote, 
  RefreshCw, 
  History, 
  X, 
  Lock, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Filter,
  FileCheck,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Folder
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { 
  buildConnectedPatientRecord, 
  exportSinglePatientFolderZip 
} from '../../utils/patientFolderManager';
import { 
  Patient, 
  PatientDocument, 
  Invoice, 
  PatientPayment, 
  AuditLog, 
  DocumentCategory 
} from '../../types/clinic';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  optimizeImageIfNeeded, 
  resolveDocumentFileUrl 
} from '../../utils/fileStorageHelper';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Dental Prescription',
  'X-Ray / Dental Imaging',
  'Laboratory Report',
  'Medical or Dental Report',
  'Invoice / Bill',
  'Treatment Plan',
  'Other Documents'
];

interface PatientBillingManagerProps {
  userRole: 'admin' | 'staff';
  currentUserName: string;
}

export const PatientBillingManager: React.FC<PatientBillingManagerProps> = ({
  userRole,
  currentUserName
}) => {
  const {
    patients,
    prescriptions,
    bookings,
    documents,
    invoices,
    patientPayments,
    auditLogs,
    addDocument,
    updateDocument,
    replaceDocumentFile,
    deleteDocument,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addPayment,
    recordRefundOrCorrection,
    deleteAuditLog,
    clearPatientAuditLogs
  } = useClinic();

  // Selected Patient State
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');

  // Active sub-tab in Patient Record
  const [activeTab, setActiveTab] = useState<'documents' | 'invoices' | 'payments' | 'audit'>('documents');

  // Filter & Search states for Documents
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('All');
  const [docSearchQuery, setDocSearchQuery] = useState<string>('');
  const [docSortOrder, setDocSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState(false);
  const [isReplaceFileModalOpen, setIsReplaceFileModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [printInvoiceData, setPrintInvoiceData] = useState<Invoice | null>(null);

  // Helper to open preview with chunk reassembly
  const openDocPreview = async (docItem: PatientDocument) => {
    if (docItem.isChunked && docItem.id) {
      try {
        const fullUrl = await resolveDocumentFileUrl(docItem.id, docItem.fileUrl, docItem.isChunked);
        setPreviewDoc({ ...docItem, fileUrl: fullUrl });
      } catch {
        setPreviewDoc(docItem);
      }
    } else {
      setPreviewDoc(docItem);
    }
  };

  // Target item states for editing / actions
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<PatientDocument | null>(null);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<Invoice | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<PatientPayment | null>(null);

  // Delete Confirmations
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'document' | 'invoice' | 'audit_log' | 'clear_audit_trail';
    id: string;
    title: string;
  } | null>(null);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Upload Document Form State
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('X-Ray / Dental Imaging');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploadFile, setUploadFile] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const [uploadIsPublished, setUploadIsPublished] = useState(true);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Replace Document File Form State
  const [replacementFile, setReplacementFile] = useState<{ url: string; name: string; type: string; size: number } | null>(null);

  // Add / Edit Invoice Form State
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [invTreatment, setInvTreatment] = useState('');
  const [invTotalCharges, setInvTotalCharges] = useState<number>(0);
  const [invDiscount, setInvDiscount] = useState<number>(0);
  const [invNotes, setInvNotes] = useState('');
  const [invError, setInvError] = useState('');

  // Record Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState<PatientPayment['paymentMethod']>('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Refund / Correction Form State
  const [refundReason, setRefundReason] = useState('');

  // Image Zoom for Document Preview
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Auto-select first patient if none selected
  useMemo(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id || '');
    }
  }, [patients, selectedPatientId]);

  // Current Patient
  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Filtered Patient List for search
  const filteredPatients = useMemo(() => {
    const q = patientSearchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  }, [patients, patientSearchQuery]);

  // Documents for Current Patient
  const patientDocs = useMemo(() => {
    if (!currentPatient?.id) return [];
    return documents.filter(d => d.patientId === currentPatient.id);
  }, [documents, currentPatient]);

  // Filtered & Sorted Documents
  const displayedDocs = useMemo(() => {
    let list = [...patientDocs];
    if (docCategoryFilter !== 'All') {
      list = list.filter(d => d.category === docCategoryFilter);
    }
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.trim().toLowerCase();
      list = list.filter(d => 
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.fileName && d.fileName.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      const dateA = a.documentDate || a.createdAt || '';
      const dateB = b.documentDate || b.createdAt || '';
      return docSortOrder === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
    return list;
  }, [patientDocs, docCategoryFilter, docSearchQuery, docSortOrder]);

  // Invoices for Current Patient
  const patientInvoices = useMemo(() => {
    if (!currentPatient?.id) return [];
    return invoices.filter(inv => inv.patientId === currentPatient.id);
  }, [invoices, currentPatient]);

  // Payments for Current Patient
  const patientPaymentsList = useMemo(() => {
    if (!currentPatient?.id) return [];
    return patientPayments.filter(p => p.patientId === currentPatient.id);
  }, [patientPayments, currentPatient]);

  // Audit Logs for Current Patient
  const patientAuditLogs = useMemo(() => {
    if (!currentPatient?.id) return [];
    return auditLogs.filter(a => a.patientId === currentPatient.id);
  }, [auditLogs, currentPatient]);

  // Financial summary for Current Patient
  const financialSummary = useMemo(() => {
    const totalBilled = patientInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
    const totalPaid = patientInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);
    return { totalBilled, totalPaid, outstanding };
  }, [patientInvoices]);

  // ================= FILE UPLOAD & VALIDATION =================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: Size limit 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds 15MB limit. Please upload a smaller file.');
      return;
    }

    // Supported MIME types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported format. Please upload PDF, JPG, PNG, or WebP files.');
      return;
    }

    try {
      setIsUploading(true);
      const optimized = await optimizeImageIfNeeded(file);
      setUploadFile({
        url: optimized.dataUrl,
        name: file.name,
        type: file.type,
        size: optimized.size
      });
      if (!uploadTitle) {
        // Pre-populate title from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setUploadTitle(cleanName);
      }
    } catch (err) {
      setUploadError('Failed to read file. Please try another file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplacementFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('File exceeds 15MB limit.', 'error');
      return;
    }
    try {
      const optimized = await optimizeImageIfNeeded(file);
      setReplacementFile({
        url: optimized.dataUrl,
        name: file.name,
        type: file.type,
        size: optimized.size
      });
    } catch (err) {
      showToast('Failed to process replacement file.', 'error');
    }
  };

  // Submit Upload Document
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient || !currentPatient.id) {
      setUploadError('Please select a valid patient first.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Document title is required.');
      return;
    }
    if (!uploadFile) {
      setUploadError('Please select a document file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    try {
      const res = await addDocument({
        patientId: currentPatient.id,
        patientName: currentPatient.name || 'Patient',
        patientPhone: currentPatient.phone || '',
        category: uploadCategory,
        title: uploadTitle.trim(),
        description: uploadDesc ? uploadDesc.trim() : '',
        documentDate: uploadDate || new Date().toISOString().slice(0, 10),
        fileUrl: uploadFile.url,
        fileName: uploadFile.name || 'document',
        fileType: uploadFile.type || 'application/octet-stream',
        fileSize: uploadFile.size || 0,
        uploaderName: currentUserName || 'Clinic Staff',
        uploaderRole: userRole || 'staff',
        isPublished: uploadIsPublished !== undefined ? uploadIsPublished : true
      });

      setIsUploading(false);
      if (res.success) {
        setIsUploadModalOpen(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadFile(null);
        showToast(`Document "${uploadTitle}" uploaded successfully!`);
      } else {
        setUploadError(res.error ? `Failed to upload: ${res.error}` : 'Failed to upload document. Please try again.');
      }
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(`Failed to upload: ${err?.message || 'Please try again.'}`);
    }
  };

  // Save Edit Document Metadata
  const handleSaveDocMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForEdit || !selectedDocForEdit.id) return;
    const ok = await updateDocument(
      selectedDocForEdit.id,
      {
        title: selectedDocForEdit.title.trim(),
        category: selectedDocForEdit.category,
        documentDate: selectedDocForEdit.documentDate,
        description: selectedDocForEdit.description?.trim(),
        isPublished: selectedDocForEdit.isPublished
      },
      `Updated metadata for "${selectedDocForEdit.title}"`,
      currentUserName,
      userRole
    );
    if (ok) {
      setIsEditDocModalOpen(false);
      setSelectedDocForEdit(null);
      showToast('Document metadata updated!');
    }
  };

  // Save File Replacement
  const handleSaveFileReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForEdit || !selectedDocForEdit.id || !replacementFile) return;
    const ok = await replaceDocumentFile(
      selectedDocForEdit.id,
      {
        fileUrl: replacementFile.url,
        fileName: replacementFile.name,
        fileType: replacementFile.type,
        fileSize: replacementFile.size
      },
      currentUserName,
      userRole
    );
    if (ok) {
      setIsReplaceFileModalOpen(false);
      setReplacementFile(null);
      setSelectedDocForEdit(null);
      showToast('Document file replaced and audit logged!');
    }
  };

  // Submit Add Invoice
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvError('');
    if (!currentPatient || !currentPatient.id) {
      setInvError('Please select a patient first.');
      return;
    }
    if (!invTreatment.trim()) {
      setInvError('Treatment / Service description is required.');
      return;
    }
    if (invTotalCharges <= 0) {
      setInvError('Total charges must be greater than ₹ 0.');
      return;
    }
    if (invDiscount < 0 || invDiscount > invTotalCharges) {
      setInvError('Discount cannot be negative or exceed total charges.');
      return;
    }

    const res = await addInvoice({
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      patientPhone: currentPatient.phone,
      invoiceDate: invDate,
      treatmentDescription: invTreatment.trim(),
      totalCharges: Number(invTotalCharges),
      discount: Number(invDiscount),
      finalAmount: Math.max(0, Number(invTotalCharges) - Number(invDiscount)),
      notes: invNotes.trim(),
      createdBy: currentUserName
    });

    if (res.success) {
      setIsAddInvoiceModalOpen(false);
      setInvTreatment('');
      setInvTotalCharges(0);
      setInvDiscount(0);
      setInvNotes('');
      showToast(`Invoice #${res.invoiceNumber} generated!`);
    } else {
      setInvError('Failed to generate invoice.');
    }
  };

  // Submit Edit Invoice
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForEdit || !selectedInvoiceForEdit.id) return;
    if (selectedInvoiceForEdit.totalCharges <= 0) {
      setInvError('Total charges must be greater than 0.');
      return;
    }

    const ok = await updateInvoice(
      selectedInvoiceForEdit.id,
      {
        treatmentDescription: selectedInvoiceForEdit.treatmentDescription.trim(),
        totalCharges: Number(selectedInvoiceForEdit.totalCharges),
        discount: Number(selectedInvoiceForEdit.discount || 0),
        invoiceDate: selectedInvoiceForEdit.invoiceDate,
        notes: selectedInvoiceForEdit.notes?.trim()
      },
      `Adjusted Invoice #${selectedInvoiceForEdit.invoiceNumber} charges by ${currentUserName}`,
      currentUserName,
      userRole
    );
    if (ok) {
      setIsEditInvoiceModalOpen(false);
      setSelectedInvoiceForEdit(null);
      showToast('Invoice details updated and balances recalculated!');
    }
  };

  // Submit Record Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (!selectedInvoiceForPayment || !selectedInvoiceForPayment.id || !currentPatient) return;
    if (payAmount <= 0) {
      setPayError('Payment amount must be greater than ₹ 0.');
      return;
    }
    if (payAmount > selectedInvoiceForPayment.outstandingBalance) {
      setPayError(`Payment cannot exceed pending balance of ₹ ${selectedInvoiceForPayment.outstandingBalance}.`);
      return;
    }

    const res = await addPayment({
      invoiceId: selectedInvoiceForPayment.id,
      invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
      patientId: currentPatient.id || '',
      patientName: currentPatient.name,
      amount: Number(payAmount),
      paymentDate: payDate,
      paymentMethod: payMethod,
      referenceNumber: payRef.trim(),
      recordedBy: currentUserName,
      recordedByRole: userRole,
      notes: payNotes.trim()
    });

    if (res.success) {
      setIsRecordPaymentModalOpen(false);
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      setSelectedInvoiceForPayment(null);
      showToast(`Payment of ₹ ${payAmount} recorded for Invoice #${selectedInvoiceForPayment.invoiceNumber}!`);
    } else {
      setPayError('Failed to record payment.');
    }
  };

  // Submit Refund / Correction
  const handleSaveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForRefund || !selectedPaymentForRefund.id) return;
    if (!refundReason.trim()) {
      showToast('Please state a reason for this refund or correction.', 'error');
      return;
    }

    const ok = await recordRefundOrCorrection(
      selectedPaymentForRefund.id,
      refundReason.trim(),
      currentUserName,
      userRole
    );
    if (ok) {
      setIsRefundModalOpen(false);
      setSelectedPaymentForRefund(null);
      setRefundReason('');
      showToast('Refund transaction recorded and balance restored.');
    }
  };

  // Handle Delete Confirmation Execution
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget || !currentPatient?.id) return;
    if (deleteConfirmTarget.type === 'document') {
      await deleteDocument(deleteConfirmTarget.id, currentPatient.id, currentUserName, userRole);
      showToast('Document removed from records.');
    } else if (deleteConfirmTarget.type === 'invoice') {
      await deleteInvoice(deleteConfirmTarget.id, currentPatient.id, currentUserName, userRole);
      showToast('Invoice voided and removed.');
    } else if (deleteConfirmTarget.type === 'audit_log') {
      const ok = await deleteAuditLog(deleteConfirmTarget.id);
      if (ok) {
        showToast('Audit log record deleted.');
      } else {
        showToast('Failed to delete audit record.', 'error');
      }
    } else if (deleteConfirmTarget.type === 'clear_audit_trail') {
      const ok = await clearPatientAuditLogs(currentPatient.id);
      if (ok) {
        showToast(`Cleared all audit trail logs for ${currentPatient.name}.`);
      } else {
        showToast('Failed to clear audit trail.', 'error');
      }
    }
    setDeleteConfirmTarget(null);
  };

  // Category Icon & Color Helper
  const getCategoryBadge = (cat: DocumentCategory) => {
    switch (cat) {
      case 'Dental Prescription':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' };
      case 'X-Ray / Dental Imaging':
        return { bg: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-600' };
      case 'Laboratory Report':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', dot: 'bg-purple-600' };
      case 'Medical or Dental Report':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-600' };
      case 'Invoice / Bill':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-600' };
      case 'Treatment Plan':
        return { bg: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-600' };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-600' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition animate-in fade-in slide-in-from-bottom-2 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900/95 text-white border-emerald-700' 
            : 'bg-rose-900/95 text-white border-rose-700'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-300" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Heading */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Patient Reports & Billing Portal</h2>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              userRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {userRole === 'admin' ? 'Administrator Full Access' : 'Authorized Staff'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete digital health ledger: Manage clinical documents, diagnostic imaging, treatment invoices, partial payments, and audit histories.
          </p>
        </div>

        {/* Patient Selection Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patient by name or phone..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="py-2 px-3 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filteredPatients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.phone || 'No phone'}) - Age {p.age || '—'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Patient Details Header & Financial Summary */}
      {currentPatient ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md border border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
            {/* Patient Demographic Card */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center font-bold text-xl text-blue-300">
                {currentPatient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white tracking-tight">{currentPatient.name}</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    ID: {currentPatient.id?.slice(0, 8) || 'PAT-LOCAL'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>{currentPatient.phone}</span>
                  </span>
                  <span>•</span>
                  <span>Age: {currentPatient.age || 'N/A'} yrs</span>
                  <span>•</span>
                  <span>Gender: {currentPatient.gender || 'Other'}</span>
                  <span>•</span>
                  <span>Visits: {currentPatient.totalVisits || 1}</span>
                </div>
                {currentPatient.address && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    📍 {currentPatient.address}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons for Current Patient */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setUploadTitle('');
                  setUploadDesc('');
                  setUploadFile(null);
                  setUploadError('');
                  setIsUploadModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Report / X-Ray</span>
              </button>
              <button
                onClick={() => {
                  setInvTreatment('');
                  setInvTotalCharges(0);
                  setInvDiscount(0);
                  setInvNotes('');
                  setInvError('');
                  setIsAddInvoiceModalOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Invoice</span>
              </button>
              <button
                onClick={async () => {
                  if (currentPatient) {
                    try {
                      await exportSinglePatientFolderZip(buildConnectedPatientRecord(currentPatient, {
                        prescriptions,
                        bookings,
                        documents,
                        invoices,
                        patientPayments,
                        auditLogs
                      }));
                      showToast(`Downloaded folder for ${currentPatient.name} (.zip)`);
                    } catch (err: any) {
                      showToast(`Failed to download folder: ${err?.message || 'Error'}`, 'error');
                    }
                  }
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition"
                title="Download this patient's complete folder (.zip) containing profile, prescriptions, visits, bills, and documents"
              >
                <Folder className="w-4 h-4" />
                <span>Patient Folder (.zip)</span>
              </button>
            </div>
          </div>

          {/* Patient 3-Column Financial Ledger Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Billed
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                ₹ {financialSummary.totalBilled.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400">From {patientInvoices.length} invoices</span>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                Total Paid
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                ₹ {financialSummary.totalPaid.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-200/70">Recorded receipts</span>
            </div>

            <div className={`rounded-2xl p-4 border ${
              financialSummary.outstanding > 0 
                ? 'bg-rose-500/15 border-rose-500/30' 
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                financialSummary.outstanding > 0 ? 'text-rose-300' : 'text-emerald-300'
              }`}>
                Pending Balance
              </span>
              <span className={`text-xl font-bold mt-1 block ${
                financialSummary.outstanding > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                ₹ {financialSummary.outstanding.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-300">
                {financialSummary.outstanding > 0 ? 'Payment due' : 'All clear'}
              </span>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider block">
                Documents & Imaging
              </span>
              <span className="text-xl font-bold text-sky-400 mt-1 block">
                {patientDocs.length}
              </span>
              <span className="text-[11px] text-slate-400">Reports, X-rays & Plans</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-sm text-slate-600">No patient selected. Please select or add a patient.</p>
        </div>
      )}

      {/* Tabs Navigation for Patient Record */}
      {currentPatient && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold px-4 pt-2">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 px-5 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Reports & Documents ({patientDocs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-3 px-5 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices & Charges ({patientInvoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`py-3 px-5 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'payments'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Payment Receipts ({patientPaymentsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-5 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail ({patientAuditLogs.length})</span>
            </button>
          </div>

          <div className="p-6">
            {/* ================= TAB 1: REPORTS & DOCUMENTS ================= */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {/* Search, Filter & Upload toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      Category:
                    </span>
                    <button
                      onClick={() => setDocCategoryFilter('All')}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                        docCategoryFilter === 'All'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({patientDocs.length})
                    </button>
                    {DOCUMENT_CATEGORIES.map(cat => {
                      const count = patientDocs.filter(d => d.category === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setDocCategoryFilter(cat)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                            docCategoryFilter === cat
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search document title..."
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={docSortOrder}
                      onChange={(e) => setDocSortOrder(e.target.value as 'newest' | 'oldest')}
                      className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                    <button
                      onClick={() => {
                        setUploadTitle('');
                        setUploadDesc('');
                        setUploadFile(null);
                        setUploadError('');
                        setIsUploadModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* Documents Grid / List */}
                {displayedDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedDocs.map(docItem => {
                      const badge = getCategoryBadge(docItem.category);
                      const isImage = docItem.fileType?.startsWith('image/') || docItem.fileName?.endsWith('.svg') || docItem.fileName?.endsWith('.png') || docItem.fileName?.endsWith('.jpg');
                      return (
                        <div
                          key={docItem.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                        >
                          <div>
                            {/* Category Badge & Patient Portal Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{docItem.category}</span>
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                docItem.isPublished 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {docItem.isPublished ? '✓ In Patient Portal' : 'Clinic Only'}
                              </span>
                            </div>

                            {/* Title & Description */}
                            <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition">
                              {docItem.title}
                            </h4>
                            {docItem.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {docItem.description}
                              </p>
                            )}

                            {/* File Preview Thumbnail / Icon */}
                            <div 
                              onClick={() => openDocPreview(docItem)}
                              className="mt-3 h-28 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative group/thumb hover:border-blue-300 transition"
                            >
                              {isImage && docItem.fileUrl ? (
                                <img
                                  src={docItem.fileUrl}
                                  alt={docItem.title}
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition duration-300"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                  <FileText className="w-8 h-8 text-blue-500" />
                                  <span className="text-[11px] font-semibold text-slate-500">{docItem.fileName}</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center gap-2">
                                <span className="p-1.5 bg-white text-slate-900 rounded-lg shadow-sm">
                                  <Eye className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-bold text-white">Click to Preview</span>
                              </div>
                            </div>

                            {/* Metadata Details */}
                            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
                              <div className="flex justify-between">
                                <span>Report Date:</span>
                                <span className="font-medium text-slate-700">{docItem.documentDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Uploaded by:</span>
                                <span className="font-medium text-slate-700">{docItem.uploaderName} ({docItem.uploaderRole})</span>
                              </div>
                              <div className="flex justify-between">
                                <span>File:</span>
                                <span className="font-medium text-slate-700 truncate max-w-[140px]">{docItem.fileName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openDocPreview(docItem)}
                                title="Preview Document"
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={docItem.fileUrl}
                                download={docItem.fileName || 'clinic_document'}
                                title="Download Document"
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocForEdit(docItem);
                                  setIsEditDocModalOpen(true);
                                }}
                                title="Edit Metadata"
                                className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDocForEdit(docItem);
                                  setReplacementFile(null);
                                  setIsReplaceFileModalOpen(true);
                                }}
                                title="Replace File (Maintains Audit Trail)"
                                className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTarget({
                                    type: 'document',
                                    id: docItem.id || '',
                                    title: docItem.title
                                  })}
                                  title="Delete Document"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">No documents found</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {docSearchQuery || docCategoryFilter !== 'All' 
                        ? 'Try adjusting your category filter or search terms.' 
                        : 'No reports, X-rays, or lab files uploaded yet for this patient.'}
                    </p>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload First Document</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: INVOICES & CHARGES ================= */}
            {activeTab === 'invoices' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Itemized Treatment Invoices</h3>
                    <p className="text-xs text-slate-500">Each invoice tracks total charges, discounts, and real-time outstanding balance.</p>
                  </div>
                  <button
                    onClick={() => {
                      setInvTreatment('');
                      setInvTotalCharges(0);
                      setInvDiscount(0);
                      setInvNotes('');
                      setInvError('');
                      setIsAddInvoiceModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Invoice</span>
                  </button>
                </div>

                {patientInvoices.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Invoice #</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Treatment / Procedure</th>
                          <th className="py-3 px-4 text-right">Charges</th>
                          <th className="py-3 px-4 text-right">Discount</th>
                          <th className="py-3 px-4 text-right">Net Final</th>
                          <th className="py-3 px-4 text-right">Paid</th>
                          <th className="py-3 px-4 text-right">Pending</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {patientInvoices.map(inv => {
                          return (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-mono font-bold text-blue-700">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                {inv.invoiceDate}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-800 block">{inv.treatmentDescription}</span>
                                {inv.notes && (
                                  <span className="text-[11px] text-slate-400 block truncate max-w-xs">{inv.notes}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-600">
                                ₹ {inv.totalCharges?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right text-rose-600 font-medium">
                                {inv.discount > 0 ? `- ₹ ${inv.discount?.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900">
                                ₹ {inv.finalAmount?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                ₹ {inv.amountPaid?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-right font-bold">
                                <span className={inv.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                                  ₹ {inv.outstandingBalance?.toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  inv.paymentStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inv.paymentStatus === 'Partially Paid'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {inv.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {inv.outstandingBalance > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedInvoiceForPayment(inv);
                                        setPayAmount(inv.outstandingBalance);
                                        setPayRef('');
                                        setPayNotes('');
                                        setPayError('');
                                        setIsRecordPaymentModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-xs transition"
                                    >
                                      + Pay
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPrintInvoiceData(inv)}
                                    title="View / Print Printable Receipt"
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                  {userRole === 'admin' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedInvoiceForEdit(inv);
                                          setIsEditInvoiceModalOpen(true);
                                        }}
                                        title="Edit Invoice"
                                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmTarget({
                                          type: 'invoice',
                                          id: inv.id || '',
                                          title: `Invoice #${inv.invoiceNumber}`
                                        })}
                                        title="Void Invoice"
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-700 text-sm">No invoices recorded</h4>
                    <p className="text-xs text-slate-500 mt-1">Generate an invoice when procedures or consultations are conducted.</p>
                    <button
                      onClick={() => setIsAddInvoiceModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate Invoice</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: PAYMENT RECEIPTS ================= */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Payment Transactions Ledger</h3>
                    <p className="text-xs text-slate-500">Traceable audit record of every payment received, payment method, and transaction reference.</p>
                  </div>
                </div>

                {patientPaymentsList.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Invoice #</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4">Transaction / Ref #</th>
                          <th className="py-3 px-4">Recorded By</th>
                          <th className="py-3 px-4">Notes</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {patientPaymentsList.map(pay => {
                          const isRef = pay.isRefund || pay.amount < 0;
                          return (
                            <tr key={pay.id} className={`hover:bg-slate-50/80 transition ${isRef ? 'bg-rose-50/30' : ''}`}>
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                                {pay.paymentDate}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-blue-700">
                                #{pay.invoiceNumber}
                              </td>
                              <td className={`py-3 px-4 text-right font-bold ${
                                isRef ? 'text-rose-600' : 'text-emerald-600'
                              }`}>
                                {isRef ? `- ₹ ${Math.abs(pay.amount).toLocaleString('en-IN')}` : `₹ ${pay.amount.toLocaleString('en-IN')}`}
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
                                {pay.referenceNumber || 'Counter'}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {pay.recordedBy} <span className="text-[10px] text-slate-400">({pay.recordedByRole})</span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                {pay.notes || '—'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {!isRef && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPaymentForRefund(pay);
                                      setRefundReason('');
                                      setIsRefundModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold rounded-lg text-xs transition"
                                  >
                                    Refund / Correct
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-xs text-slate-500">No payment receipts logged yet for this patient.</p>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 4: AUDIT TRAIL ================= */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Clinic Audit Trail Details</h3>
                    <p className="text-xs text-slate-500">Every upload, replacement, correction, and payment is chronologically timestamped.</p>
                  </div>

                  {patientAuditLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTarget({
                        type: 'clear_audit_trail',
                        id: 'all',
                        title: `All Audit Logs for ${currentPatient.name}`
                      })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                      title="Clear all audit entries for this patient"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Clear Audit Trail</span>
                    </button>
                  )}
                </div>

                {patientAuditLogs.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {patientAuditLogs.map((log, idx) => (
                      <div key={log.id || idx} className="relative bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 text-xs transition group shadow-2xs">
                        <div className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="font-bold text-slate-900 block sm:inline">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-slate-400 font-mono sm:ml-2">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTarget({
                              type: 'audit_log',
                              id: log.id || String(idx),
                              title: `${log.action.replace(/_/g, ' ')} (${new Date(log.timestamp).toLocaleDateString()})`
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0 opacity-80 group-hover:opacity-100"
                            title="Delete this audit record"
                            aria-label="Delete this audit log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-600 leading-relaxed pr-6">{log.details}</p>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>
                            Performed by: <strong className="text-slate-600">{log.performedBy}</strong> ({log.performedByRole})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-xs text-slate-500">No audit log entries recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD DOCUMENT ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Upload className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Upload Patient Document</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient</label>
                <input
                  type="text"
                  disabled
                  value={`${currentPatient?.name} (${currentPatient?.phone})`}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Op Bitewing X-Ray (#46) or Blood Sugar Profile"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Date</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Portal Access</label>
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadIsPublished}
                      onChange={(e) => setUploadIsPublished(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">Make Visible in Portal</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Remarks / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Clinical notes, findings, teeth involved, or instructions..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select File (PDF, PNG, JPG up to 10MB) *</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadFile ? (
                    <div className="space-y-1">
                      <FileCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="font-bold text-slate-800 text-xs">{uploadFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(uploadFile.size / 1024).toFixed(1)} KB • Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700 text-xs">Drop report here or click to browse</p>
                      <p className="text-[10px] text-slate-400">PDF, JPG, JPEG, PNG • Max 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadIsPublished}
                    onChange={(e) => setUploadIsPublished(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Publish in Patient Portal</span>
                </label>
                {userRole === 'staff' && uploadCategory === 'Dental Prescription' && !uploadIsPublished && (
                  <p className="text-[11px] text-amber-700 mt-1 pl-1 font-semibold">
                    ✓ Staff safety: Prescription will remain hidden from Patient Portal until approved.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isUploading ? 'Uploading...' : 'Save & Link to Patient'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DOCUMENT METADATA ================= */}
      {isEditDocModalOpen && selectedDocForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Edit Document Metadata</h3>
              <button
                onClick={() => setIsEditDocModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocMetadata} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={selectedDocForEdit.category}
                  onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, category: e.target.value as DocumentCategory })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedDocForEdit.title}
                  onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, title: e.target.value })}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Date</label>
                <input
                  type="date"
                  value={selectedDocForEdit.documentDate}
                  onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, documentDate: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={selectedDocForEdit.description || ''}
                  onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, description: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDocForEdit.isPublished}
                    onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, isPublished: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Publish in Patient Portal</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditDocModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REPLACE DOCUMENT FILE ================= */}
      {isReplaceFileModalOpen && selectedDocForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Replace Document File</h3>
                <p className="text-[11px] text-slate-500">Replaces current file while logging change in clinic audit trail.</p>
              </div>
              <button
                onClick={() => setIsReplaceFileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFileReplacement} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Document</span>
                <span className="font-bold text-slate-800">{selectedDocForEdit.title}</span>
                <span className="text-slate-500 block text-[11px]">File: {selectedDocForEdit.fileName}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Replacement File</label>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleReplacementFileUpload}
                  required
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {replacementFile && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ✓ New file selected: {replacementFile.name} ({(replacementFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReplaceFileModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replacementFile}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
                >
                  Replace & Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PREVIEW DOCUMENT ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700">
            {/* Preview Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    {previewDoc.category}
                  </span>
                  <h3 className="font-bold text-sm text-white">{previewDoc.title}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Patient: {previewDoc.patientName} • Date: {previewDoc.documentDate} • {previewDoc.fileName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  title="Zoom Out"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-300 w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  title="Zoom In"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <a
                  href={previewDoc.fileUrl}
                  download={previewDoc.fileName || 'clinic_document'}
                  className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs ml-2 flex items-center gap-1 font-bold px-3"
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

            {/* Preview Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 min-h-[400px]">
              {previewDoc.fileType?.startsWith('image/') || previewDoc.fileUrl?.startsWith('data:image/') ? (
                <div 
                  className="transition duration-150 origin-center flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[65vh] object-contain rounded-lg shadow-lg border border-slate-800"
                  />
                </div>
              ) : previewDoc.fileType === 'application/pdf' || previewDoc.fileUrl?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[65vh] rounded-lg border border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                  <p className="font-bold text-white text-sm">{previewDoc.fileName}</p>
                  <p className="text-xs text-slate-400 mt-1">Download to view this format on your device</p>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>

            {/* Description footer if any */}
            {previewDoc.description && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
                <span className="font-bold text-slate-300">Clinical Notes: </span>
                {previewDoc.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD INVOICE ================= */}
      {isAddInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Generate Treatment Invoice</h3>
              </div>
              <button
                onClick={() => setIsAddInvoiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {invError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{invError}</span>
              </div>
            )}

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient</label>
                <input
                  type="text"
                  disabled
                  value={`${currentPatient?.name} (${currentPatient?.phone})`}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Created By</label>
                  <input
                    type="text"
                    disabled
                    value={currentUserName}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Treatment / Procedure Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Single Sitting RCT (#46) + Ceramic Crown Restoration"
                  value={invTreatment}
                  onChange={(e) => setInvTreatment(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Charges (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={invTotalCharges || ''}
                    onChange={(e) => setInvTotalCharges(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount (₹, if any)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={invDiscount || ''}
                    onChange={(e) => setInvDiscount(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Real-time calculated final amount preview */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
                <span className="font-bold">Final Invoice Amount:</span>
                <span className="text-base font-extrabold font-mono">
                  ₹ {Math.max(0, invTotalCharges - invDiscount).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Billing Notes / Terms (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Balance payable upon delivery of permanent crown."
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT INVOICE (ADMIN ONLY) ================= */}
      {isEditInvoiceModalOpen && selectedInvoiceForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Edit Invoice #{selectedInvoiceForEdit.invoiceNumber}</h3>
              <button
                onClick={() => setIsEditInvoiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Treatment Description</label>
                <input
                  type="text"
                  value={selectedInvoiceForEdit.treatmentDescription}
                  onChange={(e) => setSelectedInvoiceForEdit({ ...selectedInvoiceForEdit, treatmentDescription: e.target.value })}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Charges (₹)</label>
                  <input
                    type="number"
                    value={selectedInvoiceForEdit.totalCharges}
                    onChange={(e) => setSelectedInvoiceForEdit({ ...selectedInvoiceForEdit, totalCharges: Number(e.target.value) })}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={selectedInvoiceForEdit.discount || 0}
                    onChange={(e) => setSelectedInvoiceForEdit({ ...selectedInvoiceForEdit, discount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500">Current Paid: ₹ {selectedInvoiceForEdit.amountPaid}</span>
                <span className="block text-xs font-bold text-slate-800 mt-1">
                  Adjusted Outstanding: ₹ {Math.max(0, (selectedInvoiceForEdit.totalCharges - (selectedInvoiceForEdit.discount || 0)) - (selectedInvoiceForEdit.amountPaid || 0))}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={selectedInvoiceForEdit.invoiceDate}
                  onChange={(e) => setSelectedInvoiceForEdit({ ...selectedInvoiceForEdit, invoiceDate: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD PAYMENT ================= */}
      {isRecordPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Record Payment Receipt</h3>
              </div>
              <button
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono font-bold text-blue-700">#{selectedInvoiceForPayment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Treatment:</span>
                <span className="font-semibold text-slate-800">{selectedInvoiceForPayment.treatmentDescription}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Billed:</span>
                <span className="font-semibold text-slate-800">₹ {selectedInvoiceForPayment.finalAmount}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-rose-600">Pending Balance:</span>
                <span className="text-rose-600 text-sm">₹ {selectedInvoiceForPayment.outstandingBalance}</span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount to Pay (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoiceForPayment.outstandingBalance}
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-extrabold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PatientPayment['paymentMethod'])}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Receipt No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-998822, RCPT-410"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Advance paid, balance next visit"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Save Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REFUND / CORRECTION ================= */}
      {isRefundModalOpen && selectedPaymentForRefund && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Record Refund / Adjustment</h3>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rather than deleting financial entries, a traceable refund of <strong>₹ {selectedPaymentForRefund.amount}</strong> will be recorded against Invoice <strong>#{selectedPaymentForRefund.invoiceNumber}</strong> and logged in the audit trail.
            </p>

            <form onSubmit={handleSaveRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Refund / Correction *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Accidental double swipe, procedure changed by patient, billing discrepancy corrected..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Authorize Refund Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE INVOICE RECEIPT ================= */}
      {printInvoiceData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none print:border-none">
            {/* Header / Clinic Pad Top */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#00205b] tracking-tight">ANUJAY DENTAL CLINIC</h2>
                <p className="text-xs font-semibold text-sky-700">Multi-Specialty Dental Clinic & Implant Center</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026 • Tel: +91 98765 43210
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-800 rounded-lg uppercase tracking-wider block">
                  Official Invoice
                </span>
                <span className="text-xs font-mono font-bold text-blue-700 mt-1 block">
                  #{printInvoiceData.invoiceNumber}
                </span>
                <span className="text-[11px] text-slate-500 block">Date: {printInvoiceData.invoiceDate}</span>
              </div>
            </div>

            {/* Patient & Doctor Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Details</span>
                <span className="font-bold text-slate-900 text-sm block">{printInvoiceData.patientName}</span>
                <span className="text-slate-600 block">Phone: {printInvoiceData.patientPhone || 'N/A'}</span>
                <span className="text-slate-500 text-[11px] block">Patient ID: {printInvoiceData.patientId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Attending Surgeon</span>
                <span className="font-bold text-slate-900 block">Dr. Anujay Sharma</span>
                <span className="text-slate-600 block">B.D.S., M.D.S. (Chief Surgeon)</span>
                <span className="text-slate-500 text-[11px] block">Reg: DC-58921 / DCI</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Treatment / Description</th>
                    <th className="py-2.5 px-4 text-right">Charges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {printInvoiceData.treatmentDescription}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      ₹ {printInvoiceData.totalCharges?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {printInvoiceData.discount > 0 && (
                    <tr className="bg-rose-50/40 text-rose-700">
                      <td className="py-2 px-4">Special Clinic Discount</td>
                      <td className="py-2 px-4 text-right font-semibold">
                        - ₹ {printInvoiceData.discount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td className="py-2 px-4 text-slate-700">Net Invoice Amount:</td>
                    <td className="py-2 px-4 text-right text-slate-900">
                      ₹ {printInvoiceData.finalAmount?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-emerald-700">Total Payments Recorded:</td>
                    <td className="py-2 px-4 text-right text-emerald-700">
                      ₹ {printInvoiceData.amountPaid?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-900 text-sm">
                    <td className="py-3 px-4 text-slate-900 font-black">OUTSTANDING BALANCE DUE:</td>
                    <td className={`py-3 px-4 text-right font-black font-mono ${
                      printInvoiceData.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      ₹ {printInvoiceData.outstandingBalance?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terms and Sign-off */}
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
                onClick={() => setPrintInvoiceData(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#00205b] hover:bg-[#001740] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      <ConfirmModal
        isOpen={!!deleteConfirmTarget}
        title={
          deleteConfirmTarget?.type === 'document' ? 'Delete Document' :
          deleteConfirmTarget?.type === 'invoice' ? 'Delete Invoice' :
          deleteConfirmTarget?.type === 'clear_audit_trail' ? 'Clear Patient Audit Trail' :
          'Delete Audit Log Entry'
        }
        message={
          deleteConfirmTarget?.type === 'clear_audit_trail'
            ? `Are you sure you want to permanently clear all audit trail records for ${currentPatient?.name}? This action cannot be undone.`
            : deleteConfirmTarget?.type === 'audit_log'
            ? `Are you sure you want to permanently delete this audit record ("${deleteConfirmTarget?.title}")?`
            : `Are you sure you want to permanently delete "${deleteConfirmTarget?.title}"? This action will be recorded in the clinic audit log.`
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteConfirmTarget(null)}
        isDestructive={true}
      />
    </div>
  );
};
