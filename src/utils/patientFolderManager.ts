import JSZip from 'jszip';
import { 
  Patient, 
  Prescription, 
  Booking, 
  PatientDocument, 
  Invoice, 
  PatientPayment, 
  AuditLog 
} from '../types/clinic';

export interface ConnectedPatientRecord {
  patient: Patient;
  prescriptions: Prescription[];
  bookings: Booking[];
  documents: PatientDocument[];
  invoices: Invoice[];
  payments: PatientPayment[];
  auditLogs: AuditLog[];
  summary: {
    totalVisits: number;
    totalPrescriptions: number;
    totalDocuments: number;
    totalInvoices: number;
    totalBilled: number;
    totalPaid: number;
    outstandingBalance: number;
    lastVisitDate?: string;
  };
}

export interface AllClinicDataForFolder {
  prescriptions: Prescription[];
  bookings: Booking[];
  documents: PatientDocument[];
  invoices: Invoice[];
  patientPayments: PatientPayment[];
  auditLogs: AuditLog[];
}

/**
 * Builds a single connected dossier for a patient, gathering all their linked data
 */
export function buildConnectedPatientRecord(
  patient: Patient,
  allData: AllClinicDataForFolder
): ConnectedPatientRecord {
  const patientId = patient.id || '';
  const cleanPhone = (patient.phone || '').replace(/\D/g, '').slice(-10);
  const patientNameLower = (patient.name || '').trim().toLowerCase();

  // Connected prescriptions
  const matchedPrescriptions = (allData.prescriptions || []).filter(p => {
    if (patientId && p.patientId === patientId) return true;
    if (cleanPhone && p.patientPhone && p.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
    if (patientNameLower && (p.patientName || '').trim().toLowerCase() === patientNameLower) return true;
    return false;
  }).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));

  // Connected bookings / visits
  const matchedBookings = (allData.bookings || []).filter(b => {
    if (cleanPhone && b.phone && b.phone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
    if (patientNameLower && (b.patientName || '').trim().toLowerCase() === patientNameLower) return true;
    return false;
  }).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));

  // Connected documents & X-Rays
  const matchedDocuments = (allData.documents || []).filter(d => {
    if (patientId && d.patientId === patientId) return true;
    if (cleanPhone && d.patientPhone && d.patientPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
    return false;
  }).sort((a, b) => (b.documentDate || b.createdAt || '').localeCompare(a.documentDate || a.createdAt || ''));

  // Connected invoices
  const matchedInvoices = (allData.invoices || []).filter(inv => {
    return patientId && inv.patientId === patientId;
  }).sort((a, b) => (b.invoiceDate || b.createdAt || '').localeCompare(a.invoiceDate || a.createdAt || ''));

  // Connected payments
  const matchedPayments = (allData.patientPayments || []).filter(pay => {
    return patientId && pay.patientId === patientId;
  }).sort((a, b) => (b.paymentDate || b.createdAt || '').localeCompare(a.paymentDate || a.createdAt || ''));

  // Connected audit logs
  const matchedAudit = (allData.auditLogs || []).filter(a => {
    return patientId && a.patientId === patientId;
  }).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  // Financial calculations
  const totalBilled = matchedInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0);
  const totalPaid = matchedInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const outstandingBalance = Math.max(0, totalBilled - totalPaid);

  // Visit counting
  const totalVisits = Math.max(patient.totalVisits || 1, matchedBookings.length, matchedPrescriptions.length);
  const lastVisitDate = patient.lastVisit || matchedPrescriptions[0]?.date || matchedBookings[0]?.date || patient.createdAt?.slice(0, 10);

  return {
    patient,
    prescriptions: matchedPrescriptions,
    bookings: matchedBookings,
    documents: matchedDocuments,
    invoices: matchedInvoices,
    payments: matchedPayments,
    auditLogs: matchedAudit,
    summary: {
      totalVisits,
      totalPrescriptions: matchedPrescriptions.length,
      totalDocuments: matchedDocuments.length,
      totalInvoices: matchedInvoices.length,
      totalBilled,
      totalPaid,
      outstandingBalance,
      lastVisitDate
    }
  };
}

/**
 * Clean folder-safe name
 */
export function sanitizeFolderName(name: string, phone: string): string {
  const cleanName = (name || 'Unnamed_Patient').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  return cleanPhone ? `${cleanName}_${cleanPhone}` : cleanName;
}

/**
 * Text representation of Patient Profile
 */
export function generatePatientProfileText(record: ConnectedPatientRecord): string {
  const p = record.patient;
  return `======================================================================
               ANU-JAY DENTAL CLINIC - PATIENT RECORD
======================================================================
Generated: ${new Date().toLocaleString('en-IN')}
Folder: Patients Record / ${sanitizeFolderName(p.name, p.phone)}

--- 1. BASIC DEMOGRAPHICS ---
Patient Name   : ${p.name || 'N/A'}
Phone Number   : ${p.phone || 'N/A'}
Age / Gender   : ${p.age ? `${p.age} yrs` : 'N/A'} / ${p.gender || 'N/A'}
Address        : ${p.address || 'N/A'}
Patient ID     : ${p.id || 'N/A'}
Registered Date: ${p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A'}

--- 2. CLINICAL PROFILE & MEDICAL ALERTS ---
Total Visits   : ${record.summary.totalVisits}
Last Visit     : ${record.summary.lastVisitDate || 'N/A'}
Clinical Notes : ${p.notes || 'None recorded'}

--- 3. CONNECTED DOSSIER SUMMARY ---
Total Prescriptions : ${record.summary.totalPrescriptions}
Total Visits / Appts: ${record.bookings.length}
Total Medical Docs  : ${record.summary.totalDocuments}
Total Invoices      : ${record.summary.totalInvoices}
Total Billed Amount : ₹ ${record.summary.totalBilled.toLocaleString('en-IN')}
Total Amount Paid   : ₹ ${record.summary.totalPaid.toLocaleString('en-IN')}
Outstanding Balance : ₹ ${record.summary.outstandingBalance.toLocaleString('en-IN')}
======================================================================
`;
}

/**
 * Text representation of Prescriptions History
 */
export function generatePrescriptionsText(record: ConnectedPatientRecord): string {
  if (record.prescriptions.length === 0) {
    return `No prescriptions recorded for ${record.patient.name}.\n`;
  }

  let text = `======================================================================
         PRESCRIPTION & CLINICAL TREATMENT HISTORY - ${record.patient.name.toUpperCase()}
======================================================================\n\n`;

  record.prescriptions.forEach((pr, idx) => {
    text += `[PRESCRIPTION #${idx + 1}] Date: ${pr.date || pr.createdAt?.slice(0, 10) || 'N/A'}\n`;
    text += `Doctor: ${pr.doctorName || 'Dr. Anujay Dental Specialist'}\n`;
    if (pr.chiefComplaint) text += `Chief Complaint (C/C) : ${pr.chiefComplaint}\n`;
    if (pr.onExamination)  text += `On Examination (O/E)  : ${pr.onExamination}\n`;
    if (pr.treatmentAdvised) text += `Treatment Advised     : ${pr.treatmentAdvised}\n`;

    if (pr.medicinesList && pr.medicinesList.length > 0) {
      text += `\nMedicines Prescribed:\n`;
      pr.medicinesList.forEach((m, mIdx) => {
        text += `  ${mIdx + 1}. ${m.name} | Dose: ${m.dosage} | Frequency: ${m.frequency} | Duration: ${m.duration} | Note: ${m.instructions}\n`;
      });
    } else if (pr.prescriptionText) {
      text += `Prescription Notes: ${pr.prescriptionText}\n`;
    }

    if (pr.visitNotes) text += `Doctor Visit Notes: ${pr.visitNotes}\n`;
    text += `----------------------------------------------------------------------\n\n`;
  });

  return text;
}

/**
 * Text representation of Appointments & Visits
 */
export function generateVisitsText(record: ConnectedPatientRecord): string {
  if (record.bookings.length === 0) {
    return `No online bookings or formal appointments recorded for ${record.patient.name}.\nTotal registered visits: ${record.summary.totalVisits}\n`;
  }

  let text = `======================================================================
         APPOINTMENTS & VISIT RECORDS - ${record.patient.name.toUpperCase()}
======================================================================\n\n`;

  record.bookings.forEach((b, idx) => {
    text += `[APPOINTMENT #${idx + 1}]\n`;
    text += `Date & Time Slot : ${b.date} at ${b.timeSlot}\n`;
    text += `Service / Reason : ${b.service}\n`;
    text += `Status           : ${b.status} | Payment: ${b.paymentStatus}\n`;
    text += `Consultation Fee : ₹ ${b.fee || 0}\n`;
    if (b.problemDescription) text += `Problem Notes    : ${b.problemDescription}\n`;
    text += `----------------------------------------------------------------------\n`;
  });

  return text;
}

/**
 * CSV representation of Invoices & Billing
 */
export function generateInvoicesCsv(record: ConnectedPatientRecord): string {
  const headers = ['Invoice Number', 'Date', 'Treatment Description', 'Gross Amount', 'Discount', 'Final Billed', 'Amount Paid', 'Balance Due', 'Status'];
  const rows = record.invoices.map(inv => [
    `"${inv.invoiceNumber || 'INV'}"`,
    `"${inv.invoiceDate || ''}"`,
    `"${(inv.treatmentDescription || '').replace(/"/g, '""')}"`,
    inv.totalCharges || 0,
    inv.discount || 0,
    inv.finalAmount || 0,
    inv.amountPaid || 0,
    inv.outstandingBalance || 0,
    `"${inv.paymentStatus || 'Pending'}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Documents list text
 */
export function generateDocumentsListText(record: ConnectedPatientRecord): string {
  if (record.documents.length === 0) {
    return `No clinical documents, X-Rays, or lab reports attached for ${record.patient.name}.\n`;
  }

  let text = `======================================================================
         CLINICAL DOCUMENTS & X-RAYS LIST - ${record.patient.name.toUpperCase()}
======================================================================\n\n`;

  record.documents.forEach((d, idx) => {
    text += `[DOCUMENT #${idx + 1}] Title: ${d.title}\n`;
    text += `Category   : ${d.category}\n`;
    text += `Date       : ${d.documentDate || 'N/A'}\n`;
    text += `File Name  : ${d.fileName} (${d.fileType}, ${Math.round((d.fileSize || 0) / 1024)} KB)\n`;
    if (d.description) text += `Description: ${d.description}\n`;
    text += `Uploader   : ${d.uploaderName || 'Staff'}\n`;
    text += `----------------------------------------------------------------------\n`;
  });

  return text;
}

/**
 * Trigger download of a Blob
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export a single patient's folder as a .ZIP archive
 */
export async function exportSinglePatientFolderZip(record: ConnectedPatientRecord): Promise<void> {
  const zip = new JSZip();
  const folderName = sanitizeFolderName(record.patient.name, record.patient.phone);
  const patientFolder = zip.folder(folderName) || zip;

  // Add files to folder
  patientFolder.file('01_Patient_Profile.txt', generatePatientProfileText(record));
  patientFolder.file('01_Patient_Profile.json', JSON.stringify(record.patient, null, 2));
  patientFolder.file('02_Prescriptions_History.txt', generatePrescriptionsText(record));
  patientFolder.file('03_Appointments_and_Visits.txt', generateVisitsText(record));
  patientFolder.file('04_Billing_and_Invoices.csv', generateInvoicesCsv(record));
  patientFolder.file('05_Clinical_Documents_List.txt', generateDocumentsListText(record));
  patientFolder.file('Full_Connected_Patient_Record.json', JSON.stringify(record, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, `${folderName}_Record.zip`);
}

/**
 * Export all patients records into a Master "Patients_Record.zip" folder
 */
export async function exportAllPatientsRecordsZip(
  patients: Patient[],
  allData: AllClinicDataForFolder,
  onProgress?: (percent: number, currentName: string) => void
): Promise<void> {
  const zip = new JSZip();
  const masterFolder = zip.folder('Patients_Record') || zip;

  // Root README
  masterFolder.file('README.txt', `ANU-JAY DENTAL CLINIC - MASTER PATIENTS RECORD FOLDER
Generated: ${new Date().toLocaleString('en-IN')}
Total Patient Folders: ${patients.length}

Structure:
  Patients_Record/
    Master_Patients_Index.csv
    Master_Patients_Index.json
    [Patient_Name]_[Phone]/
      01_Patient_Profile.txt
      01_Patient_Profile.json
      02_Prescriptions_History.txt
      03_Appointments_and_Visits.txt
      04_Billing_and_Invoices.csv
      05_Clinical_Documents_List.txt
      Full_Connected_Patient_Record.json
`);

  // Master CSV Index
  const masterCsvHeaders = ['S.No', 'Patient Name', 'Phone', 'Age', 'Gender', 'Address', 'Total Visits', 'Last Visit', 'Prescriptions Count', 'Outstanding Balance'];
  const masterCsvRows: string[] = [];

  const allRecords: ConnectedPatientRecord[] = [];

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    const record = buildConnectedPatientRecord(p, allData);
    allRecords.push(record);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / patients.length) * 100), p.name);
    }

    const folderName = `${String(i + 1).padStart(2, '0')}_${sanitizeFolderName(p.name, p.phone)}`;
    const subFolder = masterFolder.folder(folderName);
    if (subFolder) {
      subFolder.file('01_Patient_Profile.txt', generatePatientProfileText(record));
      subFolder.file('01_Patient_Profile.json', JSON.stringify(p, null, 2));
      subFolder.file('02_Prescriptions_History.txt', generatePrescriptionsText(record));
      subFolder.file('03_Appointments_and_Visits.txt', generateVisitsText(record));
      subFolder.file('04_Billing_and_Invoices.csv', generateInvoicesCsv(record));
      subFolder.file('05_Clinical_Documents_List.txt', generateDocumentsListText(record));
      subFolder.file('Full_Connected_Patient_Record.json', JSON.stringify(record, null, 2));
    }

    masterCsvRows.push([
      i + 1,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.phone || ''}"`,
      p.age || '',
      `"${p.gender || ''}"`,
      `"${(p.address || '').replace(/"/g, '""')}"`,
      record.summary.totalVisits,
      `"${record.summary.lastVisitDate || ''}"`,
      record.summary.totalPrescriptions,
      record.summary.outstandingBalance
    ].join(','));
  }

  masterFolder.file('Master_Patients_Index.csv', [masterCsvHeaders.join(','), ...masterCsvRows].join('\n'));
  masterFolder.file('Master_Patients_Index.json', JSON.stringify(patients, null, 2));

  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(Math.round(metadata.percent), 'Generating zip...');
    }
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(content, `Patients_Record_${dateStr}.zip`);
}

/**
 * Check if the app is currently running inside an iframe (like AI Studio preview)
 */
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Check if browser supports Web File System Access API (showDirectoryPicker)
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export type FolderConnectionResult = 
  | { success: true; handle: any; folderName: string }
  | { success: false; reason: 'UNSUPPORTED_BROWSER' | 'IFRAME_RESTRICTED' | 'USER_CANCELLED' | 'UNKNOWN'; message: string };

/**
 * Request user to pick a folder on their local computer (e.g., "Patients Record")
 */
export async function connectLocalComputerFolder(): Promise<FolderConnectionResult> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      reason: 'UNSUPPORTED_BROWSER',
      message: 'Your current browser or device does not support direct local directory write permissions (common on mobile, Safari, or older browsers). You can use the 1-Click ZIP Download instead.'
    };
  }

  try {
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });
    return {
      success: true,
      handle: dirHandle,
      folderName: dirHandle.name || 'Patients Record'
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (err?.name === 'AbortError') {
      return {
        success: false,
        reason: 'USER_CANCELLED',
        message: 'Folder selection was cancelled.'
      };
    }
    if (err?.name === 'SecurityError' || errMsg.toLowerCase().includes('cross-origin') || errMsg.toLowerCase().includes('iframe') || isRunningInIframe()) {
      return {
        success: false,
        reason: 'IFRAME_RESTRICTED',
        message: 'Browser security blocks direct hard-drive writing from inside an embedded preview frame. You can download the complete master folder (.zip) directly, or open the app in a standalone tab.'
      };
    }
    return {
      success: false,
      reason: 'UNKNOWN',
      message: errMsg || 'Failed to connect local computer folder.'
    };
  }
}

/**
 * Delete a patient's sub-folder from the connected local computer directory
 */
export async function removePatientLocalFolder(
  rootDirectoryHandle: any,
  patientName: string,
  patientPhone: string
): Promise<boolean> {
  if (!rootDirectoryHandle) return false;
  try {
    const folderName = sanitizeFolderName(patientName, patientPhone);
    // @ts-ignore
    await rootDirectoryHandle.removeEntry(folderName, { recursive: true });
    return true;
  } catch (err) {
    console.warn('Could not remove folder from local computer directory:', err);
    return false;
  }
}

/**
 * Local Device Vault persistence (stores connected records in browser local storage as offline mirror)
 */
const LOCAL_VAULT_KEY = 'anu_dental_patient_records_vault_v1';

export function savePatientFoldersToLocalVault(
  patients: Patient[],
  allData: AllClinicDataForFolder
): { totalFolders: number; lastSaved: string } {
  try {
    const manifest = {
      savedAt: new Date().toISOString(),
      count: patients.length,
      patients: patients.map(p => {
        const record = buildConnectedPatientRecord(p, allData);
        return {
          id: p.id,
          name: p.name,
          phone: p.phone,
          folderName: sanitizeFolderName(p.name, p.phone),
          summary: record.summary,
          profileSnippet: generatePatientProfileText(record).slice(0, 500)
        };
      })
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(manifest));
    }
    return { totalFolders: patients.length, lastSaved: manifest.savedAt };
  } catch (e) {
    console.warn('Local vault storage notice:', e);
    return { totalFolders: patients.length, lastSaved: new Date().toISOString() };
  }
}

export function getLocalVaultStatus(): { isAvailable: boolean; count: number; lastSaved?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { isAvailable: false, count: 0 };
    }
    const raw = window.localStorage.getItem(LOCAL_VAULT_KEY);
    if (!raw) return { isAvailable: true, count: 0 };
    const parsed = JSON.parse(raw);
    return {
      isAvailable: true,
      count: parsed.count || 0,
      lastSaved: parsed.savedAt
    };
  } catch (e) {
    return { isAvailable: false, count: 0 };
  }
}

/**
 * Directly sync/write all patient folders into the connected local computer directory
 */
export async function syncToConnectedLocalFolder(
  rootDirectoryHandle: any,
  patients: Patient[],
  allData: AllClinicDataForFolder,
  onProgress?: (percent: number, currentName: string) => void
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // 1. Write root README
    const readmeHandle = await rootDirectoryHandle.getFileHandle('README.txt', { create: true });
    const readmeWritable = await readmeHandle.createWritable();
    await readmeWritable.write(`ANU-JAY DENTAL CLINIC - LOCAL PATIENTS RECORD FOLDER
Last Synced: ${new Date().toLocaleString('en-IN')}
Total Patient Folders: ${patients.length}

All patient data is directly connected and synced here.
Each patient has their own sub-folder containing:
- 01_Patient_Profile.txt & .json
- 02_Prescriptions_History.txt
- 03_Appointments_and_Visits.txt
- 04_Billing_and_Invoices.csv
- 05_Clinical_Documents_List.txt
- Full_Connected_Patient_Record.json
`);
    await readmeWritable.close();

    // 2. Master index CSV
    const indexHandle = await rootDirectoryHandle.getFileHandle('Master_Patients_Index.csv', { create: true });
    const indexWritable = await indexHandle.createWritable();
    const csvHeaders = ['S.No', 'Patient Name', 'Phone', 'Age', 'Gender', 'Address', 'Total Visits', 'Last Visit', 'Prescriptions Count', 'Outstanding Balance'];
    const csvRows: string[] = [];

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      const record = buildConnectedPatientRecord(p, allData);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / patients.length) * 100), p.name);
      }

      // Create or get sub-folder for patient
      const folderName = sanitizeFolderName(p.name, p.phone);
      const patientDirHandle = await rootDirectoryHandle.getDirectoryHandle(folderName, { create: true });

      // Write Profile text
      const pTextHandle = await patientDirHandle.getFileHandle('01_Patient_Profile.txt', { create: true });
      const pTextWritable = await pTextHandle.createWritable();
      await pTextWritable.write(generatePatientProfileText(record));
      await pTextWritable.close();

      // Write Profile JSON
      const pJsonHandle = await patientDirHandle.getFileHandle('01_Patient_Profile.json', { create: true });
      const pJsonWritable = await pJsonHandle.createWritable();
      await pJsonWritable.write(JSON.stringify(p, null, 2));
      await pJsonWritable.close();

      // Write Prescriptions
      const rxHandle = await patientDirHandle.getFileHandle('02_Prescriptions_History.txt', { create: true });
      const rxWritable = await rxHandle.createWritable();
      await rxWritable.write(generatePrescriptionsText(record));
      await rxWritable.close();

      // Write Appointments
      const apptHandle = await patientDirHandle.getFileHandle('03_Appointments_and_Visits.txt', { create: true });
      const apptWritable = await apptHandle.createWritable();
      await apptWritable.write(generateVisitsText(record));
      await apptWritable.close();

      // Write Invoices CSV
      const invHandle = await patientDirHandle.getFileHandle('04_Billing_and_Invoices.csv', { create: true });
      const invWritable = await invHandle.createWritable();
      await invWritable.write(generateInvoicesCsv(record));
      await invWritable.close();

      // Write Documents List
      const docHandle = await patientDirHandle.getFileHandle('05_Clinical_Documents_List.txt', { create: true });
      const docWritable = await docHandle.createWritable();
      await docWritable.write(generateDocumentsListText(record));
      await docWritable.close();

      // Write Full JSON
      const fullHandle = await patientDirHandle.getFileHandle('Full_Connected_Patient_Record.json', { create: true });
      const fullWritable = await fullHandle.createWritable();
      await fullWritable.write(JSON.stringify(record, null, 2));
      await fullWritable.close();

      csvRows.push([
        i + 1,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.phone || ''}"`,
        p.age || '',
        `"${p.gender || ''}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        record.summary.totalVisits,
        `"${record.summary.lastVisitDate || ''}"`,
        record.summary.totalPrescriptions,
        record.summary.outstandingBalance
      ].join(','));
    }

    await indexWritable.write([csvHeaders.join(','), ...csvRows].join('\n'));
    await indexWritable.close();

    return { success: true, count: patients.length };
  } catch (err: any) {
    console.error('Error syncing to local folder:', err);
    return { success: false, count: 0, error: err?.message || 'Failed to write to folder' };
  }
}
