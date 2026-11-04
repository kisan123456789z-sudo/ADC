import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Download, 
  Search, 
  Plus, 
  RefreshCw, 
  HardDrive, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  Stethoscope, 
  Receipt, 
  CreditCard, 
  Image as ImageIcon, 
  Printer, 
  Share2, 
  ArrowLeft, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  FileCheck,
  FileSpreadsheet,
  X,
  Edit3,
  Trash2,
  Loader2,
  HelpCircle,
  FolderX
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Patient, Prescription, Booking, PatientDocument, Invoice } from '../../types/clinic';
import { 
  buildConnectedPatientRecord, 
  exportSinglePatientFolderZip, 
  exportAllPatientsRecordsZip, 
  isFileSystemAccessSupported, 
  connectLocalComputerFolder, 
  syncToConnectedLocalFolder,
  removePatientLocalFolder,
  savePatientFoldersToLocalVault,
  getLocalVaultStatus,
  isRunningInIframe,
  generatePatientProfileText,
  generatePrescriptionsText,
  generateVisitsText,
  generateInvoicesCsv,
  generateDocumentsListText,
  sanitizeFolderName
} from '../../utils/patientFolderManager';

interface PatientsRecordFolderViewProps {
  userRole?: 'admin' | 'staff';
  onOpenPrescriptionModal?: (rx: Prescription) => void;
  onOpenAddDocumentModal?: (patientId: string) => void;
  onOpenAddInvoiceModal?: (patientId: string) => void;
}

export const PatientsRecordFolderView: React.FC<PatientsRecordFolderViewProps> = ({
  userRole = 'staff',
  onOpenPrescriptionModal,
  onOpenAddDocumentModal,
  onOpenAddInvoiceModal
}) => {
  const { 
    patients, 
    prescriptions, 
    bookings, 
    documents, 
    invoices, 
    patientPayments, 
    auditLogs,
    addPatient,
    updatePatient,
    deletePatient,
    deletePrescription,
    deleteBooking,
    deleteDocument,
    deleteInvoice
  } = useClinic();

  // Search and selected patient folder
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeFileView, setActiveFileView] = useState<'overview' | 'profile' | 'prescriptions' | 'visits' | 'documents' | 'billing' | 'raw_json'>('overview');

  // Local folder connection state (Web File System Access API)
  const [localDirHandle, setLocalDirHandle] = useState<any>(null);
  const [localFolderName, setLocalFolderName] = useState<string>('');
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Folder Connection Assistant Modal
  const [showFolderConnectModal, setShowFolderConnectModal] = useState(false);
  const [folderConnectErrorMsg, setFolderConnectErrorMsg] = useState<string | null>(null);

  // Delete Patient Folder Modal State
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteCascadeData, setDeleteCascadeData] = useState<boolean>(true);
  const [isDeletingPatient, setIsDeletingPatient] = useState<boolean>(false);
  const [deletePatientError, setDeletePatientError] = useState<string>('');

  // Bulk Multi-Select & Batch Folder Deletion State
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteCascade, setBulkDeleteCascade] = useState(true);

  // Individual file deletion state (inside patient's folder)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'prescription' | 'booking' | 'document' | 'invoice';
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Delete All Records State
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirmationText, setDeleteAllConfirmationText] = useState('');
  const [deleteAllCascade, setDeleteAllCascade] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');

  // Zip generation progress
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // Storage Specs Modal state
  const [showStorageSpecsModal, setShowStorageSpecsModal] = useState(false);

  // Local Vault Mirror
  const [localVaultStatus, setLocalVaultStatus] = useState(() => getLocalVaultStatus());

  // New Patient Modal inside folder view
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<string>('');
  const [newPatientGender, setNewPatientGender] = useState<string>('Male');
  const [newPatientAddress, setNewPatientAddress] = useState('');
  const [newPatientNotes, setNewPatientNotes] = useState('');
  const [addPatientError, setAddPatientError] = useState('');

  // Auto-select first patient
  useMemo(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id || '');
    }
  }, [patients, selectedPatientId]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  // Selected patient object
  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Connected dossier for current patient
  const currentRecord = useMemo(() => {
    if (!currentPatient) return null;
    return buildConnectedPatientRecord(currentPatient, {
      prescriptions,
      bookings,
      documents,
      invoices,
      patientPayments,
      auditLogs
    });
  }, [currentPatient, prescriptions, bookings, documents, invoices, patientPayments, auditLogs]);

  // All clinic data bundle
  const allClinicData = useMemo(() => ({
    prescriptions,
    bookings,
    documents,
    invoices,
    patientPayments,
    auditLogs
  }), [prescriptions, bookings, documents, invoices, patientPayments, auditLogs]);

  // Keep local device vault in sync automatically
  React.useEffect(() => {
    if (patients.length > 0) {
      savePatientFoldersToLocalVault(patients, allClinicData);
      setLocalVaultStatus(getLocalVaultStatus());
    }
  }, [patients, allClinicData]);

  // Connect local folder on user's computer with proactive diagnostics
  const handleConnectLocalFolder = async () => {
    try {
      setSyncStatusMsg('Opening folder selector...');
      const res = await connectLocalComputerFolder();

      if (!res.success) {
        if (res.reason === 'USER_CANCELLED') {
          setSyncStatusMsg(null);
          return;
        }
        // Browser or iframe security prevented direct access: open assistant modal
        setFolderConnectErrorMsg(res.message);
        setShowFolderConnectModal(true);
        setSyncStatusMsg(res.message);
        return;
      }

      setLocalDirHandle(res.handle);
      setLocalFolderName(res.folderName);
      setSyncStatusMsg(`Connected to local folder: "${res.folderName}". Directly writing files...`);
      
      // Auto-sync once connected
      setIsSyncingLocal(true);
      const syncRes = await syncToConnectedLocalFolder(res.handle, patients, allClinicData, (percent, name) => {
        setSyncStatusMsg(`Directly saving: ${percent}% (${name})`);
      });
      setIsSyncingLocal(false);

      if (syncRes.success) {
        setSyncStatusMsg(`Success! All ${syncRes.count} patient folders are directly saved & connected to "${res.folderName}".`);
      } else {
        setSyncStatusMsg(`Sync note: ${syncRes.error}`);
      }
    } catch (err: any) {
      setIsSyncingLocal(false);
      setFolderConnectErrorMsg(err?.message || 'Could not connect folder');
      setShowFolderConnectModal(true);
    }
  };

  // Re-sync to already connected local folder
  const handleSyncToLocal = async () => {
    if (!localDirHandle) {
      await handleConnectLocalFolder();
      return;
    }
    try {
      setIsSyncingLocal(true);
      setSyncStatusMsg('Syncing latest patient records to local folder...');
      const res = await syncToConnectedLocalFolder(localDirHandle, patients, allClinicData, (percent, name) => {
        setSyncStatusMsg(`Writing files: ${percent}% (${name})`);
      });
      setIsSyncingLocal(false);
      if (res.success) {
        setSyncStatusMsg(`Updated! All ${res.count} patient folders directly saved to "${localFolderName}".`);
        setTimeout(() => setSyncStatusMsg(null), 5000);
      } else {
        setSyncStatusMsg(`Sync failed: ${res.error}`);
      }
    } catch (err: any) {
      setIsSyncingLocal(false);
      setSyncStatusMsg(`Sync error: ${err?.message || 'Could not write to folder'}`);
    }
  };

  // Execute deletion of a patient record folder
  const handleConfirmDeleteFolder = async () => {
    if (!patientToDelete || !patientToDelete.id) return;
    setIsDeletingPatient(true);
    setDeletePatientError('');

    try {
      const pId = patientToDelete.id;
      const cleanPhone = (patientToDelete.phone || '').replace(/\D/g, '').slice(-10);
      const patNameLower = (patientToDelete.name || '').trim().toLowerCase();

      // 1. If cascade is true, delete all associated records
      if (deleteCascadeData) {
        // Delete prescriptions
        const matchedRxs = (prescriptions || []).filter(p => {
          if (p.patientId === pId) return true;
          if (cleanPhone && p.patientPhone && p.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
          if (patNameLower && (p.patientName || '').trim().toLowerCase() === patNameLower) return true;
          return false;
        });
        for (const rx of matchedRxs) {
          if (rx.id) await deletePrescription(rx.id);
        }

        // Delete bookings
        const matchedBks = (bookings || []).filter(b => {
          if (cleanPhone && b.phone && b.phone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
          if (patNameLower && (b.patientName || '').trim().toLowerCase() === patNameLower) return true;
          return false;
        });
        for (const bk of matchedBks) {
          if (bk.id) await deleteBooking(bk.id);
        }

        // Delete documents
        const matchedDocs = (documents || []).filter(d => {
          if (d.patientId === pId) return true;
          if (cleanPhone && d.patientPhone && d.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
          return false;
        });
        for (const docItem of matchedDocs) {
          if (docItem.id) await deleteDocument(docItem.id, pId, 'Staff/Admin', userRole);
        }

        // Delete invoices
        const matchedInvs = (invoices || []).filter(inv => inv.patientId === pId);
        for (const inv of matchedInvs) {
          if (inv.id) await deleteInvoice(inv.id, pId, 'Staff/Admin', userRole);
        }
      }

      // 2. Remove subfolder from connected local computer folder
      if (localDirHandle) {
        await removePatientLocalFolder(localDirHandle, patientToDelete.name, patientToDelete.phone);
      }

      // 3. Delete patient document from Firestore
      await deletePatient(pId);

      const deletedName = patientToDelete.name;
      setPatientToDelete(null);
      setIsDeletingPatient(false);

      // Select next remaining patient
      const remaining = patients.filter(p => p.id !== pId);
      if (remaining.length > 0) {
        setSelectedPatientId(remaining[0].id || '');
      } else {
        setSelectedPatientId('');
      }

      setSyncStatusMsg(`Folder for "${deletedName}" was permanently deleted.`);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setIsDeletingPatient(false);
      setDeletePatientError(err?.message || 'Failed to delete patient folder.');
    }
  };

  // Toggle selection for bulk folder deletion
  const toggleSelectFolder = (id: string) => {
    setSelectedFolderIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFolders = () => {
    if (selectedFolderIds.length === filteredPatients.length) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(filteredPatients.map(p => p.id || '').filter(Boolean));
    }
  };

  // Execute bulk deletion of multiple selected patient folders
  const handleConfirmBulkDelete = async () => {
    if (selectedFolderIds.length === 0) return;
    setIsBulkDeleting(true);

    try {
      const idsToDelete = [...selectedFolderIds];
      for (const pId of idsToDelete) {
        const targetPat = patients.find(p => p.id === pId);
        if (!targetPat) continue;

        if (bulkDeleteCascade) {
          const cleanPhone = (targetPat.phone || '').replace(/\D/g, '').slice(-10);
          const patNameLower = (targetPat.name || '').trim().toLowerCase();

          // Delete prescriptions
          const matchedRxs = (prescriptions || []).filter(p => {
            if (p.patientId === pId) return true;
            if (cleanPhone && p.patientPhone && p.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
            if (patNameLower && (p.patientName || '').trim().toLowerCase() === patNameLower) return true;
            return false;
          });
          for (const rx of matchedRxs) {
            if (rx.id) await deletePrescription(rx.id);
          }

          // Delete bookings
          const matchedBks = (bookings || []).filter(b => {
            if (cleanPhone && b.phone && b.phone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
            if (patNameLower && (b.patientName || '').trim().toLowerCase() === patNameLower) return true;
            return false;
          });
          for (const bk of matchedBks) {
            if (bk.id) await deleteBooking(bk.id);
          }

          // Delete documents
          const matchedDocs = (documents || []).filter(d => {
            if (d.patientId === pId) return true;
            if (cleanPhone && d.patientPhone && d.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
            return false;
          });
          for (const docItem of matchedDocs) {
            if (docItem.id) await deleteDocument(docItem.id, pId, 'Staff/Admin', userRole);
          }

          // Delete invoices
          const matchedInvs = (invoices || []).filter(inv => inv.patientId === pId);
          for (const inv of matchedInvs) {
            if (inv.id) await deleteInvoice(inv.id, pId, 'Staff/Admin', userRole);
          }
        }

        // Delete from local computer folder if connected
        if (localDirHandle) {
          await removePatientLocalFolder(localDirHandle, targetPat.name, targetPat.phone);
        }

        // Delete patient record
        await deletePatient(pId);
      }

      setShowBulkDeleteModal(false);
      setSelectedFolderIds([]);
      setIsBulkDeleteMode(false);
      setIsBulkDeleting(false);

      const remaining = patients.filter(p => !idsToDelete.includes(p.id || ''));
      if (remaining.length > 0) {
        setSelectedPatientId(remaining[0].id || '');
      } else {
        setSelectedPatientId('');
      }

      setSyncStatusMsg(`Successfully deleted ${idsToDelete.length} patient record folders.`);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setIsBulkDeleting(false);
      alert(`Error during bulk delete: ${err?.message || 'Failed'}`);
    }
  };

  // Confirm single item deletion (prescription, booking, document, invoice)
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      if (itemToDelete.type === 'prescription') {
        await deletePrescription(itemToDelete.id);
      } else if (itemToDelete.type === 'booking') {
        await deleteBooking(itemToDelete.id);
      } else if (itemToDelete.type === 'document') {
        await deleteDocument(itemToDelete.id, currentPatient?.id || '', 'Staff/Admin', userRole);
      } else if (itemToDelete.type === 'invoice') {
        await deleteInvoice(itemToDelete.id, currentPatient?.id || '', 'Staff/Admin', userRole);
      }
      const title = itemToDelete.title;
      setItemToDelete(null);
      setIsDeletingItem(false);
      setSyncStatusMsg(`"${title}" deleted successfully.`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err: any) {
      setIsDeletingItem(false);
      alert(`Error deleting item: ${err?.message || 'Failed'}`);
    }
  };

  // Execute complete wipe of all patient records in the Patients Record folder
  const handleConfirmDeleteAllRecords = async () => {
    setIsDeletingAll(true);
    setDeleteAllError('');

    try {
      // 1. Delete all patient profile documents from Firestore
      const patientList = [...patients];
      for (const p of patientList) {
        if (p.id) {
          // If local folder is connected on PC, remove subfolder
          if (localDirHandle) {
            await removePatientLocalFolder(localDirHandle, p.name, p.phone);
          }
          await deletePatient(p.id);
        }
      }

      // 2. Cascade delete all linked records if checked
      if (deleteAllCascade) {
        for (const rx of prescriptions) {
          if (rx.id) await deletePrescription(rx.id);
        }
        for (const bk of bookings) {
          if (bk.id) await deleteBooking(bk.id);
        }
        for (const docItem of documents) {
          if (docItem.id) await deleteDocument(docItem.id, docItem.patientId || '', 'Admin', userRole);
        }
        for (const inv of invoices) {
          if (inv.id) await deleteInvoice(inv.id, inv.patientId || '', 'Admin', userRole);
        }
      }

      // 3. Reset local vault storage mirror
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('anu_dental_patient_records_vault_v1');
      }
      setLocalVaultStatus({ isAvailable: true, count: 0 });

      // 4. Reset UI state
      setSelectedPatientId('');
      setShowDeleteAllModal(false);
      setIsDeletingAll(false);
      setDeleteAllConfirmationText('');

      setSyncStatusMsg(`All ${patientList.length} patient record folders have been completely deleted.`);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } catch (err: any) {
      setIsDeletingAll(false);
      setDeleteAllError(err?.message || 'Failed to delete all patient records.');
    }
  };

  // 1-Click ZIP Download for Master Patients Record Folder
  const handleDownloadMasterZip = async () => {
    try {
      setIsExportingZip(true);
      setExportProgress(10);
      await exportAllPatientsRecordsZip(patients, allClinicData, (percent, currentName) => {
        setExportProgress(percent);
      });
      setIsExportingZip(false);
      setExportProgress(0);
      setSyncStatusMsg('Patients_Record.zip generated and downloaded to your computer!');
      setTimeout(() => setSyncStatusMsg(null), 4500);
    } catch (err: any) {
      setIsExportingZip(false);
      setExportProgress(0);
      alert(`Could not export zip: ${err?.message || 'Please try again.'}`);
    }
  };

  // Download single patient's folder as zip
  const handleDownloadPatientZip = async () => {
    if (!currentRecord) return;
    try {
      await exportSinglePatientFolderZip(currentRecord);
    } catch (err: any) {
      alert(`Export error: ${err?.message || 'Failed to download patient folder'}`);
    }
  };

  // Handle Quick Add Patient into Folder
  const handleCreatePatientFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      setAddPatientError('Patient name is required');
      return;
    }
    const cleanPh = newPatientPhone.trim().replace(/\D/g, '');
    if (cleanPh.length < 10) {
      setAddPatientError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setAddPatientError('');
      const res = await addPatient({
        name: newPatientName.trim(),
        phone: cleanPh.slice(-10),
        age: newPatientAge ? parseInt(newPatientAge, 10) : undefined,
        gender: newPatientGender,
        address: newPatientAddress.trim(),
        notes: newPatientNotes.trim()
      });

      if (res.success && res.id) {
        setSelectedPatientId(res.id);
        setIsAddPatientModalOpen(false);
        setNewPatientName('');
        setNewPatientPhone('');
        setNewPatientAge('');
        setNewPatientAddress('');
        setNewPatientNotes('');
        setSyncStatusMsg(`Patient folder "📁 ${newPatientName}" created and connected!`);
        setTimeout(() => setSyncStatusMsg(null), 4000);
      } else {
        setAddPatientError('Failed to create patient folder in database.');
      }
    } catch (err: any) {
      setAddPatientError(err?.message || 'Failed to save patient');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Patients Record Root Folder & Connection Status */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs font-semibold text-purple-200">
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Central Patient Dossier & File System</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Folder className="w-8 h-8 text-amber-400 shrink-0 fill-amber-400/20" />
              <span>Patients Record Folder</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Every patient has their own dedicated folder with all their information directly connected: 
              <strong> Profile</strong>, <strong>Prescriptions</strong>, <strong>Appointments</strong>, <strong>X-Rays/Docs</strong>, and <strong>Invoices</strong>.
            </p>

            {/* Connection Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/15 border border-teal-400/30 text-teal-300 rounded-xl font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Local Device Vault: Active ({localVaultStatus.count} Folders Saved Offline)</span>
              </span>

              {localDirHandle && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/40 text-blue-200 rounded-xl font-medium animate-pulse">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Local Computer Folder: <strong>/{localFolderName}</strong></span>
                </span>
              )}
            </div>
          </div>

          {/* Master Actions for Folder */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* 1-Click ZIP Download for the whole folder */}
            <button
              type="button"
              onClick={handleDownloadMasterZip}
              disabled={isExportingZip}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download the entire Patients Record folder hierarchy as a .ZIP archive"
            >
              <Download className={`w-4 h-4 ${isExportingZip ? 'animate-bounce' : ''}`} />
              <span>{isExportingZip ? `Exporting (${exportProgress}%)` : 'Download Master Folder (.zip)'}</span>
            </button>

            {/* Add New Patient Folder */}
            <button
              type="button"
              onClick={() => {
                setAddPatientError('');
                setIsAddPatientModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Patient Folder</span>
            </button>

            {/* Delete All Records Button in Master Header */}
            {patients.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllModal(true);
                  setDeleteAllConfirmationText('');
                  setDeleteAllError('');
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                title="Permanently delete all patient records quickly"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All Records</span>
              </button>
            )}
          </div>
        </div>

        {/* Live sync message */}
        {syncStatusMsg && (
          <div className="mt-4 p-3 bg-purple-900/60 border border-purple-400/40 rounded-xl text-xs text-purple-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
        )}
      </div>

      {/* Main 2-Column Layout: Left = Patient Folders List, Right = Selected Folder Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Folders Directory (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Directory: /Patients Record/
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {patients.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAllModal(true);
                    setDeleteAllConfirmationText('');
                    setDeleteAllError('');
                  }}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Clear all patient folders from directory"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>Clear All</span>
                </button>
              )}

              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                {filteredPatients.length} Folders
              </span>
            </div>
          </div>

          {/* Search Folder Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient folder by name or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>

          {/* List of Patient Folders */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-slate-400">
                No patient folder matched "{searchQuery}".
              </div>
            ) : (
              filteredPatients.map((p, idx) => {
                const isSelected = p.id === selectedPatientId;
                const folderLabel = sanitizeFolderName(p.name, p.phone);

                return (
                  <div
                    key={p.id || idx}
                    onClick={() => {
                      setSelectedPatientId(p.id || '');
                      setActiveFileView('overview');
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-purple-600 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isSelected ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4 fill-amber-500/30" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate">
                          {p.name || 'Unnamed Patient'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>{p.phone || 'No phone'}</span>
                          {p.age && <span>• {p.age}y</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToDelete(p);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title={`Delete ${p.name}'s folder`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className={`w-4 h-4 transition ${
                        isSelected ? 'text-purple-600 translate-x-0.5' : 'text-slate-300'
                      }`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Patient's Dossier & Sub-Folders (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {currentPatient && currentRecord ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              
              {/* Folder Breadcrumb & Header */}
              <div className="p-6 bg-gradient-to-r from-slate-50 via-purple-50/40 to-indigo-50/30 border-b border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700">
                      <span>Patients Record</span>
                      <span>/</span>
                      <span className="text-slate-900 font-bold">{sanitizeFolderName(currentPatient.name, currentPatient.phone)}</span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                      <span>{currentPatient.name}</span>
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-purple-600" />
                        <strong>{currentPatient.phone}</strong>
                      </span>
                      {currentPatient.age && (
                        <span>• Age: {currentPatient.age} yrs</span>
                      )}
                      {currentPatient.gender && (
                        <span>• Gender: {currentPatient.gender}</span>
                      )}
                      <span>• Total Registered Visits: <strong>{currentRecord.summary.totalVisits}</strong></span>
                    </div>
                  </div>

                  {/* Actions for this patient folder */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPatientZip}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      title="Download this single patient folder as a .zip"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Folder (.zip)</span>
                    </button>

                    {/* Delete Patient Folder button */}
                    <button
                      type="button"
                      onClick={() => setPatientToDelete(currentPatient)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      title="Delete this patient's folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Folder</span>
                    </button>
                  </div>
                </div>

                {/* Patient Quick Ledger Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-purple-100/60 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Prescriptions</span>
                    <span className="text-base font-bold text-slate-900">{currentRecord.summary.totalPrescriptions} files</span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Visits / Bookings</span>
                    <span className="text-base font-bold text-slate-900">{currentRecord.bookings.length} recorded</span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Documents / X-Rays</span>
                    <span className="text-base font-bold text-slate-900">{currentRecord.summary.totalDocuments} files</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${
                    currentRecord.summary.outstandingBalance > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <span className="text-[10px] uppercase font-bold block">Pending Balance</span>
                    <span className="text-base font-bold">
                      ₹ {currentRecord.summary.outstandingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Folders / Files Navigation inside this Patient's Folder */}
              <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold px-4 pt-2 bg-white">
                <button
                  type="button"
                  onClick={() => setActiveFileView('overview')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'overview'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span>Folder Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFileView('profile')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'profile'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>01_Profile.txt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFileView('prescriptions')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'prescriptions'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>02_Prescriptions ({currentRecord.prescriptions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFileView('visits')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'visits'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>03_Visits ({currentRecord.bookings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFileView('documents')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'documents'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>04_Documents ({currentRecord.documents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFileView('billing')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'billing'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>05_Billing ({currentRecord.invoices.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFileView('raw_json')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeFileView === 'raw_json'
                      ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span>patient_record.json</span>
                </button>
              </div>

              {/* View Content Body */}
              <div className="p-6">
                
                {/* 1. OVERVIEW: Folder Files Tree */}
                {activeFileView === 'overview' && (
                  <div className="space-y-6">
                    <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                        <span>Connected Files inside this Patient's Folder</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* File 1: Profile */}
                        <div 
                          onClick={() => setActiveFileView('profile')}
                          className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">01_Patient_Profile.txt</div>
                              <div className="text-[11px] text-slate-500">Demographics & Medical Profile</div>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Open</span>
                        </div>

                        {/* File 2: Prescriptions */}
                        <div 
                          onClick={() => setActiveFileView('prescriptions')}
                          className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                              <Stethoscope className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">02_Prescriptions_History.txt</div>
                              <div className="text-[11px] text-slate-500">{currentRecord.prescriptions.length} Prescriptions connected</div>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Open</span>
                        </div>

                        {/* File 3: Visits */}
                        <div 
                          onClick={() => setActiveFileView('visits')}
                          className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">03_Appointments_and_Visits.txt</div>
                              <div className="text-[11px] text-slate-500">{currentRecord.bookings.length} Visits recorded</div>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Open</span>
                        </div>

                        {/* File 4: Billing */}
                        <div 
                          onClick={() => setActiveFileView('billing')}
                          className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">04_Billing_and_Invoices.csv</div>
                              <div className="text-[11px] text-slate-500">{currentRecord.invoices.length} Invoices & Bills</div>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Open</span>
                        </div>

                        {/* File 5: Documents */}
                        <div 
                          onClick={() => setActiveFileView('documents')}
                          className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">05_Clinical_Documents_List.txt</div>
                              <div className="text-[11px] text-slate-500">{currentRecord.documents.length} Reports & X-Rays</div>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Open</span>
                        </div>

                        {/* File 6: Raw JSON */}
                        <div 
                          onClick={() => setActiveFileView('raw_json')}
                          className="p-3.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition shadow-2xs hover:shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">Full_Connected_Patient_Record.json</div>
                              <div className="text-[11px] text-slate-500">Master JSON Machine Record</div>
                            </div>
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Open</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Demographics Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Patient Profile Details
                        </h4>
                        <button
                          type="button"
                          onClick={() => setActiveFileView('profile')}
                          className="text-xs text-purple-600 font-bold flex items-center gap-1 hover:underline"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>View / Edit Details</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block">Full Name:</span>
                          <span className="font-bold text-slate-800">{currentPatient.name}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Phone:</span>
                          <span className="font-bold text-slate-800">{currentPatient.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Age & Gender:</span>
                          <span className="font-bold text-slate-800">
                            {currentPatient.age ? `${currentPatient.age} yrs` : 'N/A'} • {currentPatient.gender || 'N/A'}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block">Address:</span>
                          <span className="text-slate-800">{currentPatient.address || 'Supela, Bhilai, Chhattisgarh'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Registered On:</span>
                          <span className="text-slate-800">
                            {currentPatient.createdAt ? new Date(currentPatient.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {currentPatient.notes && (
                        <div className="pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-400 block mb-1">Clinical Notes & History:</span>
                          <p className="bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">
                            {currentPatient.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Folder Management & Danger Zone */}
                    <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span>Delete Patient Record Folder</span>
                        </div>
                        <p className="text-[11px] text-rose-700">
                          Permanently remove <strong>{currentPatient.name}</strong>'s folder and all connected files.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPatientToDelete(currentPatient)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Folder</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. PROFILE FILE VIEW */}
                {activeFileView === 'profile' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800 font-mono">01_Patient_Profile.txt</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const text = generatePatientProfileText(currentRecord);
                          const blob = new Blob([text], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${sanitizeFolderName(currentPatient.name, currentPatient.phone)}_Profile.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .txt</span>
                      </button>
                    </div>

                    <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap border border-slate-800">
                      {generatePatientProfileText(currentRecord)}
                    </pre>
                  </div>
                )}

                {/* 3. PRESCRIPTIONS FILE VIEW */}
                {activeFileView === 'prescriptions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 font-mono">02_Prescriptions_History.txt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const text = generatePrescriptionsText(currentRecord);
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${sanitizeFolderName(currentPatient.name, currentPatient.phone)}_Prescriptions.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>

                    {currentRecord.prescriptions.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No prescriptions attached to this patient yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentRecord.prescriptions.map((pr, idx) => (
                          <div key={pr.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full">
                                Prescription #{idx + 1} • {pr.date || pr.createdAt?.slice(0, 10)}
                              </span>
                              <div className="flex items-center gap-2">
                                {onOpenPrescriptionModal && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenPrescriptionModal(pr)}
                                    className="text-xs text-purple-600 font-bold flex items-center gap-1 hover:underline"
                                  >
                                    <span>Open Letterhead</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete({
                                    type: 'prescription',
                                    id: pr.id || '',
                                    title: `Prescription #${idx + 1} (${pr.date || 'Prescription'})`
                                  })}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete this prescription file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {pr.chiefComplaint && (
                              <div className="text-xs">
                                <strong className="text-slate-700">Chief Complaint: </strong>
                                <span className="text-slate-900">{pr.chiefComplaint}</span>
                              </div>
                            )}

                            {pr.treatmentAdvised && (
                              <div className="text-xs">
                                <strong className="text-slate-700">Treatment Advised: </strong>
                                <span className="text-slate-900">{pr.treatmentAdvised}</span>
                              </div>
                            )}

                            {pr.medicinesList && pr.medicinesList.length > 0 && (
                              <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                <strong className="text-slate-800 block mb-1">Medicines Prescribed:</strong>
                                {pr.medicinesList.map((m, mIdx) => (
                                  <div key={mIdx} className="text-slate-700">
                                    • <strong>{m.name}</strong> — {m.dosage} ({m.frequency}), {m.duration} ({m.instructions})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. VISITS FILE VIEW */}
                {activeFileView === 'visits' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800 font-mono">03_Appointments_and_Visits.txt</span>
                      </div>
                    </div>

                    {currentRecord.bookings.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No appointment booking entries logged. (Total registered visits: {currentRecord.summary.totalVisits})
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentRecord.bookings.map((b, idx) => (
                          <div key={b.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{b.service}</div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {b.date} at {b.timeSlot}
                              </div>
                              {b.problemDescription && (
                                <div className="text-slate-600 text-[11px] mt-1 bg-white p-2 rounded-lg border border-slate-200">
                                  {b.problemDescription}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-2.5">
                              <div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {b.status}
                                </span>
                                <div className="text-[11px] text-slate-500 mt-1">₹ {b.fee || 0}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setItemToDelete({
                                  type: 'booking',
                                  id: b.id || '',
                                  title: `Appointment: ${b.service} on ${b.date}`
                                })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete this appointment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. DOCUMENTS FILE VIEW */}
                {activeFileView === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-bold text-slate-800 font-mono">04_Documents_and_XRays/</span>
                      </div>
                      {onOpenAddDocumentModal && (
                        <button
                          type="button"
                          onClick={() => onOpenAddDocumentModal(currentPatient.id || '')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Document</span>
                        </button>
                      )}
                    </div>

                    {currentRecord.documents.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No X-Rays or clinical documents in this patient's folder yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentRecord.documents.map((d, idx) => (
                          <div key={d.id || idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                {d.category}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">{d.documentDate}</span>
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete({
                                    type: 'document',
                                    id: d.id || '',
                                    title: `Document: ${d.title}`
                                  })}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  title="Delete this document file"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-900 truncate">
                              {d.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {d.fileName} ({Math.round((d.fileSize || 0) / 1024)} KB)
                            </div>

                            {d.description && (
                              <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 line-clamp-2">
                                {d.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. BILLING FILE VIEW */}
                {activeFileView === 'billing' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-800 font-mono">04_Billing_and_Invoices.csv</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const csv = generateInvoicesCsv(currentRecord);
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${sanitizeFolderName(currentPatient.name, currentPatient.phone)}_Invoices.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download .csv</span>
                        </button>

                        {onOpenAddInvoiceModal && (
                          <button
                            type="button"
                            onClick={() => onOpenAddInvoiceModal(currentPatient.id || '')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create Invoice</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {currentRecord.invoices.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No invoices billed to this patient yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                              <th className="py-2.5 px-3">Invoice #</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Treatment</th>
                              <th className="py-2.5 px-3">Billed</th>
                              <th className="py-2.5 px-3">Paid</th>
                              <th className="py-2.5 px-3">Balance</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {currentRecord.invoices.map((inv, idx) => (
                              <tr key={inv.id || idx} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                                <td className="py-2.5 px-3 text-slate-600">{inv.invoiceDate}</td>
                                <td className="py-2.5 px-3 text-slate-800">{inv.treatmentDescription}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">₹ {inv.finalAmount}</td>
                                <td className="py-2.5 px-3 text-emerald-600 font-semibold">₹ {inv.amountPaid || 0}</td>
                                <td className="py-2.5 px-3 font-semibold text-rose-600">₹ {inv.outstandingBalance || 0}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inv.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {inv.paymentStatus}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setItemToDelete({
                                      type: 'invoice',
                                      id: inv.id || '',
                                      title: `Invoice #${inv.invoiceNumber || 'INV'}`
                                    })}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                    title="Delete this invoice"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 7. RAW JSON FILE VIEW */}
                {activeFileView === 'raw_json' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-bold text-slate-800 font-mono">Full_Connected_Patient_Record.json</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const json = JSON.stringify(currentRecord, null, 2);
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${sanitizeFolderName(currentPatient.name, currentPatient.phone)}_Record.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .json</span>
                      </button>
                    </div>

                    <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[500px]">
                      {JSON.stringify(currentRecord, null, 2)}
                    </pre>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold">No patient folder selected.</p>
              <p className="text-xs text-slate-400 mt-1">Select a patient folder from the left directory.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW PATIENT FOLDER MODAL */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                <h3 className="text-base font-bold text-slate-900">Create New Patient Folder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPatientModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatientFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    placeholder="e.g. 35"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / Address
                  </label>
                  <input
                    type="text"
                    value={newPatientAddress}
                    onChange={(e) => setNewPatientAddress(e.target.value)}
                    placeholder="e.g. Supela, Bhilai"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Clinical Notes / Medical History
                </label>
                <textarea
                  rows={2}
                  value={newPatientNotes}
                  onChange={(e) => setNewPatientNotes(e.target.value)}
                  placeholder="e.g. Tooth sensitivity, history of hypertension..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {addPatientError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addPatientError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPatientModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORAGE SPECS MODAL */}
      {showStorageSpecsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-900 rounded-xl">
                  <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Specific Storage of "Patients Record" Folder</h3>
                  <p className="text-[11px] text-slate-500">Cloud database specifications & local drive sync path</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStorageSpecsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Cloud Storage Specifics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>1. Cloud Storage Specifications (Firebase / Google Cloud)</span>
              </h4>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Firebase Project ID:</span>
                  <span className="font-mono font-bold text-slate-800">cool-botany-vhl8x</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Firestore Database ID:</span>
                  <span className="font-mono font-bold text-purple-700">ai-studio-4e6415f4-3a7d-469f-aece-f24c614530d3</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Cloud Storage Bucket:</span>
                  <span className="font-mono text-slate-800">cool-botany-vhl8x.firebasestorage.app</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Storage Encryption:</span>
                  <span className="text-emerald-700 font-bold">AES-256 (At-Rest & In-Transit)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Access Control (RBAC):</span>
                  <span className="text-slate-700 font-semibold">Clinic Staff & Admin Only (firestore.rules)</span>
                </div>
              </div>
            </div>

            {/* Section 2: Local Computer Folder Specifics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>2. Local Computer Folder Specifications</span>
              </h4>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Local Folder Status:</span>
                  <span className="font-bold">
                    {localDirHandle ? (
                      <span className="text-emerald-600">🟢 Connected (/{localFolderName})</span>
                    ) : (
                      <span className="text-amber-600">🟡 Not Connected (Click 'Connect Folder on PC')</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Folder Path Location:</span>
                  <span className="text-slate-800 font-medium">{localFolderName ? `/${localFolderName}` : 'Any directory on your PC (Desktop/Documents)'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500">Sync Technology:</span>
                  <span className="text-slate-700">Native Web File System Access API</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Backup Archive Format:</span>
                  <span className="text-slate-700 font-mono">Patients_Record.zip (Standard ZIP)</span>
                </div>
              </div>
            </div>

            {/* Section 3: Folder Hierarchy & Structure */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Sub-Folder & File Organization
              </h4>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto">
{`📁 Patients Record/
  ├── Master_Patients_Index.csv
  ├── Master_Patients_Index.json
  └── 📁 [Patient_Name]_[Phone]/
        ├── 01_Patient_Profile.txt & .json
        ├── 02_Prescriptions_History.txt
        ├── 03_Appointments_and_Visits.txt
        ├── 04_Billing_and_Invoices.csv
        ├── 05_Clinical_Documents_List.txt
        └── Full_Connected_Patient_Record.json`}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStorageSpecsModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: DELETE PATIENT RECORD FOLDER CONFIRMATION             */}
      {/* ============================================================== */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Patient Record Folder</h3>
                <p className="text-xs text-rose-600 font-semibold">Permanently removes patient folder & dossier</p>
              </div>
            </div>

            {/* Folder Identification Box */}
            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <span className="font-mono text-xs text-purple-950">
                  📁 /Patients Record/{sanitizeFolderName(patientToDelete.name, patientToDelete.phone)}/
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-rose-200/60">
                <div>
                  <span className="text-slate-400 block">Patient Name:</span>
                  <span className="font-bold text-slate-800">{patientToDelete.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <span className="font-bold text-slate-800">{patientToDelete.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Warning Details */}
            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                Are you sure you want to delete this patient record folder? This action cannot be undone.
              </p>

              {/* Cascade Deletion Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
                <input
                  type="checkbox"
                  checked={deleteCascadeData}
                  onChange={(e) => setDeleteCascadeData(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  <strong>Delete all connected records:</strong> Remove prescriptions, appointments, clinical documents/X-rays, and invoices linked to this patient from the database.
                </span>
              </label>

              {localDirHandle && (
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                  <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Will also remove this patient's sub-folder from your connected PC drive (<strong>/{localFolderName}</strong>).
                  </span>
                </div>
              )}
            </div>

            {deletePatientError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deletePatientError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingPatient}
                onClick={() => {
                  setPatientToDelete(null);
                  setDeletePatientError('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingPatient}
                onClick={handleConfirmDeleteFolder}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {isDeletingPatient ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Folder...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Permanently Delete Folder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: FOLDER CONNECTION ASSISTANT & RESOLUTION GUIDE        */}
      {/* ============================================================== */}
      {showFolderConnectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                  <HardDrive className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Connect Patients Record Folder on Computer</h3>
                  <p className="text-xs text-slate-500">How to directly save, synchronize, and export all patient folders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFolderConnectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostics Explanation Notice */}
            <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs space-y-1.5 text-amber-950">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Why does browser folder connection require a step?</span>
              </div>
              <p className="leading-relaxed text-amber-900/90 text-[11px]">
                Web browsers (Chrome & Edge) protect your computer by only allowing direct hard-drive writing when the app is open in a standalone browser tab. Embedded preview frames block direct disk access for your security.
              </p>
              {folderConnectErrorMsg && (
                <div className="mt-2 p-2 bg-white/70 rounded-lg font-mono text-[10px] text-amber-800 break-words">
                  Diagnostic note: {folderConnectErrorMsg}
                </div>
              )}
            </div>

            {/* 3 Resolution Options */}
            <div className="space-y-3 text-xs">
              
              {/* Option 1: 1-Click Master ZIP Export */}
              <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded-md text-[10px] uppercase">
                      Recommended • 100% Works
                    </span>
                    <h4 className="font-bold text-slate-900">1. Instant Master Folder (.zip) Download</h4>
                  </div>
                  <Download className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Click once to download <strong>Patients_Record.zip</strong>. Extract it anywhere on your computer (C:\, D:\, Documents). Each patient has their own dedicated subfolder with Profile, Prescriptions, Visits, Docs, and Invoices.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderConnectModal(false);
                    handleDownloadMasterZip();
                  }}
                  disabled={isExportingZip}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Complete Patients Record (.zip)</span>
                </button>
              </div>

              {/* Option 2: Open Standalone Tab */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[10px] uppercase">
                      Native PC Link
                    </span>
                    <h4 className="font-bold text-slate-900">2. Open Clinic in Standalone Tab</h4>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Opens the clinic directly in a new browser tab outside of any preview frame. In a standalone tab, you can click <strong>"Connect Folder on PC"</strong> to select a folder on your drive with full native permissions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.open(window.location.href, '_blank');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open App in New Tab to Connect PC Folder</span>
                </button>
              </div>

              {/* Option 3: Local Device Vault */}
              <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-teal-600 text-white font-bold rounded-md text-[10px] uppercase">
                      Always Active
                    </span>
                    <h4 className="font-bold text-teal-950">3. In-Browser Device Vault & Cloud Sync</h4>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-teal-900 text-[11px] leading-relaxed">
                  All {patients.length} patient records are continuously mirrored in real time into both the Google Cloud Firestore database and your device's browser vault ({localVaultStatus.count} folders currently cached offline).
                </p>
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFolderConnectModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DELETE ALL RECORDS / CLEAR PATIENTS RECORD FOLDER      */}
      {/* ============================================================== */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-300 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <FolderX className="w-7 h-7 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Delete All Patient Records</h3>
                <p className="text-xs text-rose-600 font-bold">Clear the entire Patients Record folder directory</p>
              </div>
            </div>

            {/* Impact Warning Statistics */}
            <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-3 text-xs">
              <div className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>The following items will be permanently erased:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-400 block font-medium">Patient Folders</span>
                  <span className="text-base font-black text-rose-700">{patients.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-400 block font-medium">Prescriptions</span>
                  <span className="text-base font-black text-purple-700">{prescriptions.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-400 block font-medium">Appointments</span>
                  <span className="text-base font-black text-indigo-700">{bookings.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-400 block font-medium">Docs & X-Rays</span>
                  <span className="text-base font-black text-blue-700">{documents.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-400 block font-medium">Invoices & Bills</span>
                  <span className="text-base font-black text-amber-700">{invoices.length}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-slate-400 block font-medium">Device Cache</span>
                  <span className="text-base font-black text-emerald-700">Wiped Clean</span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 text-xs text-slate-700">
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
                <input
                  type="checkbox"
                  checked={deleteAllCascade}
                  onChange={(e) => setDeleteAllCascade(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="leading-snug">
                  <strong>Delete all connected clinical data:</strong> Erase all prescriptions, bookings, documents, and bills from the database alongside the patient folders.
                </span>
              </label>

              {localDirHandle && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Will also remove all patient subfolders from your connected computer folder (<strong>/{localFolderName}</strong>).</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800">
                    Type <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE ALL</span> to confirm:
                  </label>
                  <button
                    type="button"
                    onClick={() => setDeleteAllConfirmationText('DELETE ALL')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    Auto-fill "DELETE ALL"
                  </button>
                </div>
                <input
                  type="text"
                  value={deleteAllConfirmationText}
                  onChange={(e) => setDeleteAllConfirmationText(e.target.value)}
                  placeholder="Type DELETE ALL or click button below"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {deleteAllError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteAllError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteAllError('');
                  setDeleteAllConfirmationText('');
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => {
                  setDeleteAllConfirmationText('DELETE ALL');
                  handleConfirmDeleteAllRecords();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Erasing All Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Quick Delete All Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DELETE SINGLE FILE INSIDE PATIENT FOLDER              */}
      {/* ============================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete File from Folder</h3>
                <p className="text-[11px] text-slate-500 capitalize">{itemToDelete.type} entry</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>"{itemToDelete.title}"</strong> from {currentPatient?.name}'s folder?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingItem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete File</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
