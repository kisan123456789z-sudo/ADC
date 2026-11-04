import React, { useState } from 'react';
import { 
  Bell, 
  Package, 
  FileText, 
  Users, 
  Edit3, 
  Check, 
  CheckCircle2, 
  Plus, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  Phone, 
  DollarSign, 
  Trash2, 
  X, 
  MessageCircle, 
  Save, 
  ChevronRight, 
  AlertTriangle,
  Stethoscope,
  Send,
  LogOut,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Megaphone,
  Folder
} from 'lucide-react';
import { StaffNoticeComposer } from './notices/StaffNoticeComposer';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { Booking, InventoryItem, Patient, Prescription, AboutContent, FaqItem, HighlightItem } from '../../types/clinic';
import { DOCTOR_PHOTO_PRESETS } from '../../services/seedData';
import { compressImageFile } from '../../utils/fileStorageHelper';
import { generatePrescriptionPDF, generatePatientSummaryPDF } from '../../utils/pdfGenerator';
import { exportPatientsToExcel, exportBookingsToExcel, exportInventoryToExcel } from '../../utils/excelGenerator';
import { InventoryManager } from '../common/InventoryManager';
import { ConfirmModal } from '../common/ConfirmModal';
import { PrescriptionEditorModal } from '../prescription/PrescriptionEditorModal';
import { PatientBillingManager } from '../billing/PatientBillingManager';
import { NewPrescriptionSection } from '../prescription/NewPrescriptionSection';
import { PatientsRecordFolderView } from '../common/PatientsRecordFolderView';

export const StaffDashboard: React.FC = () => {
  const { 
    bookings, 
    newBookingsCount, 
    markBookingSeen, 
    updateBookingStatus, 
    deleteBooking,
    inventory, 
    updateInventoryQuantity, 
    addInventoryItem, 
    patients, 
    addPatient, 
    deletePatient,
    prescriptions, 
    addPrescription, 
    updatePrescription,
    deletePrescription,
    about, 
    updateAbout, 
    faqs, 
    updateFaqs, 
    highlights, 
    updateHighlights,
    settings,
    sendPatientReminder 
  } = useClinic();
  const { staffUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'patients_folder' | 'patient_billing' | 'prescription' | 'notifications' | 'inventory' | 'patients' | 'content' | 'notices'>('patients_folder');

  // Search & filter states
  const [patientSearch, setPatientSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'All' | 'New' | 'Confirmed' | 'Completed'>('All');

  // Toast feedback state
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // In-app Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm Delete') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  // Prescription Letterhead Modal (opened from Patients Directory)
  const [selectedPrescriptionForModal, setSelectedPrescriptionForModal] = useState<Prescription | null>(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  // Selected Patient Details View Drawer
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);

  // Content Editor State (Local copies for editing)
  const [editAbout, setEditAbout] = useState<AboutContent>(about);
  const [editFaqs, setEditFaqs] = useState<FaqItem[]>(faqs);
  const [editHighlights, setEditHighlights] = useState<HighlightItem[]>(highlights);
  const [contentSaveNotice, setContentSaveNotice] = useState(false);

  // Staff Doctor photo state
  const staffDocPhotoFileInputRef = React.useRef<HTMLInputElement>(null);
  const [staffDocPhotoUrlInput, setStaffDocPhotoUrlInput] = useState('');

  const handleStaffDoctorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice("Optimizing doctor photo...");
      const { dataUrl, size } = await compressImageFile(file, { 
        maxWidth: 800, 
        maxHeight: 800, 
        quality: 0.8, 
        maxSizeBytes: 90 * 1024 
      });
      if (dataUrl) {
        setEditAbout(prev => ({
          ...prev,
          doctorPhotoUrl: dataUrl,
          doctorPhotos: prev.doctorPhotos ? [dataUrl, ...prev.doctorPhotos] : [dataUrl]
        }));
        showNotice(`Doctor photo uploaded & optimized (${Math.round(size / 1024)} KB)! Click 'Publish Content' to save.`);
      }
    } catch {
      showNotice("Failed to process doctor photo.");
    }
  };

  // Filtered Patients
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch)
  );

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'All') return true;
    return b.status === bookingFilter;
  });

  // Save Content to Firestore
  const handleSaveContent = async () => {
    await updateAbout(editAbout);
    await updateFaqs(editFaqs);
    await updateHighlights(editHighlights);
    setContentSaveNotice(true);
    setTimeout(() => setContentSaveNotice(false), 4000);
  };

  return (
    <div id="staff-dashboard" className="min-h-screen bg-slate-100 text-slate-800 pb-20">
      
      {/* Top Staff Navigation Header (Blue Theme) */}
      <div className="bg-blue-900 text-white shadow-md sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 bg-white/15 rounded-2xl shrink-0">
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-sky-200" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold leading-tight truncate">Staff Clinical Dashboard</h1>
                <span className="text-[10px] font-extrabold uppercase bg-blue-950/70 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30 shrink-0">
                  Staff Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-200 truncate">
                Logged in as: <strong className="text-white">{staffUser?.name || 'Staff'}</strong> (+91 {staffUser?.phone || 'Desk'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs px-3 sm:px-3.5 py-1.5 sm:py-2 bg-red-600/90 hover:bg-red-600 text-white font-semibold rounded-xl shadow-xs transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-blue-700/60 text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setActiveTab('prescription')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'prescription'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-300" />
            <span>Official Prescription</span>
          </button>

          {/* TAB: PATIENTS RECORD FOLDER */}
          <button
            onClick={() => setActiveTab('patients_folder')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'patients_folder'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-300" />
            <span className="flex items-center gap-1.5">
              <span>Patients Record Folder</span>
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-xs">
                📁 Folder
              </span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('patient_billing')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'patient_billing'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Patient Reports & Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'notifications'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Box & Bookings</span>
            {newBookingsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full animate-bounce">
                {newBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'inventory'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory Management</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'patients'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Patients Directory ({patients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'content'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Website Content Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('notices')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'notices'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-300" />
            <span className="flex items-center gap-1.5">
              <span>Submit Offers & Notices</span>
              <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30">
                Offers & Notices
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* ================= PATIENTS RECORD FOLDER TAB ================= */}
        {activeTab === 'patients_folder' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PatientsRecordFolderView
              userRole="staff"
              onOpenPrescriptionModal={(rx) => {
                setSelectedPrescriptionForModal(rx);
                setIsPrescriptionModalOpen(true);
              }}
              onOpenAddDocumentModal={() => setActiveTab('patient_billing')}
              onOpenAddInvoiceModal={() => setActiveTab('patient_billing')}
            />
          </div>
        )}

        {/* ================= PATIENT REPORTS & BILLING TAB ================= */}
        {activeTab === 'patient_billing' && (
          <PatientBillingManager
            userRole="staff"
            currentUserName={staffUser?.name || "Clinic Staff"}
          />
        )}

        {/* ================= 1. NOTIFICATION BOX & BOOKINGS TAB ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            
            {/* Prominent Notification Box as required */}
            <div className="bg-white rounded-3xl p-6 border-2 border-blue-500 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 text-red-700 rounded-2xl relative">
                    <Bell className="w-6 h-6 animate-pulse" />
                    {newBookingsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                        {newBookingsCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Staff Notification Box • New Patient Bookings
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time appointment alerts submitted from the public website booking system.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-900 rounded-full">
                    {newBookingsCount} Unseen / New Booking(s)
                  </span>
                </div>
              </div>

              {/* List of New Bookings */}
              {bookings.filter(b => b.status === 'New').length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold text-slate-700">All new bookings have been acknowledged!</p>
                  <p className="text-xs text-slate-400 mt-0.5">When patients book online, they will immediately appear right here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings.filter(b => b.status === 'New').map((booking, idx) => (
                    <div 
                      key={booking.id ? `${booking.id}-${idx}` : `b-${idx}`}
                      className="p-5 bg-gradient-to-br from-amber-50/70 to-blue-50/40 border border-amber-300 rounded-2xl shadow-sm relative space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-extrabold uppercase rounded-full">
                            NEW BOOKING
                          </span>
                          <h4 className="font-bold text-slate-900 text-base mt-1.5">{booking.patientName}</h4>
                          <p className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-blue-700" />
                            <span>+91 {booking.phone}</span>
                          </p>
                        </div>
                        <span className="text-xs font-bold text-blue-800 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          ₹{booking.fee} Cash
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 space-y-1 bg-white/80 p-2.5 rounded-xl border border-slate-200">
                        <p><strong>Service:</strong> {booking.service}</p>
                        <p><strong>Slot:</strong> {booking.date} at {booking.timeSlot}</p>
                        {booking.problemDescription && (
                          <p className="text-slate-500 italic text-[11px]">"{booking.problemDescription}"</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => booking.id && markBookingSeen(booking.id)}
                          className="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Seen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => booking.id && updateBookingStatus(booking.id, 'Confirmed')}
                          className="py-2 px-3 bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold rounded-xl transition"
                          title="Confirm slot"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => sendPatientReminder(booking)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl transition"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Bookings Table with Payment & Cash Tracking */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">All Appointments Schedule</h3>
                  <p className="text-xs text-slate-500">Filter appointments, confirm slots, and mark cash payments.</p>
                </div>

                <div className="flex items-center gap-2">
                  {(['All', 'New', 'Confirmed', 'Completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBookingFilter(st)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        bookingFilter === st 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}

                  <button
                    onClick={() => exportBookingsToExcel(bookings)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition ml-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment (Cash)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b, idx) => (
                      <tr key={b.id ? `${b.id}-${idx}` : `b-${idx}`} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{b.patientName}</td>
                        <td className="py-3 px-4 text-slate-600">+91 {b.phone}</td>
                        <td className="py-3 px-4 font-medium text-blue-800">{b.service}</td>
                        <td className="py-3 px-4 text-slate-600">{b.date} • {b.timeSlot}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.status === 'New' ? 'bg-amber-100 text-amber-800' :
                            b.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.paymentStatus === 'Paid' ? 'bg-blue-100 text-blue-800' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {b.paymentStatus === 'Paid' ? 'Paid (Cash)' : `Unpaid (₹${b.fee})`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {b.paymentStatus !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => b.id && updateBookingStatus(b.id, 'Completed', 'Paid')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition"
                              title="Mark as Paid at Clinic (Cash)"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => sendPatientReminder(b)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-800 rounded-lg transition"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (b.id) {
                                openConfirm(
                                  'Delete Appointment Booking?',
                                  `Are you sure you want to delete the appointment for ${b.patientName} (${b.service}) on ${b.date}?`,
                                  async () => {
                                    await deleteBooking(b.id!);
                                    showNotice(`Deleted booking for ${b.patientName}`);
                                  }
                                );
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= 2. INVENTORY SECTION TAB ================= */}
        {activeTab === 'inventory' && (
          <InventoryManager themeColor="blue" allowDelete={true} />
        )}

        {/* ================= NEW PRESCRIPTION SECTION ================= */}
        {activeTab === 'prescription' && (
          <NewPrescriptionSection />
        )}

        {/* ================= 4. NUMBER OF PATIENTS TAB ================= */}
        {activeTab === 'patients' && (
          <div className="space-y-6">
            
            {/* Top Stat Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{patients.length}</p>
                  <p className="text-xs font-semibold text-slate-500">Total Registered Patients</p>
                </div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-sky-800">{prescriptions.length}</p>
                  <p className="text-xs font-semibold text-slate-500">Total Prescriptions Issued</p>
                </div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Export All Patients</p>
                  <p className="text-xs text-slate-500">Excel spreadsheet export</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportPatientsToExcel(patients)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            {/* Patients Directory Table & Search */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by patient name or mobile..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Age / Gender</th>
                      <th className="py-3 px-4">Total Visits</th>
                      <th className="py-3 px-4">Last Visit</th>
                      <th className="py-3 px-4 text-right">Details & PDF/Excel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((p, idx) => {
                      const patientPrescriptions = prescriptions.filter(
                        pr => (pr.patientId && p.id && pr.patientId === p.id) || 
                              (pr.patientPhone && pr.patientPhone !== 'N/A' && p.phone && p.phone !== 'N/A' ? pr.patientPhone.replace(/\D/g, '').slice(-10) === p.phone.replace(/\D/g, '').slice(-10) : false) ||
                              (pr.patientName && p.name && pr.patientName.trim().toLowerCase() === p.name.trim().toLowerCase())
                      );

                      return (
                        <tr key={p.id ? `${p.id}-${idx}` : `p-${idx}`} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.phone && p.phone !== 'N/A' ? `+91 ${p.phone}` : <span className="text-slate-400 italic">In-Clinic</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{p.age || 'N/A'} yrs / {p.gender}</td>
                          <td className="py-3 px-4 font-semibold text-blue-800">
                            <div className="flex items-center gap-1.5">
                              <span>{p.totalVisits || 1}</span>
                              {patientPrescriptions.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200" title={`${patientPrescriptions.length} Prescription(s) on file`}>
                                  <FileText className="w-2.5 h-2.5 text-blue-600" />
                                  {patientPrescriptions.length} Rx
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{p.lastVisit || 'Recent'}</td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPrescriptionForModal({
                                  patientId: p.id,
                                  patientName: p.name,
                                  patientPhone: p.phone && p.phone !== 'N/A' ? p.phone : '',
                                  age: p.age || 30,
                                  gender: p.gender || 'Other',
                                  ageSex: `${p.age || 30} / ${p.gender ? p.gender.charAt(0).toUpperCase() : 'M'}`,
                                  date: new Date().toISOString().slice(0, 10),
                                  doctorName: 'Dr. Anup Kumar Hota',
                                  doctorDegree: 'DENTAL SURGEON (BDS)',
                                  doctorRegNo: 'CGDC/G/26/4876'
                                } as Prescription);
                                setIsPrescriptionModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1"
                              title="Issue New Prescription for this Patient"
                            >
                              <Plus className="w-3 h-3 text-emerald-600" />
                              <span>+ New Rx</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewPatient(p)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => generatePatientSummaryPDF(p, patientPrescriptions)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition"
                              title="Download PDF Record"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (p.id) {
                                  openConfirm(
                                    'Delete Patient Record?',
                                    `Are you sure you want to permanently delete patient dossier for "${p.name}" (+91 ${p.phone})?`,
                                    async () => {
                                      await deletePatient(p.id!);
                                      showNotice(`Deleted patient record for "${p.name}"`);
                                    }
                                  );
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Patient Record"
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
            </div>

            {/* Patient Detail Modal */}
            {viewPatient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Patient Medical Dossier
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{viewPatient.name}</h3>
                      <p className="text-xs text-slate-500">+91 {viewPatient.phone} • {viewPatient.gender} • {viewPatient.age} yrs</p>
                    </div>
                    <button onClick={() => setViewPatient(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary details */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <p className="text-slate-500 font-medium">Registered Address:</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewPatient.address || 'Civil Lines'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-medium">Total Clinic Visits:</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewPatient.totalVisits || 1}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 font-medium">Clinical Notes & History:</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{viewPatient.notes || 'Routine dental care'}</p>
                    </div>
                  </div>

                  {/* Past Prescriptions list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Prescriptions on File</span>
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          const p = viewPatient;
                          setViewPatient(null);
                          setSelectedPrescriptionForModal({
                            patientId: p.id,
                            patientName: p.name,
                            patientPhone: p.phone && p.phone !== 'N/A' ? p.phone : '',
                            age: p.age || 30,
                            gender: p.gender || 'Other',
                            ageSex: `${p.age || 30} / ${p.gender ? p.gender.charAt(0).toUpperCase() : 'M'}`,
                            date: new Date().toISOString().slice(0, 10),
                            doctorName: 'Dr. Anup Kumar Hota',
                            doctorDegree: 'DENTAL SURGEON (BDS)',
                            doctorRegNo: 'CGDC/G/26/4876'
                          } as Prescription);
                          setIsPrescriptionModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 transition"
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                        <span>+ Issue New Rx</span>
                      </button>
                    </div>

                    {prescriptions
                      .filter(pr => (pr.patientId && viewPatient.id && pr.patientId === viewPatient.id) || 
                                    (pr.patientPhone && pr.patientPhone !== 'N/A' && viewPatient.phone && viewPatient.phone !== 'N/A' ? pr.patientPhone.replace(/\D/g, '').slice(-10) === viewPatient.phone.replace(/\D/g, '').slice(-10) : false) ||
                                    (pr.patientName && viewPatient.name && pr.patientName.trim().toLowerCase() === viewPatient.name.trim().toLowerCase()))
                      .map((pr, idx) => (
                        <div key={pr.id ? `${pr.id}-${idx}` : `pr-${idx}`} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{pr.serviceTaken || 'Dental Consultation'} ({pr.date})</p>
                            <p className="text-slate-500 text-[11px] truncate max-w-sm">{pr.resultUpdate || pr.visitNotes || 'Prescription on file'}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPrescriptionForModal(pr);
                                setIsPrescriptionModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              title="View & Edit Official Letterhead Pad"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Pad</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => generatePrescriptionPDF(pr)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg text-xs font-bold"
                            >
                              Rx PDF
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Modal Action buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setViewPatient(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rel = prescriptions.filter(
                          pr => (pr.patientId && viewPatient.id && pr.patientId === viewPatient.id) || 
                                (pr.patientPhone && pr.patientPhone !== 'N/A' && viewPatient.phone && viewPatient.phone !== 'N/A' ? pr.patientPhone.replace(/\D/g, '').slice(-10) === viewPatient.phone.replace(/\D/g, '').slice(-10) : false) ||
                                (pr.patientName && viewPatient.name && pr.patientName.trim().toLowerCase() === viewPatient.name.trim().toLowerCase())
                        );
                        generatePatientSummaryPDF(viewPatient, rel);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print & Download PDF Record</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= 5. CONTENT EDITOR TAB ================= */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Website Content Management</h3>
                  <p className="text-xs text-slate-500">
                    Edits made here instantly update the public homepage (About Us, FAQs, and Clinic Highlights).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {contentSaveNotice && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                      ✓ Content Published to Homepage!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveContent}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>

              {/* About Us & Doctor Section */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-800 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>1. Doctor Profile & About Us Section</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Homepage Sync
                  </span>
                </div>

                {/* Doctor Photo Box for Staff */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <label className="block text-xs font-bold text-slate-800">Chief Doctor Photo</label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-blue-400 bg-white shrink-0 shadow-xs">
                      {editAbout.doctorPhotoUrl ? (
                        <img
                          src={editAbout.doctorPhotoUrl}
                          alt="Doctor"
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          No Photo
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <input
                        type="file"
                        ref={staffDocPhotoFileInputRef}
                        accept="image/*"
                        onChange={handleStaffDoctorPhotoUpload}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => staffDocPhotoFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Doctor Photo</span>
                        </button>

                        {editAbout.doctorPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditAbout({ ...editAbout, doctorPhotoUrl: '' })}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      {/* Direct URL input */}
                      <div className="flex gap-2 text-xs">
                        <input
                          type="url"
                          value={staffDocPhotoUrlInput}
                          onChange={(e) => setStaffDocPhotoUrlInput(e.target.value)}
                          placeholder="Or paste doctor photo web link..."
                          className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (staffDocPhotoUrlInput.trim()) {
                              setEditAbout({ ...editAbout, doctorPhotoUrl: staffDocPhotoUrlInput.trim() });
                              setStaffDocPhotoUrlInput('');
                              showNotice("Applied doctor photo link!");
                            }
                          }}
                          className="px-3 py-1 bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer shrink-0"
                        >
                          Apply
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Presets:</span>
                        {DOCTOR_PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setEditAbout({ ...editAbout, doctorPhotoUrl: preset.url });
                              showNotice(`Selected ${preset.name}!`);
                            }}
                            className={`flex items-center gap-1 px-2 py-1 bg-white border rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer ${
                              editAbout.doctorPhotoUrl === preset.url ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-4 h-4 rounded-full object-cover" />
                            <span className="truncate max-w-[80px]">{preset.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

                {/* Doctor Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Chief Doctor Name</label>
                    <input
                      type="text"
                      value={editAbout.doctorName}
                      onChange={(e) => setEditAbout({ ...editAbout, doctorName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Degrees & Qualifications</label>
                    <input
                      type="text"
                      value={editAbout.doctorDegree}
                      onChange={(e) => setEditAbout({ ...editAbout, doctorDegree: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      value={editAbout.doctorSpecialization}
                      onChange={(e) => setEditAbout({ ...editAbout, doctorSpecialization: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={editAbout.title}
                      onChange={(e) => setEditAbout({ ...editAbout, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subtitle / Tagline</label>
                    <input
                      type="text"
                      value={editAbout.subtitle}
                      onChange={(e) => setEditAbout({ ...editAbout, subtitle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={editAbout.description}
                    onChange={(e) => setEditAbout({ ...editAbout, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">Doctor's Clinical Philosophy</label>
                  <textarea
                    rows={2}
                    value={editAbout.clinicPhilosophy}
                    onChange={(e) => setEditAbout({ ...editAbout, clinicPhilosophy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 italic"
                  />
                </div>
              </div>

              {/* FAQs Editor */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-800">2. FAQs (FQS) Section</h4>
                  <button
                    type="button"
                    onClick={() => setEditFaqs([...editFaqs, { id: `faq-${Date.now()}`, question: 'New Question', answer: 'Answer details...' }])}
                    className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg"
                  >
                    + Add New FAQ
                  </button>
                </div>

                <div className="space-y-3">
                  {editFaqs.map((faq, idx) => (
                    <div key={faq.id ? `${faq.id}-${idx}` : `faq-${idx}`} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const copy = [...editFaqs];
                            copy[idx].question = e.target.value;
                            setEditFaqs(copy);
                          }}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                          placeholder="Question..."
                        />
                        <button
                          type="button"
                          onClick={() => setEditFaqs(editFaqs.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const copy = [...editFaqs];
                          copy[idx].answer = e.target.value;
                          setEditFaqs(copy);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        placeholder="Answer..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Details / Highlights Editor */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold uppercase tracking-wider text-blue-800">3. Other Details & Highlights</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {editHighlights.map((hl, idx) => (
                    <div key={hl.id ? `${hl.id}-${idx}` : `hl-${idx}`} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <input
                        type="text"
                        value={hl.title}
                        onChange={(e) => {
                          const copy = [...editHighlights];
                          copy[idx].title = e.target.value;
                          setEditHighlights(copy);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                        placeholder="Highlight Title (e.g. Free Checkup Sunday)"
                      />
                      <input
                        type="text"
                        value={hl.badge}
                        onChange={(e) => {
                          const copy = [...editHighlights];
                          copy[idx].badge = e.target.value;
                          setEditHighlights(copy);
                        }}
                        className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-[11px]"
                        placeholder="Badge text"
                      />
                      <textarea
                        rows={2}
                        value={hl.description}
                        onChange={(e) => {
                          const copy = [...editHighlights];
                          copy[idx].description = e.target.value;
                          setEditHighlights(copy);
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        placeholder="Description..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveContent}
                  className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Content to Public Website</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ================= SUBMIT CLINIC NOTICE TAB ================= */}
        {activeTab === 'notices' && (
          <div className="space-y-6">
            <StaffNoticeComposer />
          </div>
        )}

      </div>

      {/* Action Toast Feedback */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-slate-900/95 text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* In-App Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Official Prescription Pad & Editor Modal */}
      {isPrescriptionModalOpen && (
        <PrescriptionEditorModal
          isOpen={isPrescriptionModalOpen}
          initialPrescription={selectedPrescriptionForModal}
          onClose={() => {
            setIsPrescriptionModalOpen(false);
            setSelectedPrescriptionForModal(null);
          }}
          onSave={async (presc) => {
            const staffPresc = {
              ...presc,
              isPublishedToPortal: false,
              approvalStatus: 'pending_approval' as const,
              createdByRole: 'staff' as const,
              createdByName: staffUser?.name || 'Clinic Staff'
            };
            if (selectedPrescriptionForModal?.id) {
              await updatePrescription(selectedPrescriptionForModal.id, staffPresc);
              showNotice(`Updated prescription for ${presc.patientName} (Clinic Records)`);
              return { success: true };
            } else {
              const res = await addPrescription(staffPresc);
              showNotice(`Saved prescription for ${presc.patientName} (Pending Doctor Approval • Hidden from Patient Portal)`);
              return res;
            }
          }}
        />
      )}

    </div>
  );
};
