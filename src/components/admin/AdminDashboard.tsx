import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Smartphone,
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Package, 
  Users, 
  UserPlus, 
  KeyRound, 
  Lock, 
  Settings, 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ExternalLink,
  Sparkles,
  Layers,
  FileSpreadsheet,
  X,
  CreditCard,
  Banknote,
  Search,
  Check,
  Upload,
  Play,
  Star,
  FileCheck,
  FileText,
  HelpCircle,
  Award,
  Globe,
  Radio,
  Building2,
  Gift,
  Stethoscope,
  Heart,
  Loader2,
  BellRing,
  MessageSquare,
  Megaphone,
  FileEdit,
  Folder
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { useAuth } from '../../context/AuthContext';
import { PatientsRecordFolderView } from '../common/PatientsRecordFolderView';
import { 
  ClinicSettings, 
  Booking, 
  Expense, 
  Income, 
  InventoryItem, 
  AllowedStaff, 
  DentalService, 
  ClinicPhoto,
  AboutContent,
  FaqItem,
  HighlightItem,
  Review
} from '../../types/clinic';
import { 
  exportExpensesToExcel, 
  exportBookingsToExcel, 
  exportInventoryToExcel, 
  exportIncomeToExcel 
} from '../../utils/excelGenerator';
import { InventoryManager } from '../common/InventoryManager';
import { ConfirmModal } from '../common/ConfirmModal';
import { PatientBillingManager } from '../billing/PatientBillingManager';
import { NewPrescriptionSection } from '../prescription/NewPrescriptionSection';
import { WhatsAppCampaignCenter } from './whatsapp/WhatsAppCampaignCenter';
import { AdminNoticeManager } from './notices/AdminNoticeManager';
import { 
  getActivePrescriptionBanner, 
  saveActivePrescriptionBanner, 
  resetActivePrescriptionBanner,
  getPrescriptionDoctorPreset,
  setPrescriptionDoctorPreset
} from '../../utils/prescriptionTemplate';
import { DOCTOR_PHOTO_PRESETS } from '../../services/seedData';
import { compressImageFile } from '../../utils/fileStorageHelper';
import { VideoModal, formatVideoEmbedUrl } from '../common/VideoModal';
import { 
  updateAdminSecurityQuestion, 
  setIndividualRecoveryAnswer, 
  INITIAL_SECURITY_QUESTION, 
  validatePassword,
  updateAdminPasswordsDirect,
  updateAdminPhoneNumber,
  extractClean10,
  authenticateAdminInitialPassword,
  authenticateAdminFinalPassword,
  resetPasswordWithRecovery
} from '../../services/securityAuthService';

export const LOGO_PRESETS = [
  {
    id: 'preset-cyan-tooth',
    name: 'Cyan Crest Tooth',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%230d9488'/><path d='M32 30 C32 20 44 20 50 26 C56 20 68 20 68 30 C68 45 62 55 60 76 C59 80 55 80 54 75 C52 65 48 65 46 75 C45 80 41 80 40 76 C38 55 32 45 32 30 Z' fill='white'/><circle cx='68' cy='28' r='5' fill='%23f59e0b'/></svg>"
  },
  {
    id: 'preset-purple-royal',
    name: 'Royal Purple Tooth',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23581c87'/><path d='M32 30 C32 20 44 20 50 26 C56 20 68 20 68 30 C68 45 62 55 60 76 C59 80 55 80 54 75 C52 65 48 65 46 75 C45 80 41 80 40 76 C38 55 32 45 32 30 Z' fill='white'/><path d='M44 44 L48 48 L58 38' stroke='%23d8b4fe' stroke-width='4' fill='none' stroke-linecap='round'/></svg>"
  },
  {
    id: 'preset-emerald-cross',
    name: 'Emerald Health Cross',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23059669'/><path d='M44 24 H56 V44 H76 V56 H56 V76 H44 V56 H24 V44 H44 Z' fill='white'/><circle cx='50' cy='50' r='6' fill='%2310b981'/></svg>"
  },
  {
    id: 'preset-gold-smile',
    name: 'Gold Dental Smile',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%231e293b'/><path d='M30 45 Q50 75 70 45 Q50 60 30 45 Z' fill='%23fbbf24'/><path d='M50 20 L53 30 L63 33 L53 36 L50 46 L47 36 L37 33 L47 30 Z' fill='%23f59e0b'/></svg>"
  },
  {
    id: 'preset-blue-implant',
    name: 'Sapphire Implant Crest',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%230284c7'/><path d='M32 30 C32 20 44 20 50 26 C56 20 68 20 68 30 C68 45 62 55 60 76 C59 80 55 80 54 75 C52 65 48 65 46 75 C45 80 41 80 40 76 C38 55 32 45 32 30 Z' fill='white'/><rect x='42' y='46' width='16' height='4' rx='2' fill='%230284c7'/><rect x='44' y='54' width='12' height='4' rx='2' fill='%230284c7'/></svg>"
  },
  {
    id: 'preset-cad-modern',
    name: 'Modern CAD Dental',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%230f172a'/><circle cx='50' cy='50' r='32' stroke='%2338bdf8' stroke-width='4' fill='none'/><path d='M38 38 C38 30 46 30 50 34 C54 30 62 30 62 38 C62 48 57 55 56 65 C55 68 53 68 52 64 C51 58 49 58 48 64 C47 68 45 68 44 65 C43 55 38 48 38 38 Z' fill='%2338bdf8'/></svg>"
  }
];

export const AdminDashboard: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    about,
    updateAbout,
    faqs,
    updateFaqs,
    highlights,
    updateHighlights,
    bookings, 
    deleteBooking,
    updateBookingStatus,
    updateBookingDetails,
    inventory, 
    expenses, 
    addExpense, 
    updateExpense,
    deleteExpense, 
    income,
    addIncome,
    updateIncome,
    deleteIncome,
    staffList, 
    addStaffMember, 
    updateStaffMember,
    removeStaffMember, 
    services, 
    updateServices, 
    gallery, 
    updateGallery,
    reviews,
    addReview,
    toggleReviewApproval,
    deleteReview,
    prescriptions
  } = useClinic();
  const { adminConfig, changeAdminPassword, updateAdminSecurityConfig, refreshAdminConfig, logout } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    'website_cms' | 'prescriptions' | 'patients_folder' | 'patient_billing' | 'finances' | 'staff' | 'inventory' | 'whatsapp_campaigns' | 'clinic_notices' | 'security'
  >('website_cms');

  // Prescriptions pending approval count
  const pendingPrescriptionsCount = useMemo(() => {
    return (prescriptions || []).filter(
      p => p.isPublishedToPortal === false || p.approvalStatus === 'pending_approval' || p.approvalStatus === 'draft'
    ).length;
  }, [prescriptions]);

  // Website CMS Sub-Tab: Every section on the website is editable here
  const [cmsSubTab, setCmsSubTab] = useState<
    'hero' | 'about_doctor' | 'services' | 'photos' | 'location' | 'sunday_highlights' | 'faqs' | 'reviews' | 'prescription'
  >('hero');

  // Finances Sub-Tab
  const [financeSubTab, setFinanceSubTab] = useState<'overview' | 'income' | 'expenses' | 'new_entry'>('overview');

  // Toast feedback state
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Unified In-App Confirmation Modal State
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

  // Local Form Copies for Instant Live Editing of Website Content
  const [brandingForm, setBrandingForm] = useState<ClinicSettings>(settings);
  const [aboutForm, setAboutForm] = useState<AboutContent>(about);
  const [faqsList, setFaqsList] = useState<FaqItem[]>(faqs);
  const [highlightsList, setHighlightsList] = useState<HighlightItem[]>(highlights);

  // Sync when contexts update
  React.useEffect(() => {
    setBrandingForm(settings);
  }, [settings]);
  React.useEffect(() => {
    setAboutForm(about);
  }, [about]);
  React.useEffect(() => {
    setFaqsList(faqs);
  }, [faqs]);
  React.useEffect(() => {
    setHighlightsList(highlights);
  }, [highlights]);

  // Save Settings & Hero & Branding
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updateSettings(brandingForm);
    showNotice("Saved & published website changes!");
  };

  // Save About Doctor & Philosophy
  const handleSaveAbout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updateAbout(aboutForm);
    showNotice("Saved Doctor profile and About section!");
  };

  // Save FAQs
  const handleSaveFaqs = async () => {
    await updateFaqs(faqsList);
    showNotice("Updated FAQ questions on the website!");
  };

  // Save Highlights & Sunday Camp
  const handleSaveHighlights = async () => {
    await updateHighlights(highlightsList);
    await updateSettings({
      freeSundayTimings: brandingForm.freeSundayTimings,
      announcementBanner: brandingForm.announcementBanner,
      isBannerActive: brandingForm.isBannerActive
    });
    showNotice("Updated Sunday checkup camp & highlights!");
  };

  // File Upload Handlers for Logo & Media
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice("Optimizing logo image...");
      const { dataUrl, size } = await compressImageFile(file, { 
        maxWidth: 500, 
        maxHeight: 500, 
        quality: 0.82, 
        maxSizeBytes: 65 * 1024 
      });
      if (dataUrl) {
        setBrandingForm(prev => ({ ...prev, logoUrl: dataUrl }));
        showNotice(`Optimized logo uploaded (${Math.round(size / 1024)} KB)! Click 'Save Changes' to publish.`);
      }
    } catch {
      showNotice("Failed to process logo image. Please try again.");
    }
  };

  // Doctor Photo & Gallery Management State
  const [doctorPhotoUrlInput, setDoctorPhotoUrlInput] = useState('');
  const [doctorGalleryUrlInput, setDoctorGalleryUrlInput] = useState('');
  const [showAddGalleryUrlInput, setShowAddGalleryUrlInput] = useState(false);
  const doctorPhotoFileInputRef = React.useRef<HTMLInputElement>(null);
  const doctorGalleryFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDoctorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setAboutForm(prev => {
          const prevPhotos = prev.doctorPhotos || [];
          return {
            ...prev,
            doctorPhotoUrl: dataUrl,
            doctorPhotos: prevPhotos.includes(dataUrl) ? prevPhotos : [dataUrl, ...prevPhotos]
          };
        });
        showNotice(`Doctor photo uploaded (${Math.round(size / 1024)} KB)! Click 'Publish Doctor & About Updates' to save.`);
      }
    } catch {
      showNotice("Failed to process doctor photo.");
    }
  };

  const handleAddDoctorGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice("Optimizing gallery photo...");
      const { dataUrl, size } = await compressImageFile(file, { 
        maxWidth: 800, 
        maxHeight: 800, 
        quality: 0.75, 
        maxSizeBytes: 80 * 1024 
      });
      if (dataUrl) {
        setAboutForm(prev => ({
          ...prev,
          doctorPhotos: [...(prev.doctorPhotos || []), dataUrl]
        }));
        showNotice(`Added photo (${Math.round(size / 1024)} KB) to Doctor Gallery! Remember to publish updates.`);
      }
    } catch {
      showNotice("Failed to process photo.");
    }
  };

  // Services Edit & Add Modal State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvPrice, setNewSrvPrice] = useState('₹ 2,000');
  const [newSrvNumPrice, setNewSrvNumPrice] = useState(2000);
  const [newSrvDuration, setNewSrvDuration] = useState('30 mins');
  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvVideo, setNewSrvVideo] = useState('https://www.youtube.com/embed/5a4GqT7qY4k');
  const [newSrvVideoSource, setNewSrvVideoSource] = useState<'url' | 'upload'>('url');
  const [newSrvImage, setNewSrvImage] = useState('');
  const [newSrvImageSource, setNewSrvImageSource] = useState<'url' | 'upload'>('url');

  const [editServiceItem, setEditServiceItem] = useState<DentalService | null>(null);
  const [editSrvName, setEditSrvName] = useState('');
  const [editSrvPrice, setEditSrvPrice] = useState('');
  const [editSrvNumPrice, setEditSrvNumPrice] = useState(0);
  const [editSrvDuration, setEditSrvDuration] = useState('');
  const [editSrvDesc, setEditSrvDesc] = useState('');
  const [editSrvVideo, setEditSrvVideo] = useState('');
  const [editSrvVideoSource, setEditSrvVideoSource] = useState<'url' | 'upload'>('url');
  const [editSrvImage, setEditSrvImage] = useState('');
  const [editSrvImageSource, setEditSrvImageSource] = useState<'url' | 'upload'>('url');
  const [previewVideoService, setPreviewVideoService] = useState<DentalService | null>(null);

  // Photos Gallery state
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCat, setNewPhotoCat] = useState<'Reception' | 'Treatment' | 'Machines' | 'Sterilization'>('Treatment');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');

  // Service & Photo File Upload Refs & Handlers
  const addSrvImageFileInputRef = React.useRef<HTMLInputElement>(null);
  const editSrvImageFileInputRef = React.useRef<HTMLInputElement>(null);
  const addPhotoFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) {
      showNotice('Please enter a service name.');
      return;
    }
    const formattedVideo = formatVideoEmbedUrl(newSrvVideo);
    const newService: DentalService = {
      id: `srv-${Date.now()}`,
      name: newSrvName.trim(),
      price: newSrvPrice.trim() || `₹ ${newSrvNumPrice.toLocaleString('en-IN')}`,
      numericPrice: Number(newSrvNumPrice) || 2000,
      duration: newSrvDuration.trim() || '30 mins',
      description: newSrvDesc.trim() || 'Specialized clinical dental procedure.',
      icon: 'Sparkles',
      features: ['Digital Assessment', 'Painless Anesthesia Protocol', 'Post-procedure follow-up guarantee'],
      videoUrl: formattedVideo,
      videoTitle: `${newSrvName.trim()} Demonstration & Guide`,
      imageUrl: newSrvImage.trim() || 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80'
    };
    await updateServices([...services, newService]);
    setIsAddServiceOpen(false);
    showNotice(`Added new dental service: ${newSrvName}!`);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editServiceItem) return;
    const formattedVideo = formatVideoEmbedUrl(editSrvVideo);
    const updatedServices = services.map(s => {
      if (s.id === editServiceItem.id) {
        return {
          ...s,
          name: editSrvName.trim() || s.name,
          price: editSrvPrice.trim() || s.price,
          numericPrice: Number(editSrvNumPrice) || s.numericPrice || 2000,
          duration: editSrvDuration.trim() || s.duration,
          description: editSrvDesc.trim() || s.description,
          videoUrl: formattedVideo,
          imageUrl: editSrvImage.trim() || s.imageUrl
        };
      }
      return s;
    });
    await updateServices(updatedServices);
    setEditServiceItem(null);
    showNotice(`Updated "${editSrvName}" service details & explainer video!`);
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim() || !newPhotoTitle.trim()) {
      showNotice('Please provide a photo title and image URL or upload.');
      return;
    }
    const newPhoto: ClinicPhoto = {
      id: `photo-${Date.now()}`,
      title: newPhotoTitle.trim(),
      category: newPhotoCat,
      url: newPhotoUrl.trim(),
      description: newPhotoDesc.trim() || 'AnuJay Dental Clinic infrastructure'
    };
    await updateGallery([...gallery, newPhoto]);
    setIsAddPhotoOpen(false);
    setNewPhotoTitle('');
    setNewPhotoUrl('');
    setNewPhotoDesc('');
    showNotice(`Added "${newPhoto.title}" to clinic gallery!`);
  };

  // Prescription banner state
  const [activeCustomBanner, setActiveCustomBanner] = useState<string | null>(() => getActivePrescriptionBanner());
  const [docPresetState, setDocPresetState] = useState<'anup_hota' | 'anujay_sharma'>(() => getPrescriptionDoctorPreset());
  const bannerUploadInputRef = React.useRef<HTMLInputElement>(null);

  // Income & Expense state
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeService, setIncomeService] = useState('Root Canal Treatment');
  const [incomeAmount, setIncomeAmount] = useState<number>(2500);
  const [incomeDate, setIncomeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [incomeMode, setIncomeMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [incomeSearch, setIncomeSearch] = useState('');

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(1500);
  const [expenseCategory, setExpenseCategory] = useState('Dental Materials');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  // Finance Filter States
  const [incomePaymentModeFilter, setIncomePaymentModeFilter] = useState<'All' | 'Cash' | 'UPI' | 'Card'>('All');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('All');
  const [financeEntryType, setFinanceEntryType] = useState<'income' | 'expense'>('income');
  const [financeDateRange, setFinanceDateRange] = useState<'all' | 'this_month'>('all');

  // Staff Authorization State
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Dental Assistant');
  const [staffError, setStaffError] = useState('');

  // Security & Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpRequiredToggle, setOtpRequiredToggle] = useState<boolean>(adminConfig?.otpRequired || false);
  const [autoLogoutMins, setAutoLogoutMins] = useState<number>(adminConfig?.autoLogoutMinutes || 30);
  const [securityNotice, setSecurityNotice] = useState('');

  // Admin Mobile Number Update State (Admin Section Only)
  const [isAdminPhoneEditing, setIsAdminPhoneEditing] = useState(false);
  const [adminNewPhoneInput, setAdminNewPhoneInput] = useState('');
  const [adminPhoneReauthInitial, setAdminPhoneReauthInitial] = useState('');
  const [adminPhoneReauthFinal, setAdminPhoneReauthFinal] = useState('');
  const [adminPhoneLoading, setAdminPhoneLoading] = useState(false);
  const [adminPhoneMsg, setAdminPhoneMsg] = useState('');
  const [adminPhoneErr, setAdminPhoneErr] = useState('');

  // Security Question Management State
  const [newSecQuestion, setNewSecQuestion] = useState('');
  const [reauthInitialPwd, setReauthInitialPwd] = useState('');
  const [reauthFinalPwd, setReauthFinalPwd] = useState('');
  const [secQuestionLoading, setSecQuestionLoading] = useState(false);
  const [secQuestionMsg, setSecQuestionMsg] = useState('');
  const [secQuestionErr, setSecQuestionErr] = useState('');

  // Admin Dual-Password Update State
  const [adminCurrentInitial, setAdminCurrentInitial] = useState('');
  const [adminNewInitial, setAdminNewInitial] = useState('');
  const [adminConfirmInitial, setAdminConfirmInitial] = useState('');
  const [adminCurrentFinal, setAdminCurrentFinal] = useState('');
  const [adminNewFinal, setAdminNewFinal] = useState('');
  const [adminConfirmFinal, setAdminConfirmFinal] = useState('');
  const [adminPwdLoading, setAdminPwdLoading] = useState(false);
  const [adminPwdMsg, setAdminPwdMsg] = useState('');
  const [adminPwdErr, setAdminPwdErr] = useState('');

  // Admin Personal Recovery Answer State
  const [adminRecoveryAnswerInput, setAdminRecoveryAnswerInput] = useState('');
  const [adminRecoveryAnswerMsg, setAdminRecoveryAnswerMsg] = useState('');
  const [adminRecoveryAnswerErr, setAdminRecoveryAnswerErr] = useState('');

  // Financial Calculations & Analytics
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const directIncomeTotal = income.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const bookingsPaidTotal = bookings.filter(b => b.paymentStatus === 'Paid').reduce((acc, curr) => acc + (curr.fee || 0), 0);
  const grossIncomeTotal = directIncomeTotal + bookingsPaidTotal;
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netProfit = grossIncomeTotal - totalExpenses;
  const profitMarginPercent = grossIncomeTotal > 0 ? Math.round((netProfit / grossIncomeTotal) * 100) : 0;
  const pendingReceivable = bookings.filter(b => b.paymentStatus !== 'Paid' && b.status !== 'Cancelled').reduce((acc, curr) => acc + (curr.fee || 0), 0);

  // Payment Modes breakdown for income
  const cashIncomeTotal = income.filter(i => i.paymentMode === 'Cash').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const upiIncomeTotal = income.filter(i => i.paymentMode === 'UPI').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const cardIncomeTotal = income.filter(i => i.paymentMode === 'Card').reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Expense Categories breakdown
  const expenseCategoriesList = [
    'Dental Materials',
    'Lab Fees',
    'Staff Salaries',
    'Clinic Rent',
    'Electricity & Utilities',
    'Equipment Maintenance',
    'Marketing & Miscellaneous'
  ];

  // Filtered income
  const filteredIncomeList = useMemo(() => {
    return income.filter(item => {
      const q = incomeSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        item.source.toLowerCase().includes(q) ||
        (item.service && item.service.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      const matchesMode = incomePaymentModeFilter === 'All' || item.paymentMode === incomePaymentModeFilter;
      const matchesDate = financeDateRange === 'all' || (item.date && item.date.startsWith(currentMonthStr));
      return matchesSearch && matchesMode && matchesDate;
    });
  }, [income, incomeSearch, incomePaymentModeFilter, financeDateRange, currentMonthStr]);

  // Filtered expenses
  const filteredExpensesList = useMemo(() => {
    return expenses.filter(item => {
      const q = expenseSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      const matchesCat = expenseCategoryFilter === 'All' || item.category === expenseCategoryFilter;
      const matchesDate = financeDateRange === 'all' || (item.date && item.date.startsWith(currentMonthStr));
      return matchesSearch && matchesCat && matchesDate;
    });
  }, [expenses, expenseSearch, expenseCategoryFilter, financeDateRange, currentMonthStr]);

  return (
    <div id="admin-dashboard" className="min-h-screen bg-slate-100 text-slate-800 pb-24">
      
      {/* Top Admin Header (Royal Purple Theme) */}
      <div className="bg-purple-900 text-white shadow-lg sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 bg-white/10 rounded-2xl ring-2 ring-purple-400/30 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-200" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold leading-tight truncate">Master Admin Control Center</h1>
                <span className="text-[10px] font-extrabold uppercase bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700 shrink-0">
                  Clinic Admin
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-purple-200 line-clamp-1 sm:line-clamp-none">
                Full website editor, patient reports, finances, inventory, and staff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs px-3 sm:px-3.5 py-1.5 sm:py-2 bg-red-600/90 hover:bg-red-600 text-white font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Admin Logout</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-purple-800 text-xs font-semibold no-scrollbar">
          
          {/* TAB 1: EDIT WEBSITE CONTENT (ALL SECTIONS) */}
          <button
            onClick={() => setActiveTab('website_cms')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'website_cms'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-300" />
            <span>Edit Website (All Content)</span>
          </button>

          {/* TAB: PRESCRIPTIONS & APPROVALS */}
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <FileEdit className="w-4 h-4 text-emerald-300" />
            <span className="flex items-center gap-1.5">
              <span>Prescriptions & Approvals</span>
              {pendingPrescriptionsCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-xs animate-pulse">
                  {pendingPrescriptionsCount} Pending
                </span>
              )}
            </span>
          </button>

          {/* TAB: PATIENTS RECORD FOLDER */}
          <button
            onClick={() => setActiveTab('patients_folder')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'patients_folder'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
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

          {/* TAB 2: PATIENT REPORTS & BILLING */}
          <button
            onClick={() => setActiveTab('patient_billing')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'patient_billing'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Patient Reports & Billing</span>
          </button>

          {/* TAB 3: INCOME & FINANCES */}
          <button
            onClick={() => setActiveTab('finances')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'finances'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Income & Expenses (Finances)</span>
          </button>

          {/* TAB 4: INVENTORY FULL CONTROL */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory Full Control</span>
          </button>

          {/* TAB 5: STAFF AUTHORIZATION */}
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'staff'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Authorization ({staffList.length})</span>
          </button>

          {/* TAB: WHATSAPP CAMPAIGN CENTER */}
          <button
            onClick={() => setActiveTab('whatsapp_campaigns')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'whatsapp_campaigns'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="flex items-center gap-1.5">
              <span>WhatsApp Campaign Center</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-400/30">
                Broadcast
              </span>
            </span>
          </button>

          {/* TAB: OFFERS & NOTICES MANAGEMENT */}
          <button
            onClick={() => setActiveTab('clinic_notices')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'clinic_notices'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-300" />
            <span className="flex items-center gap-1.5">
              <span>Offers & Notices Management</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30">
                Offers & Updates
              </span>
            </span>
          </button>

          {/* TAB 6: SECURITY & PASSWORD */}
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'security'
                ? 'border-white text-white font-bold bg-white/10'
                : 'border-transparent text-purple-200 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">

        {/* ============================================================== */}
        {/* TAB 1: EDIT WEBSITE (EVERYTHING IS EDITABLE BY ADMIN)           */}
        {/* ============================================================== */}
        {activeTab === 'website_cms' && (
          <div className="space-y-6">

            {/* Sub-navigation pills for all website sections */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-slate-400 px-2 py-1 uppercase text-[10px] tracking-wider">Select Section:</span>
              
              <button
                type="button"
                onClick={() => setCmsSubTab('hero')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'hero' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. Hero & Branding
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('about_doctor')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'about_doctor' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. Doctor & About
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('services')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'services' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3. Services & Videos ({services.length})
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('location')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'location' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                4. Location & Map (Bhilai)
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('photos')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'photos' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                5. Clinic Photos ({gallery.length})
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('sunday_highlights')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'sunday_highlights' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                6. Sunday Camp & Highlights
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('faqs')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'faqs' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                7. FAQs ({faqsList.length})
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('reviews')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'reviews' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                8. Reviews ({reviews.length})
              </button>

              <button
                type="button"
                onClick={() => setCmsSubTab('prescription')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  cmsSubTab === 'prescription' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                9. Prescription Letterhead
              </button>

            </div>

            {/* CMS 1: HERO & BRANDING SECTION */}
            {cmsSubTab === 'hero' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Hero Section, Announcement & Logo</h3>
                    <p className="text-xs text-slate-500">
                      Edit the main homepage banner, headline, contact numbers, logo graphic, and announcement bar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Hero & Branding</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Clinic Name *</label>
                    <input
                      type="text"
                      value={brandingForm.clinicName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, clinicName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Clinic Tagline</label>
                    <input
                      type="text"
                      value={brandingForm.tagline}
                      onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                {/* Announcement Top Banner */}
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span>Top Announcement / Notice Banner</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandingForm.isBannerActive !== false}
                        onChange={(e) => setBrandingForm({ ...brandingForm, isBannerActive: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span className="font-bold text-purple-900">Show on Homepage</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={brandingForm.announcementBanner || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, announcementBanner: e.target.value })}
                    placeholder="e.g. 🌟 Free Oral Health Checkup & Consultation Every Sunday 10 AM - 2 PM! Book online or call now."
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                {/* Homepage Hero Section Headlines & USPs */}
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                        <span>🌟 Homepage Hero Headlines & Key Points</span>
                      </h4>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Customize the main title, description, and the 3 checkmark badges shown prominently at the top of your website.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Hero Trust Badge (Pill at top)</label>
                      <input
                        type="text"
                        value={brandingForm.heroBadge || ''}
                        onChange={(e) => setBrandingForm({ ...brandingForm, heroBadge: e.target.value })}
                        placeholder="Multi-Specialty Dental & Oral Implant Center"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Hero Main Title (H1)</label>
                      <input
                        type="text"
                        value={brandingForm.heroTitle || ''}
                        onChange={(e) => setBrandingForm({ ...brandingForm, heroTitle: e.target.value })}
                        placeholder="Painless Dental Care For Your Family's Healthiest Smile"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Hero Description / Subtitle Paragraph</label>
                    <textarea
                      rows={2}
                      value={brandingForm.heroSubtitle || ''}
                      onChange={(e) => setBrandingForm({ ...brandingForm, heroSubtitle: e.target.value })}
                      placeholder="Experience gentle, stress-free dentistry with modern German digital diagnostics..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">3 Key Feature Highlights (Checkmark Badges)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Feature 1</span>
                        <input
                          type="text"
                          value={brandingForm.heroUsp1 || ''}
                          onChange={(e) => setBrandingForm({ ...brandingForm, heroUsp1: e.target.value })}
                          placeholder="100% Painless Protocol"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Feature 2</span>
                        <input
                          type="text"
                          value={brandingForm.heroUsp2 || ''}
                          onChange={(e) => setBrandingForm({ ...brandingForm, heroUsp2: e.target.value })}
                          placeholder="Free Sunday Checkup"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Feature 3</span>
                        <input
                          type="text"
                          value={brandingForm.heroUsp3 || ''}
                          onChange={(e) => setBrandingForm({ ...brandingForm, heroUsp3: e.target.value })}
                          placeholder="Pay at Clinic (Cash)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium text-xs mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Calling Phone *</label>
                    <input
                      type="text"
                      value={brandingForm.phone}
                      onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number *</label>
                    <input
                      type="text"
                      value={brandingForm.whatsappNumber}
                      onChange={(e) => setBrandingForm({ ...brandingForm, whatsappNumber: e.target.value })}
                      placeholder="919876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={brandingForm.emergencyPhone || ''}
                      onChange={(e) => setBrandingForm({ ...brandingForm, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                {/* Logo Customization */}
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <label className="block font-bold text-slate-900">Clinic Logo Selection (Presets or Custom)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {LOGO_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setBrandingForm({ ...brandingForm, logoUrl: preset.url });
                          showNotice(`Selected ${preset.name} logo!`);
                        }}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          brandingForm.logoUrl === preset.url 
                            ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/20' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-lg" />
                        <span className="text-[10px] font-semibold text-slate-700 truncate w-full">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <input
                      type="text"
                      value={brandingForm.logoUrl || ''}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                      placeholder="Or paste custom Logo URL (https://...)"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0">
                      <Upload className="w-4 h-4 text-purple-700" />
                      <span>Upload Logo File</span>
                      <input type="file" accept="image/*" onChange={handleLogoFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    className="px-8 py-3 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Hero & Branding</span>
                  </button>
                </div>
              </div>
            )}

            {/* CMS 2: DOCTOR & ABOUT SECTION */}
            {cmsSubTab === 'about_doctor' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
                
                {/* Header with Title and Quick Save */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-purple-700" />
                      <span>Doctor Profile, Photos & About Section</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload doctor photos, manage clinical portrait gallery, qualifications, registration, and clinic philosophy.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveAbout()}
                    className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Doctor Profile</span>
                  </button>
                </div>

                {/* Section Display Visibility Toggle */}
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-200/80 rounded-xl text-purple-900">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-950">Show Doctor & About Section on Public Website</p>
                      <p className="text-[11px] text-purple-800">
                        When enabled, visitors will see the dedicated "Meet Your Chief Dental Surgeon" section with doctor photos and credentials.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aboutForm.showDoctorSection !== false}
                      onChange={(e) => setAboutForm({ ...aboutForm, showDoctorSection: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                  </label>
                </div>

                {/* ================= DOCTOR PHOTO MANAGEMENT BOX ================= */}
                <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200/90 rounded-3xl space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-700" />
                        <span>Doctor Profile Photo Management</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Add primary portrait of the Chief Doctor and additional clinical view photos.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                      Live Editable
                    </span>
                  </div>

                  {/* Primary Photo Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Active Photo Preview */}
                    <div className="md:col-span-4 flex flex-col items-center space-y-2">
                      <div className="relative w-48 h-60 rounded-2xl overflow-hidden border-2 border-purple-300 shadow-md bg-white group">
                        {aboutForm.doctorPhotoUrl ? (
                          <img
                            src={aboutForm.doctorPhotoUrl}
                            alt="Chief Doctor Preview"
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                            <span className="text-xs font-semibold">No photo uploaded</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-purple-900/90 text-white text-[10px] font-bold rounded-md shadow-xs">
                          Primary Photo
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 text-center font-medium">
                        Current Chief Doctor Portrait
                      </p>
                    </div>

                    {/* Right: Upload Actions & URL input */}
                    <div className="md:col-span-8 space-y-4">
                      
                      {/* Hidden File Input for Device Upload */}
                      <input
                        type="file"
                        ref={doctorPhotoFileInputRef}
                        accept="image/*"
                        onChange={handleDoctorPhotoUpload}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => doctorPhotoFileInputRef.current?.click()}
                          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Photo from Computer / Phone</span>
                        </button>

                        {aboutForm.doctorPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setAboutForm({ ...aboutForm, doctorPhotoUrl: '' });
                              showNotice("Cleared primary doctor photo");
                            }}
                            className="px-3 py-2.5 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            Clear Photo
                          </button>
                        )}
                      </div>

                      {/* Direct URL Input */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Or Enter Web Photo URL:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={doctorPhotoUrlInput}
                            onChange={(e) => setDoctorPhotoUrlInput(e.target.value)}
                            placeholder="https://example.com/doctor-portrait.jpg"
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (doctorPhotoUrlInput.trim()) {
                                const url = doctorPhotoUrlInput.trim();
                                const prev = aboutForm.doctorPhotos || [];
                                setAboutForm({
                                  ...aboutForm,
                                  doctorPhotoUrl: url,
                                  doctorPhotos: prev.includes(url) ? prev : [url, ...prev]
                                });
                                setDoctorPhotoUrlInput('');
                                showNotice("Applied doctor photo URL!");
                              }
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                          >
                            Apply URL
                          </button>
                        </div>
                      </div>

                      {/* Presets Gallery */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="block text-xs font-semibold text-slate-700">
                          Or Select from Professional Doctor Presets:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {DOCTOR_PHOTO_PRESETS.map((preset) => {
                            const isSelected = aboutForm.doctorPhotoUrl === preset.url;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  const prev = aboutForm.doctorPhotos || [];
                                  setAboutForm({
                                    ...aboutForm,
                                    doctorPhotoUrl: preset.url,
                                    doctorPhotos: prev.includes(preset.url) ? prev : [preset.url, ...prev]
                                  });
                                  showNotice(`Applied "${preset.name}" preset!`);
                                }}
                                className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1.5 transition cursor-pointer ${
                                  isSelected 
                                    ? 'bg-purple-100/80 border-purple-600 ring-2 ring-purple-400' 
                                    : 'bg-white border-slate-200 hover:border-purple-300'
                                }`}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.name}
                                  className="w-14 h-16 object-cover object-top rounded-lg shadow-2xs"
                                />
                                <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight line-clamp-2">
                                  {preset.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Doctor Additional Gallery Photos (Multiple Photos) */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">
                          Doctor & Clinic Photos Gallery ({aboutForm.doctorPhotos?.length || 0} Photos)
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Add multiple photos of the doctor at work, consulting patients, or during dental surgeries.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Hidden File Input for Gallery */}
                        <input
                          type="file"
                          ref={doctorGalleryFileInputRef}
                          accept="image/*"
                          onChange={handleAddDoctorGalleryPhoto}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => doctorGalleryFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Upload Photo to Gallery</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAddGalleryUrlInput(!showAddGalleryUrlInput)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          + Add via URL
                        </button>
                      </div>
                    </div>

                    {/* Optional URL input for gallery */}
                    {showAddGalleryUrlInput && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex gap-2 animate-in fade-in">
                        <input
                          type="url"
                          value={doctorGalleryUrlInput}
                          onChange={(e) => setDoctorGalleryUrlInput(e.target.value)}
                          placeholder="Paste image URL to add to doctor gallery..."
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (doctorGalleryUrlInput.trim()) {
                              const url = doctorGalleryUrlInput.trim();
                              setAboutForm({
                                ...aboutForm,
                                doctorPhotos: [...(aboutForm.doctorPhotos || []), url]
                              });
                              setDoctorGalleryUrlInput('');
                              setShowAddGalleryUrlInput(false);
                              showNotice("Added photo to gallery!");
                            }
                          }}
                          className="px-4 py-1.5 bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {/* Gallery Thumbnails Grid */}
                    {aboutForm.doctorPhotos && aboutForm.doctorPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {aboutForm.doctorPhotos.map((photoUrl, idx) => {
                          const isPrimary = aboutForm.doctorPhotoUrl === photoUrl;
                          return (
                            <div
                              key={idx}
                              className={`relative group rounded-xl overflow-hidden border p-1 bg-white shadow-xs ${
                                isPrimary ? 'border-purple-600 ring-2 ring-purple-300' : 'border-slate-200'
                              }`}
                            >
                              <img
                                src={photoUrl}
                                alt={`Doctor gallery ${idx + 1}`}
                                className="w-full h-24 object-cover object-top rounded-lg"
                              />
                              {isPrimary && (
                                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-900 text-white text-[9px] font-bold rounded">
                                  Primary
                                </span>
                              )}
                              <div className="mt-1 flex items-center justify-between gap-1 text-[10px]">
                                {!isPrimary && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAboutForm({ ...aboutForm, doctorPhotoUrl: photoUrl });
                                      showNotice("Set as primary doctor photo!");
                                    }}
                                    className="text-purple-700 font-bold hover:underline"
                                  >
                                    Set Main
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filtered = (aboutForm.doctorPhotos || []).filter((_, i) => i !== idx);
                                    setAboutForm({
                                      ...aboutForm,
                                      doctorPhotos: filtered,
                                      doctorPhotoUrl: isPrimary ? (filtered[0] || '') : aboutForm.doctorPhotoUrl
                                    });
                                    showNotice("Removed photo from gallery");
                                  }}
                                  className="text-red-500 hover:text-red-700 font-semibold p-0.5 ml-auto cursor-pointer"
                                  title="Delete photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No additional gallery photos added yet.</p>
                    )}
                  </div>

                </div>

                {/* ================= DOCTOR CREDENTIALS & INFORMATION ================= */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-700" />
                    <span>Doctor Credentials & Qualifications</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Chief Doctor Name *</label>
                      <input
                        type="text"
                        value={aboutForm.doctorName}
                        onChange={(e) => {
                          setAboutForm({ ...aboutForm, doctorName: e.target.value });
                          setBrandingForm({ ...brandingForm, doctorName: e.target.value });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Degrees & Qualifications</label>
                      <input
                        type="text"
                        value={aboutForm.doctorDegree}
                        onChange={(e) => {
                          setAboutForm({ ...aboutForm, doctorDegree: e.target.value });
                          setBrandingForm({ ...brandingForm, doctorDegree: e.target.value });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                        placeholder="B.D.S., M.D.S. (Orthodontics & Implantology)"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Specialization Designation</label>
                      <input
                        type="text"
                        value={aboutForm.doctorSpecialization}
                        onChange={(e) => {
                          setAboutForm({ ...aboutForm, doctorSpecialization: e.target.value });
                          setBrandingForm({ ...brandingForm, doctorSpecialization: e.target.value });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                        placeholder="Chief Dental Surgeon & Implantologist"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dental Council Reg. No.</label>
                      <input
                        type="text"
                        value={aboutForm.doctorRegNo || brandingForm.doctorRegNo || ''}
                        onChange={(e) => {
                          setAboutForm({ ...aboutForm, doctorRegNo: e.target.value });
                          setBrandingForm({ ...brandingForm, doctorRegNo: e.target.value });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                        placeholder="DC-58921 / DCI"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Years of Experience (e.g. 12+ Years)</label>
                      <input
                        type="text"
                        value={aboutForm.experienceYears}
                        onChange={(e) => setAboutForm({ ...aboutForm, experienceYears: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Happy Patients Transformed (e.g. 15,000+)</label>
                      <input
                        type="text"
                        value={aboutForm.happyPatients}
                        onChange={(e) => setAboutForm({ ...aboutForm, happyPatients: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* ================= ABOUT CLINIC & STORY ================= */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-700" />
                    <span>Clinic Story & Clinical Philosophy</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">About Section Title</label>
                      <input
                        type="text"
                        value={aboutForm.title}
                        onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">About Section Subtitle</label>
                      <input
                        type="text"
                        value={aboutForm.subtitle}
                        onChange={(e) => setAboutForm({ ...aboutForm, subtitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 mb-1">Detailed Clinic Bio / Description</label>
                    <textarea
                      rows={3}
                      value={aboutForm.description}
                      onChange={(e) => setAboutForm({ ...aboutForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 mb-1">Clinical Philosophy Quote</label>
                    <textarea
                      rows={2}
                      value={aboutForm.clinicPhilosophy}
                      onChange={(e) => setAboutForm({ ...aboutForm, clinicPhilosophy: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 italic"
                      placeholder="We believe in preserving natural teeth with painless precision..."
                    />
                  </div>
                </div>

                {/* ================= LIVE PREVIEW CARD ================= */}
                <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Live Preview: How Patients See This on Website
                      </span>
                    </div>
                    <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full text-blue-200">
                      Auto-syncing preview
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5 p-2">
                    <img
                      src={aboutForm.doctorPhotoUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80"}
                      alt={aboutForm.doctorName}
                      className="w-24 h-28 sm:w-28 sm:h-32 object-cover object-top rounded-2xl border-2 border-amber-400/80 shadow-lg shrink-0"
                    />
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="inline-block px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold rounded-md">
                        {aboutForm.doctorDegree || "B.D.S., M.D.S."}
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        {aboutForm.doctorName || "Dr. Anujay Sharma"}
                      </h4>
                      <p className="text-xs text-amber-300 font-semibold">
                        {aboutForm.doctorSpecialization || "Chief Dental Surgeon & Implantologist"}
                      </p>
                      <p className="text-[11px] text-blue-200 line-clamp-2 italic">
                        "{aboutForm.clinicPhilosophy || "Painless precision dental care for every family member."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveAbout()}
                    className="px-8 py-3 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Doctor & About Updates</span>
                  </button>
                </div>

              </div>
            )}

            {/* CMS 3: SERVICES & PROCEDURE VIDEOS */}
            {cmsSubTab === 'services' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Services, Pricing & Explainer Videos</h3>
                    <p className="text-xs text-slate-500">
                      Add, edit, or delete dental services, upload videos/photos from device, or paste web URLs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSrvName('');
                      setNewSrvPrice('₹ 2,000');
                      setNewSrvNumPrice(2000);
                      setNewSrvDuration('30 mins');
                      setNewSrvDesc('');
                      setNewSrvVideo('');
                      setNewSrvVideoSource('url');
                      setNewSrvImage('');
                      setNewSrvImageSource('url');
                      setIsAddServiceOpen(true);
                    }}
                    className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Dental Service</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {services.map((srv, idx) => (
                    <div key={srv.id ? `${srv.id}-${idx}` : `srv-${idx}`} className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                      {srv.imageUrl && (
                        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                          <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                            {srv.duration}
                          </span>
                        </div>
                      )}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-base">{srv.name}</h4>
                            <span className="font-black text-purple-900 text-base shrink-0">{srv.price}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{srv.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">
                            {srv.videoUrl ? '✓ Video attached' : 'No video attached'}
                          </span>
                          <div className="flex items-center gap-1">
                            {srv.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewVideoService(srv)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                                title="Watch / Test Explainer Video"
                              >
                                <Play className="w-3 h-3 fill-blue-700" />
                                <span>Watch</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditServiceItem(srv);
                                setEditSrvName(srv.name);
                                setEditSrvPrice(srv.price);
                                setEditSrvNumPrice(srv.numericPrice || 2000);
                                setEditSrvDuration(srv.duration);
                                setEditSrvDesc(srv.description);
                                setEditSrvVideo(srv.videoUrl || '');
                                setEditSrvImage(srv.imageUrl || '');
                              }}
                              className="px-3 py-1 bg-white hover:bg-purple-50 text-purple-900 font-bold border border-slate-200 rounded-lg text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                openConfirm(
                                  'Delete Service?',
                                  `Delete "${srv.name}" from website services list?`,
                                  () => {
                                    updateServices(services.filter(s => s.id !== srv.id));
                                    showNotice(`Deleted "${srv.name}"`);
                                  }
                                );
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMS 4: LOCATION & LIVE MAP (BHILAI) */}
            {cmsSubTab === 'location' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Clinic Location, Address & Directions</h3>
                    <p className="text-xs text-slate-500">
                      Edit the clinic's physical address, landmark, Google Maps links, and step-by-step directions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Location Details</span>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Clinic Address *</label>
                    <textarea
                      rows={2}
                      value={brandingForm.address}
                      onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Google Maps Share / App Link</label>
                      <input
                        type="url"
                        value={brandingForm.googleMapUrl}
                        onChange={(e) => setBrandingForm({ ...brandingForm, googleMapUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Opening Hours String</label>
                      <input
                        type="text"
                        value={brandingForm.openingHours}
                        onChange={(e) => setBrandingForm({ ...brandingForm, openingHours: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-900">Fixed Geolocation Coordinates for Bhilai</p>
                      <p className="text-blue-800 mt-0.5 text-[11px]">
                        Latitude: 21.2202723, Longitude: 81.3567154 (Shop no. 3, Infront of Utsav Bhavan, Supela, Bhilai, Chhattisgarh 490026).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    className="px-8 py-3 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Location Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* CMS 5: CLINIC PHOTOS GALLERY */}
            {cmsSubTab === 'photos' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Clinic Tour Photos ({gallery.length})</h3>
                    <p className="text-xs text-slate-500">
                      Add, delete, or organize photos of Reception, Treatment Operatories, Machines, and Autoclave Sterilization.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddPhotoOpen(true)}
                    className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery.map((photo, idx) => (
                    <div key={photo.id ? `${photo.id}-${idx}` : `ph-${idx}`} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 group">
                      <div className="relative aspect-video">
                        <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-white/90 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px]">
                          {photo.category}
                        </span>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{photo.title}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{photo.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            openConfirm(
                              'Delete Photo?',
                              `Delete "${photo.title}" from clinic virtual tour?`,
                              () => {
                                updateGallery(gallery.filter(p => p.id !== photo.id));
                                showNotice(`Deleted photo "${photo.title}"`);
                              }
                            );
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMS 6: SUNDAY CAMP & HIGHLIGHTS */}
            {cmsSubTab === 'sunday_highlights' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Sunday Checkup Camp & Clinic Highlights</h3>
                    <p className="text-xs text-slate-500">
                      Edit the weekly free checkup camp announcement, timings, and all 4 highlight cards.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveHighlights()}
                    className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Highlights</span>
                  </button>
                </div>

                <div className="text-xs space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Free Sunday Checkup Timings Text</label>
                    <input
                      type="text"
                      value={brandingForm.freeSundayTimings || 'Every Sunday 10:00 AM - 2:00 PM'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, freeSundayTimings: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-purple-900">Highlight Cards (4 Cards)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {highlightsList.map((hl, idx) => (
                      <div key={hl.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={hl.title}
                            onChange={(e) => {
                              const copy = [...highlightsList];
                              copy[idx].title = e.target.value;
                              setHighlightsList(copy);
                            }}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                            placeholder="Title..."
                          />
                          <input
                            type="text"
                            value={hl.badge}
                            onChange={(e) => {
                              const copy = [...highlightsList];
                              copy[idx].badge = e.target.value;
                              setHighlightsList(copy);
                            }}
                            className="w-28 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-[11px]"
                            placeholder="Badge..."
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={hl.description}
                          onChange={(e) => {
                            const copy = [...highlightsList];
                            copy[idx].description = e.target.value;
                            setHighlightsList(copy);
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveHighlights()}
                    className="px-8 py-3 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Highlights to Website</span>
                  </button>
                </div>
              </div>
            )}

            {/* CMS 7: FAQS SECTION */}
            {cmsSubTab === 'faqs' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Frequently Asked Questions (FAQs)</h3>
                    <p className="text-xs text-slate-500">Add, edit questions and answers, or delete FAQs displayed to patients.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFaqsList([...faqsList, { id: `faq-${Date.now()}`, question: 'New Question?', answer: 'Answer explanation here...' }])}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add FAQ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveFaqs()}
                      className="px-6 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Save FAQs
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {faqsList.map((faq, idx) => (
                    <div key={faq.id ? `${faq.id}-${idx}` : `faq-${idx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const copy = [...faqsList];
                            copy[idx].question = e.target.value;
                            setFaqsList(copy);
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setFaqsList(faqsList.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const copy = [...faqsList];
                          copy[idx].answer = e.target.value;
                          setFaqsList(copy);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMS 8: PATIENT REVIEWS */}
            {cmsSubTab === 'reviews' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Patient Reviews & Testimonials ({reviews.length})</h3>
                    <p className="text-xs text-slate-500">Approve, hide, or remove public feedback submitted by patients.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviews.map((rev, idx) => (
                    <div key={rev.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            ))}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rev.isApproved !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {rev.isApproved !== false ? 'Published' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-slate-700 italic">"{rev.reviewText}"</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rev.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => rev.id && toggleReviewApproval(rev.id, rev.isApproved === false)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700"
                          >
                            {rev.isApproved === false ? 'Approve' : 'Hide'}
                          </button>
                          <button
                            type="button"
                            onClick={() => rev.id && deleteReview(rev.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CMS 9: PRESCRIPTION LETTERHEAD CUSTOMIZATION */}
            {cmsSubTab === 'prescription' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Official Prescription Letterhead Customization</h3>
                    <p className="text-xs text-slate-500">
                      Configure the clinic letterhead banner, choose between doctor presets, or replace the banner with a custom graphic.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-purple-900 uppercase">1. Doctor Letterhead Preset</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="doc_preset"
                          checked={docPresetState === 'anup_hota'}
                          onChange={() => {
                            setDocPresetState('anup_hota');
                            setPrescriptionDoctorPreset('anup_hota');
                            showNotice("Switched letterhead to Dr. Anup Kumar Hota");
                          }}
                        />
                        <div>
                          <p className="font-bold text-slate-900">Dr. Anup Kumar Hota (Official Letterhead)</p>
                          <p className="text-[11px] text-slate-500">DENTAL SURGEON (BDS) • REG. NO. : CGDC/G/26/4876</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-purple-900 uppercase">2. Replace Top Header Banner</h4>
                    <p className="text-slate-600">
                      Upload any image to replace the top banner of the prescription. Applies to both screen preview and downloaded PDF.
                    </p>
                    <input
                      type="file"
                      ref={bannerUploadInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            showNotice("Optimizing banner image...");
                            const { dataUrl } = await compressImageFile(file, { maxWidth: 1000, maxHeight: 400, quality: 0.8, maxSizeBytes: 80 * 1024 });
                            if (dataUrl) {
                              saveActivePrescriptionBanner(dataUrl);
                              setActiveCustomBanner(dataUrl);
                              showNotice("Uploaded new prescription banner!");
                            }
                          } catch {
                            showNotice("Failed to process banner image.");
                          }
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bannerUploadInputRef.current?.click()}
                        className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Banner Image</span>
                      </button>
                      {activeCustomBanner && (
                        <button
                          type="button"
                          onClick={() => {
                            resetActivePrescriptionBanner();
                            setActiveCustomBanner(null);
                            showNotice("Reset banner to standard letterhead");
                          }}
                          className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700 font-semibold rounded-xl"
                        >
                          Reset Banner
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB: PRESCRIPTIONS & APPROVALS ================= */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <NewPrescriptionSection />
          </div>
        )}

        {/* ================= TAB: PATIENTS RECORD FOLDER ================= */}
        {activeTab === 'patients_folder' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PatientsRecordFolderView
              userRole="admin"
              onOpenPrescriptionModal={() => setActiveTab('prescriptions')}
              onOpenAddDocumentModal={() => setActiveTab('patient_billing')}
              onOpenAddInvoiceModal={() => setActiveTab('patient_billing')}
            />
          </div>
        )}

        {/* ================= PATIENT REPORTS & BILLING TAB ================= */}
        {activeTab === 'patient_billing' && (
          <PatientBillingManager
            userRole="admin"
            currentUserName={settings.doctorName || "Dr. Anujay Sharma (Admin)"}
          />
        )}

        {/* ================= COMPREHENSIVE ATTRACTIVE FINANCES SUITE ================= */}
        {activeTab === 'finances' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Top Sub-Navigation Header & Filter Toolbar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-900 rounded-2xl ring-2 ring-purple-200">
                  <Wallet className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Clinic Financial Command &amp; Accounts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time Income Receipts • Clinic Expenditures • Payment Modes • Profit &amp; Loss Ledgers
                  </p>
                </div>
              </div>

              {/* Sub-Tabs & Export Actions */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Date range filter */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFinanceDateRange('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      financeDateRange === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceDateRange('this_month')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      financeDateRange === 'this_month'
                        ? 'bg-white text-purple-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    This Month
                  </button>
                </div>

                {/* Sub Tab buttons */}
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('overview')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      financeSubTab === 'overview'
                        ? 'bg-purple-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('income')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      financeSubTab === 'income'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Income ({income.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('expenses')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      financeSubTab === 'expenses'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Expenses ({expenses.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('new_entry')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      financeSubTab === 'new_entry'
                        ? 'bg-indigo-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Log Entry</span>
                  </button>
                </div>

                {/* Excel Exports */}
                <button
                  type="button"
                  onClick={() => exportIncomeToExcel(income)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                  title="Export Income Ledger to Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Income Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportExpensesToExcel(expenses)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                  title="Export Expenses Ledger to Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Expenses Excel</span>
                </button>
              </div>
            </div>

            {/* Top 4 Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Gross Revenue */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>Gross Revenue</span>
                  <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  ₹ {grossIncomeTotal.toLocaleString()}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Direct: ₹{directIncomeTotal.toLocaleString()}</span>
                  <span>Appts: ₹{bookingsPaidTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* 2. Total Expenses */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>Total Clinic Expenses</span>
                  <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                    <TrendingDown className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-black text-rose-600 font-mono tracking-tight">
                  ₹ {totalExpenses.toLocaleString()}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{expenses.length} logged items</span>
                  <span className="text-rose-600 font-medium">Operational Outflow</span>
                </div>
              </div>

              {/* 3. Net Operating Profit */}
              <div className="p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-purple-200 text-xs font-bold mb-2">
                  <span>Net Operating Profit</span>
                  <span className="p-1.5 bg-white/10 text-emerald-300 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <p className={`text-3xl font-black font-mono tracking-tight ${netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  ₹ {netProfit.toLocaleString()}
                </p>
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-purple-200">
                  <span>Margin: <strong className="text-white">{profitMarginPercent}%</strong></span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    {netProfit >= 0 ? 'Profitable' : 'Deficit'}
                  </span>
                </div>
              </div>

              {/* 4. Pending Collections */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
                  <span>Pending Collections</span>
                  <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-3xl font-black text-amber-700 font-mono tracking-tight">
                  ₹ {pendingReceivable.toLocaleString()}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{bookings.filter(b => b.paymentStatus !== 'Paid' && b.status !== 'Cancelled').length} Unpaid Bookings</span>
                  <span className="text-amber-600 font-medium">Receivables</span>
                </div>
              </div>
            </div>

            {/* ================= SUB-TAB 1: OVERVIEW & ANALYTICS ================= */}
            {financeSubTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Cashflow Ratio Visual Progress Bar */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-700" />
                      Revenue vs Expense Ratio
                    </span>
                    <span className="text-slate-500">
                      Collections: <strong className="text-emerald-700">₹{grossIncomeTotal.toLocaleString()}</strong> | Expenses: <strong className="text-rose-600">₹{totalExpenses.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      style={{ width: `${Math.min(100, Math.max(0, grossIncomeTotal > 0 ? (netProfit / grossIncomeTotal) * 100 : 0))}%` }} 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      title={`Net Profit: ${profitMarginPercent}%`}
                    />
                    <div 
                      style={{ width: `${Math.min(100, Math.max(0, grossIncomeTotal > 0 ? (totalExpenses / grossIncomeTotal) * 100 : 100))}%` }} 
                      className="bg-rose-500 h-full transition-all duration-500" 
                      title="Operating Outflow"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Net Retained Profit ({profitMarginPercent}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Operating Outflow ({grossIncomeTotal > 0 ? (100 - profitMarginPercent) : 100}%)
                    </span>
                  </div>
                </div>

                {/* 2 Columns: Payment Modes + Expense Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Payment Modes Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Income by Payment Method</h3>
                        <p className="text-xs text-slate-500">Direct clinic collections &amp; online receipts</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                        {income.length} Receipts
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Cash */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-600" />
                            Cash Receipts ({income.filter(i => i.paymentMode === 'Cash').length})
                          </span>
                          <span className="font-mono text-slate-900">₹ {cashIncomeTotal.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${directIncomeTotal > 0 ? (cashIncomeTotal / directIncomeTotal) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* UPI */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-blue-600" />
                            UPI (Google Pay / PhonePe) ({income.filter(i => i.paymentMode === 'UPI').length})
                          </span>
                          <span className="font-mono text-slate-900">₹ {upiIncomeTotal.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${directIncomeTotal > 0 ? (upiIncomeTotal / directIncomeTotal) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Card */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                            Card / POS Machine ({income.filter(i => i.paymentMode === 'Card').length})
                          </span>
                          <span className="font-mono text-slate-900">₹ {cardIncomeTotal.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all"
                            style={{ width: `${directIncomeTotal > 0 ? (cardIncomeTotal / directIncomeTotal) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <button
                        type="button"
                        onClick={() => setFinanceSubTab('income')}
                        className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View full Income Ledger</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* Expense Breakdown Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Expense Allocation</h3>
                        <p className="text-xs text-slate-500">Clinic supplies, laboratory, and overheads</p>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full text-xs font-bold border border-rose-200">
                        {expenses.length} Records
                      </span>
                    </div>

                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {expenseCategoriesList.map((cat) => {
                        const catTotal = expenses
                          .filter(e => e.category === cat)
                          .reduce((s, e) => s + (e.amount || 0), 0);
                        const pct = totalExpenses > 0 ? Math.round((catTotal / totalExpenses) * 100) : 0;
                        if (catTotal === 0 && expenses.length > 0) return null;

                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700">{cat}</span>
                              <span className="font-mono text-slate-900 font-bold">₹ {catTotal.toLocaleString()} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-rose-500 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <button
                        type="button"
                        onClick={() => setFinanceSubTab('expenses')}
                        className="text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View full Expense Ledger</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Quick Action Prompt to Log New Entries */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl border border-purple-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-purple-950 text-sm">Need to record a new receipt or clinic expense?</h4>
                    <p className="text-xs text-purple-800">Quickly add patient treatment fees, dental supply purchases, or utility bills.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceEntryType('income');
                        setFinanceSubTab('new_entry');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Record Income</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceEntryType('expense');
                        setFinanceSubTab('new_entry');
                      }}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Log Expense</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ================= SUB-TAB 2: INCOME LEDGER ================= */}
            {financeSubTab === 'income' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                
                {/* Search & Mode Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={incomeSearch}
                      onChange={(e) => setIncomeSearch(e.target.value)}
                      placeholder="Search by patient name, service, or notes..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Payment Mode Pills */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {(['All', 'Cash', 'UPI', 'Card'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setIncomePaymentModeFilter(mode)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                          incomePaymentModeFilter === mode
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceEntryType('income');
                        setFinanceSubTab('new_entry');
                      }}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Income</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Patient / Source</th>
                        <th className="py-3 px-4">Treatment / Service</th>
                        <th className="py-3 px-4">Payment Mode</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredIncomeList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                            <p className="font-semibold text-slate-600">No income records found.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or click '+ Add Income' above.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredIncomeList.map((item: Income, idx: number) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                              {item.date || 'N/A'}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.source}
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {item.service || 'Dental Consultation'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.paymentMode === 'UPI' 
                                  ? 'bg-blue-50 text-blue-800 border-blue-200' 
                                  : item.paymentMode === 'Card'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {item.paymentMode === 'UPI' && <Smartphone className="w-2.5 h-2.5" />}
                                {item.paymentMode === 'Card' && <CreditCard className="w-2.5 h-2.5" />}
                                {item.paymentMode === 'Cash' && <Banknote className="w-2.5 h-2.5" />}
                                <span>{item.paymentMode || 'Cash'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {item.notes || '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm whitespace-nowrap">
                              + ₹ {item.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.id) {
                                    openConfirm(
                                      'Delete Income Entry?',
                                      `Are you sure you want to delete this income entry of ₹${item.amount.toLocaleString()} from ${item.source}?`,
                                      async () => {
                                        await deleteIncome(item.id!);
                                        showNotice("Deleted income record.");
                                      }
                                    );
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredIncomeList.length > 0 && (
                      <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={5} className="py-3 px-4 text-slate-700">
                            Total Filtered Income ({filteredIncomeList.length} items)
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-base">
                            ₹ {filteredIncomeList.reduce((s: number, i: Income) => s + (i.amount || 0), 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

              </div>
            )}

            {/* ================= SUB-TAB 3: EXPENSE LEDGER ================= */}
            {financeSubTab === 'expenses' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                
                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      placeholder="Search expense item, supplier, or note..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">Category:</span>
                    <select
                      value={expenseCategoryFilter}
                      onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="All">All Categories</option>
                      {expenseCategoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFinanceEntryType('expense');
                        setFinanceSubTab('new_entry');
                      }}
                      className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Expense</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Expense Item / Supply</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Notes / Vendor</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredExpensesList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-40 text-rose-600" />
                            <p className="font-semibold text-slate-600">No expense entries found.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing search or click '+ Add Expense' above.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredExpensesList.map((item: Expense, idx: number) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                              {item.date || 'N/A'}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                {item.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {item.notes || '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 text-sm whitespace-nowrap">
                              - ₹ {item.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.id) {
                                    openConfirm(
                                      'Delete Expense Record?',
                                      `Are you sure you want to delete this expense of ₹${item.amount.toLocaleString()} for "${item.name}"?`,
                                      async () => {
                                        await deleteExpense(item.id!);
                                        showNotice("Deleted expense entry.");
                                      }
                                    );
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredExpensesList.length > 0 && (
                      <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="py-3 px-4 text-slate-700">
                            Total Filtered Expenses ({filteredExpensesList.length} items)
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-rose-700 text-base">
                            ₹ {filteredExpensesList.reduce((s: number, e: Expense) => s + (e.amount || 0), 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

              </div>
            )}

            {/* ================= SUB-TAB 4: STREAMLINED QUICK ENTRY FORM ================= */}
            {financeSubTab === 'new_entry' && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
                
                {/* Segmented Entry Switcher */}
                <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFinanceEntryType('income')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                      financeEntryType === 'income'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Record Income (Receipt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinanceEntryType('expense')}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                      financeEntryType === 'expense'
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>Log Expense (Outflow)</span>
                  </button>
                </div>

                {/* Form: Income */}
                {financeEntryType === 'income' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!incomeSource.trim() || incomeAmount <= 0) return;
                    await addIncome({
                      source: incomeSource.trim(),
                      service: incomeService.trim(),
                      amount: Number(incomeAmount),
                      date: incomeDate,
                      paymentMode: incomeMode,
                      notes: incomeNotes.trim()
                    });
                    setIncomeSource('');
                    setIncomeNotes('');
                    showNotice("✓ Direct income receipt recorded successfully!");
                    setFinanceSubTab('income');
                  }} className="space-y-4 text-xs">
                    
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Patient Name or Income Source *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar / Walk-in Consultation"
                        value={incomeSource}
                        onChange={(e) => setIncomeSource(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Treatment / Dental Service</label>
                        <select
                          value={incomeService}
                          onChange={(e) => setIncomeService(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="General Consultation &amp; Checkup">General Consultation &amp; Checkup</option>
                          <option value="Single Sitting Root Canal (RCT)">Single Sitting Root Canal (RCT)</option>
                          <option value="Scaling &amp; Ultrasonic Polishing">Scaling &amp; Ultrasonic Polishing</option>
                          <option value="Dental Crown &amp; Bridge (Zirconia)">Dental Crown &amp; Bridge (Zirconia)</option>
                          <option value="Titanium Dental Implant">Titanium Dental Implant</option>
                          <option value="Tooth Extraction &amp; Wisdom Surgery">Tooth Extraction &amp; Wisdom Surgery</option>
                          <option value="Invisible Aligners / Braces">Invisible Aligners / Braces</option>
                          <option value="Teeth Whitening &amp; Bleaching">Teeth Whitening &amp; Bleaching</option>
                          <option value="Pharmacy Medicines Sale">Pharmacy Medicines Sale</option>
                          <option value="Other Dental Service">Other Dental Service</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Receipt Date</label>
                        <input
                          type="date"
                          value={incomeDate}
                          onChange={(e) => setIncomeDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Amount + Quick Amount chips */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Received Amount (₹ INR) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Enter amount"
                        value={incomeAmount || ''}
                        onChange={(e) => setIncomeAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto">
                        <span className="text-[11px] text-slate-500">Quick Fill:</span>
                        {[500, 1000, 1500, 2500, 5000, 10000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setIncomeAmount(val)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            ₹{val.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Payment Mode *</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { mode: 'Cash' as const, icon: Banknote, label: 'Cash at Desk' },
                          { mode: 'UPI' as const, icon: Smartphone, label: 'UPI / QR Code' },
                          { mode: 'Card' as const, icon: CreditCard, label: 'Debit / Credit' }
                        ].map(pm => {
                          const IconComp = pm.icon;
                          const isSelected = incomeMode === pm.mode;
                          return (
                            <button
                              key={pm.mode}
                              type="button"
                              onClick={() => setIncomeMode(pm.mode)}
                              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-400' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <IconComp className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                              <span className="text-xs">{pm.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Notes / Invoice No. (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Receipt #INV-104, Tooth 24 RCT Sitting 1"
                        value={incomeNotes}
                        onChange={(e) => setIncomeNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Record Income Entry</span>
                      </button>
                    </div>

                  </form>
                )}

                {/* Form: Expense */}
                {financeEntryType === 'expense' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!expenseName.trim() || expenseAmount <= 0) return;
                    await addExpense({
                      name: expenseName.trim(),
                      amount: Number(expenseAmount),
                      category: expenseCategory,
                      date: expenseDate,
                      notes: expenseNotes.trim()
                    });
                    setExpenseName('');
                    setExpenseNotes('');
                    showNotice("✓ Clinic expense logged successfully!");
                    setFinanceSubTab('expenses');
                  }} className="space-y-4 text-xs">
                    
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expense Item or Vendor *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dentsply Composite Syringes / Shiva Dental Lab"
                        value={expenseName}
                        onChange={(e) => setExpenseName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                          {expenseCategoriesList.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                        <input
                          type="date"
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>

                    {/* Amount + Quick Amount chips */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Spent Amount (₹ INR) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Enter spent amount"
                        value={expenseAmount || ''}
                        onChange={(e) => setExpenseAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto">
                        <span className="text-[11px] text-slate-500">Quick Fill:</span>
                        {[500, 1000, 2000, 3500, 5000, 15000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setExpenseAmount(val)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-600 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            ₹{val.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Supplier Details / Bill No. / Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Bill #8841, Monthly Autoclave pouches &amp; gloves"
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Log Clinic Expense</span>
                      </button>
                    </div>

                  </form>
                )}

              </div>
            )}

          </div>
        )}

        {/* ================= INVENTORY TAB ================= */}
        {activeTab === 'inventory' && (
          <InventoryManager themeColor="purple" allowDelete={true} />
        )}

        {/* ================= STAFF TAB ================= */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Authorized Staff Mobile Numbers ({staffList.length})</h3>
                <p className="text-xs text-slate-500">Only registered staff numbers can log in via OTP.</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setStaffError('');
              const clean = newStaffPhone.trim().replace(/\D/g, '').slice(-10);
              if (clean.length < 10) {
                setStaffError('Please enter a valid 10-digit mobile number.');
                return;
              }
              await addStaffMember({
                phone: clean,
                name: newStaffName.trim() || 'Staff Member',
                role: newStaffRole
              });
              setNewStaffPhone('');
              setNewStaffName('');
              showNotice(`Added staff ${newStaffName}`);
            }} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                required
                placeholder="Staff Full Name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Role / Designation"
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="tel"
                maxLength={10}
                required
                placeholder="10-digit mobile"
                value={newStaffPhone}
                onChange={(e) => setNewStaffPhone(e.target.value.replace(/\D/g, ''))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
              <button
                type="submit"
                className="py-2 px-4 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl"
              >
                + Authorize Staff
              </button>
            </form>

            {/* Pending Staff Approvals Banner */}
            {staffList.filter(s => s.status === 'pending' || s.isPendingApproval).length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      {staffList.filter(s => s.status === 'pending' || s.isPendingApproval).length} Staff Registration Request(s) Pending Approval
                    </span>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      New staff registrations cannot access the Staff Dashboard until you authorize and activate them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100 pt-4">
              {staffList.map((st, idx) => {
                const isPending = st.status === 'pending' || st.isPendingApproval;
                const isActive = st.active !== false && !isPending;
                return (
                  <div key={st.id || idx} className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs rounded-xl p-2 transition ${isPending ? 'bg-amber-50/50 border border-amber-200' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{st.name}</span>
                        <span className="text-slate-500 font-mono font-medium">+91 {st.phone}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
                          {st.role}
                        </span>
                        {isPending ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-bold animate-pulse">
                            Pending Admin Authorization
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        )}
                        {st.uid && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            UID: {st.uid.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Added: {st.addedAt ? new Date(st.addedAt).toLocaleDateString() : 'Active'}
                        {st.lastLoginAt && ` • Last Login: ${new Date(st.lastLoginAt).toLocaleDateString()}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* If pending, show Approve & Authorize button */}
                      {isPending && st.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateStaffMember(st.id!, {
                              active: true,
                              status: 'approved',
                              isPendingApproval: false
                            });
                            showNotice(`Authorized & activated ${st.name}!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Authorize</span>
                        </button>
                      )}

                      {/* Suspend / Activate toggle (if not pending) */}
                      {!isPending && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (st.id) {
                              await updateStaffMember(st.id, { active: !isActive });
                              showNotice(isActive ? `Suspended ${st.name}` : `Activated ${st.name}`);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}

                      {/* Delete / Revoke Access */}
                      <button
                        type="button"
                        onClick={() => {
                          if (st.id) {
                            openConfirm(
                              isPending ? 'Reject Staff Registration?' : 'Revoke Staff Access?', 
                              isPending 
                                ? `Reject and remove registration request for ${st.name}?` 
                                : `Revoke access and delete ${st.name} from the authorization allowlist?`, 
                              () => removeStaffMember(st.id!)
                            );
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title={isPending ? 'Reject Request' : 'Revoke & Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SECURITY TAB ================= */}
        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            
            {/* SECTION 0: ADMIN REGISTERED MOBILE NUMBER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Administrator Mobile Number</h3>
                    <p className="text-xs text-slate-500">
                      Primary mobile number used for Administrator sign-in and authorization. Can only be edited from this Admin section.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Only
                </span>
              </div>

              {/* Current Admin Number Display */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Current Registered Admin Number
                  </span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-700" />
                    <span className="text-base font-extrabold text-slate-900 tracking-wide">
                      +91 {extractClean10(adminConfig?.adminPhone || '7692808120')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Use this 10-digit number when logging in to the Clinic Admin interface.
                  </p>
                </div>
                {!isAdminPhoneEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminPhoneEditing(true);
                      setAdminNewPhoneInput(extractClean10(adminConfig?.adminPhone || '7692808120'));
                      setAdminPhoneMsg('');
                      setAdminPhoneErr('');
                      setAdminPhoneReauthInitial('');
                      setAdminPhoneReauthFinal('');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Change Number
                  </button>
                )}
              </div>

              {/* Feedback notices */}
              {adminPhoneMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{adminPhoneMsg}</span>
                </div>
              )}
              {adminPhoneErr && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminPhoneErr}</span>
                </div>
              )}

              {/* Form to Update Admin Number */}
              {isAdminPhoneEditing && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setAdminPhoneMsg('');
                    setAdminPhoneErr('');

                    const cleanNew = extractClean10(adminNewPhoneInput);
                    if (cleanNew.length !== 10) {
                      setAdminPhoneErr('Please enter a valid 10-digit mobile number.');
                      return;
                    }

                    if (!adminPhoneReauthInitial || !adminPhoneReauthFinal) {
                      setAdminPhoneErr('Both Current Initial Password and Final Password are required to authorize this change.');
                      return;
                    }

                    setAdminPhoneLoading(true);
                    try {
                      const res = await updateAdminPhoneNumber(
                        cleanNew,
                        adminPhoneReauthInitial,
                        adminPhoneReauthFinal
                      );

                      if (res.success) {
                        setAdminPhoneMsg(`Admin mobile number successfully updated to +91 ${cleanNew}!`);
                        updateAdminSecurityConfig({ adminPhone: cleanNew });
                        await refreshAdminConfig();
                        setIsAdminPhoneEditing(false);
                        setAdminPhoneReauthInitial('');
                        setAdminPhoneReauthFinal('');
                        showNotice(`Admin mobile number updated to +91 ${cleanNew}`);
                      } else {
                        setAdminPhoneErr(res.error || 'Failed to update administrator mobile number.');
                      }
                    } catch (err: any) {
                      setAdminPhoneErr(err.message || 'Error updating administrator mobile number.');
                    } finally {
                      setAdminPhoneLoading(false);
                    }
                  }}
                  className="space-y-4 text-xs bg-purple-50/50 p-4 rounded-2xl border border-purple-100"
                >
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      New Admin Mobile Number (10 digits) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 font-bold">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="e.g. 7692808120"
                        value={adminNewPhoneInput}
                        onChange={(e) => setAdminNewPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Future admin logins will require this new phone number.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-purple-200/60 space-y-3">
                    <p className="text-[11px] font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      Security Re-Authentication Required
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Current Initial Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={adminPhoneReauthInitial}
                          onChange={(e) => setAdminPhoneReauthInitial(e.target.value)}
                          placeholder="Current Initial Password"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Current Final Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={adminPhoneReauthFinal}
                          onChange={(e) => setAdminPhoneReauthFinal(e.target.value)}
                          placeholder="Current Final Password"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={adminPhoneLoading}
                      className="flex-1 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {adminPhoneLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Admin Number...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Confirm & Save Admin Number</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={adminPhoneLoading}
                      onClick={() => {
                        setIsAdminPhoneEditing(false);
                        setAdminPhoneErr('');
                        setAdminPhoneReauthInitial('');
                        setAdminPhoneReauthFinal('');
                      }}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* SECTION 1: ADMIN-CONTROLLED SECURITY QUESTION CONFIGURATION */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Clinic Recovery Question (Admin Only)</h3>
                    <p className="text-xs text-slate-500">
                      Centrally configured security question for patient, staff, and admin password recovery.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-200">
                  Version {adminConfig?.securityQuestionVersion || 1}
                </span>
              </div>

              {/* Current Configured Question Display */}
              <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider block">
                  Currently Active Recovery Question
                </span>
                <p className="text-sm font-bold text-purple-950">
                  "{adminConfig?.securityQuestion || INITIAL_SECURITY_QUESTION}"
                </p>
                <p className="text-[11px] text-purple-900/80">
                  Patients and staff cannot change this question. When replaced, all user accounts must reconfigure their answers.
                </p>
              </div>

              {/* Feedback notices */}
              {secQuestionMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{secQuestionMsg}</span>
                </div>
              )}
              {secQuestionErr && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{secQuestionErr}</span>
                </div>
              )}

              {/* Form to Replace Security Question */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSecQuestionMsg('');
                setSecQuestionErr('');

                if (!newSecQuestion.trim() || newSecQuestion.trim().length < 10) {
                  setSecQuestionErr('New security question must be at least 10 characters long.');
                  return;
                }
                if (!reauthInitialPwd || !reauthFinalPwd) {
                  setSecQuestionErr('Both Admin Initial Password and Final Password are required to re-authenticate.');
                  return;
                }

                setSecQuestionLoading(true);
                try {
                  const adminPhone = adminConfig?.adminPhone || '7692808120';
                  const res = await updateAdminSecurityQuestion(
                    adminPhone,
                    reauthInitialPwd,
                    reauthFinalPwd,
                    newSecQuestion
                  );

                  if (res.success) {
                    setSecQuestionMsg(`Security question updated to v${res.newVersion}! Recorded in audit logs.`);
                    setNewSecQuestion('');
                    setReauthInitialPwd('');
                    setReauthFinalPwd('');
                    showNotice("Security question updated!");
                  } else {
                    setSecQuestionErr(res.error || 'Failed to update security question.');
                  }
                } catch (err: any) {
                  setSecQuestionErr(err.message || 'Error updating security question.');
                } finally {
                  setSecQuestionLoading(false);
                }
              }} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Replace with New Security Question *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What was the name of your first elementary school teacher?"
                    value={newSecQuestion}
                    onChange={(e) => setNewSecQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Re-authentication Inputs */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="text-[11px] font-bold text-slate-700 block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-700" />
                    <span>Administrator Re-Authentication Required</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Current Initial Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Current Initial Pwd"
                        value={reauthInitialPwd}
                        onChange={(e) => setReauthInitialPwd(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Current Final Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Current Final Pwd"
                        value={reauthFinalPwd}
                        onChange={(e) => setReauthFinalPwd(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={secQuestionLoading || !newSecQuestion.trim()}
                  className="w-full py-3 bg-purple-800 hover:bg-purple-900 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {secQuestionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Re-Authenticating & Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Enforce New Security Question</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* SECTION 2: CHANGE ADMIN DUAL PASSWORDS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Manage Admin Credentials</h3>
                  <p className="text-xs text-slate-500">
                    Update the Initial Password and Final Password. Minimum 12 characters each. Both must differ.
                  </p>
                </div>
              </div>

              {adminPwdMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{adminPwdMsg}</span>
                </div>
              )}
              {adminPwdErr && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminPwdErr}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setAdminPwdMsg('');
                setAdminPwdErr('');

                const v1 = validatePassword(adminNewInitial);
                if (!v1.valid) {
                  setAdminPwdErr(`Initial ${v1.error}`);
                  return;
                }
                if (adminNewInitial !== adminConfirmInitial) {
                  setAdminPwdErr('New Initial Password confirmation does not match.');
                  return;
                }

                const v2 = validatePassword(adminNewFinal);
                if (!v2.valid) {
                  setAdminPwdErr(`Final ${v2.error}`);
                  return;
                }
                if (adminNewFinal !== adminConfirmFinal) {
                  setAdminPwdErr('New Final Password confirmation does not match.');
                  return;
                }

                if (adminNewInitial.trim() === adminNewFinal.trim()) {
                  setAdminPwdErr('Initial Password and Final Password cannot be identical.');
                  return;
                }

                setAdminPwdLoading(true);
                try {
                  const adminPhone = adminConfig?.adminPhone || '7692808120';
                  // Verify current credentials first
                  const c1 = await authenticateAdminInitialPassword(adminPhone, adminCurrentInitial);
                  // Secure direct update with server-side re-authentication
                  const res = await updateAdminPasswordsDirect(
                    adminPhone,
                    adminCurrentInitial,
                    adminCurrentFinal,
                    adminNewInitial,
                    adminNewFinal
                  );

                  if (res.success) {
                    setAdminPwdMsg('Both Initial Password and Final Password updated successfully!');
                    setAdminCurrentInitial('');
                    setAdminNewInitial('');
                    setAdminConfirmInitial('');
                    setAdminCurrentFinal('');
                    setAdminNewFinal('');
                    setAdminConfirmFinal('');
                    showNotice("Admin passwords updated!");
                  } else {
                    setAdminPwdErr(res.error || 'Failed to update admin passwords.');
                  }
                } catch (err: any) {
                  setAdminPwdErr(err.message || 'Error updating passwords.');
                } finally {
                  setAdminPwdLoading(false);
                }
              }} className="space-y-4 text-xs">
                
                {/* Current Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Current Initial"
                      value={adminCurrentInitial}
                      onChange={(e) => setAdminCurrentInitial(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Final Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Current Final"
                      value={adminCurrentFinal}
                      onChange={(e) => setAdminCurrentFinal(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                {/* New Initial Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 12 characters"
                      value={adminNewInitial}
                      onChange={(e) => setAdminNewInitial(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type initial"
                      value={adminConfirmInitial}
                      onChange={(e) => setAdminConfirmInitial(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                {/* New Final Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Final Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Must differ from initial"
                      value={adminNewFinal}
                      onChange={(e) => setAdminNewFinal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm Final Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Re-type final"
                      value={adminConfirmFinal}
                      onChange={(e) => setAdminConfirmFinal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminPwdLoading || !adminNewInitial || !adminNewFinal}
                  className="w-full py-3 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {adminPwdLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save New Initial & Final Passwords</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* SECTION 3: ADMIN PERSONAL SECURITY RECOVERY ANSWER */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Admin Secret Recovery Answer</h3>
                  <p className="text-xs text-slate-500">
                    Set or update your own secret answer for the active recovery question.
                  </p>
                </div>
              </div>

              {adminRecoveryAnswerMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{adminRecoveryAnswerMsg}</span>
                </div>
              )}
              {adminRecoveryAnswerErr && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminRecoveryAnswerErr}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setAdminRecoveryAnswerMsg('');
                setAdminRecoveryAnswerErr('');

                if (!adminRecoveryAnswerInput.trim()) {
                  setAdminRecoveryAnswerErr('Please enter your secret answer.');
                  return;
                }

                try {
                  const res = await setIndividualRecoveryAnswer('admin', 'config', '', adminRecoveryAnswerInput);
                  if (res.success) {
                    setAdminRecoveryAnswerMsg('Admin secret recovery answer securely saved!');
                    setAdminRecoveryAnswerInput('');
                    showNotice("Recovery answer saved!");
                  } else {
                    setAdminRecoveryAnswerErr(res.error || 'Failed to save answer.');
                  }
                } catch (err: any) {
                  setAdminRecoveryAnswerErr(err.message || 'Error saving answer.');
                }
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Your Answer to: "{adminConfig?.securityQuestion || INITIAL_SECURITY_QUESTION}"
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your secret answer"
                    value={adminRecoveryAnswerInput}
                    onChange={(e) => setAdminRecoveryAnswerInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Stored as a one-way secure hash. Never stored in plain text.</span>
                </div>

                <button
                  type="submit"
                  disabled={!adminRecoveryAnswerInput.trim()}
                  className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Save Secret Answer
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: WHATSAPP CAMPAIGN & BROADCAST CENTER                      */}
        {/* ============================================================== */}
        {activeTab === 'whatsapp_campaigns' && (
          <div className="space-y-6">
            <WhatsAppCampaignCenter />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: CLINIC NOTICES & CONTENT MANAGEMENT                       */}
        {/* ============================================================== */}
        {activeTab === 'clinic_notices' && (
          <div className="space-y-6">
            <AdminNoticeManager />
          </div>
        )}

      </div>

      {/* ================= ADD NEW DENTAL SERVICE MODAL ================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Dental Service</h3>
                  <p className="text-xs text-slate-500">Configure name, pricing, explainer video, and treatment photo.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laser Teeth Whitening"
                    value={newSrvName}
                    onChange={(e) => setNewSrvName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Price (e.g. ₹ 2,500)</label>
                  <input
                    type="text"
                    placeholder="₹ 2,500"
                    value={newSrvPrice}
                    onChange={(e) => setNewSrvPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numeric Estimated Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSrvNumPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewSrvNumPrice(val);
                      setNewSrvPrice(`₹ ${val.toLocaleString('en-IN')}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 mins"
                    value={newSrvDuration}
                    onChange={(e) => setNewSrvDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain procedure benefits, comfort, and clinical indication..."
                  value={newSrvDesc}
                  onChange={(e) => setNewSrvDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Explainer Video Field */}
              <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
                <label className="block font-bold text-purple-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-700" />
                    <span>Procedure Explainer Video (YouTube / Web)</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-normal">Auto-formats to embed</span>
                </label>
                <input
                  type="url"
                  placeholder="Paste YouTube watch or embed link (e.g. https://www.youtube.com/watch?v=...)"
                  value={newSrvVideo}
                  onChange={(e) => setNewSrvVideo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">
                  Patients can click "Watch Procedure Video" to learn about the treatment before booking.
                </p>
              </div>

              {/* Service Photo / Thumbnail */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Service Image / Thumbnail</label>
                <input
                  type="file"
                  ref={addSrvImageFileInputRef}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        showNotice("Optimizing service image...");
                        const { dataUrl } = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.75, maxSizeBytes: 70 * 1024 });
                        if (dataUrl) {
                          setNewSrvImage(dataUrl);
                          showNotice("Service image loaded and optimized!");
                        }
                      } catch {
                        showNotice("Failed to process service image.");
                      }
                    }
                  }}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter image URL or upload from device"
                    value={newSrvImage}
                    onChange={(e) => setNewSrvImage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => addSrvImageFileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
                {newSrvImage && (
                  <div className="w-28 h-16 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 mt-1">
                    <img src={newSrvImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save & Publish Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT DENTAL SERVICE MODAL ================= */}
      {editServiceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Service: {editServiceItem.name}</h3>
                  <p className="text-xs text-slate-500">Update pricing, procedure details, explainer video, or thumbnail.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditServiceItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateService} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Name *</label>
                  <input
                    type="text"
                    required
                    value={editSrvName}
                    onChange={(e) => setEditSrvName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Price (e.g. ₹ 2,000)</label>
                  <input
                    type="text"
                    value={editSrvPrice}
                    onChange={(e) => setEditSrvPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Numeric Estimated Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editSrvNumPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditSrvNumPrice(val);
                      setEditSrvPrice(`₹ ${val.toLocaleString('en-IN')}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    value={editSrvDuration}
                    onChange={(e) => setEditSrvDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editSrvDesc}
                  onChange={(e) => setEditSrvDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Explainer Video Field */}
              <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-purple-950 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-700" />
                    <span>Procedure Explainer Video URL</span>
                  </label>
                  {editSrvVideo && (
                    <button
                      type="button"
                      onClick={() => setPreviewVideoService({
                        ...editServiceItem,
                        videoUrl: editSrvVideo,
                        name: editSrvName
                      })}
                      className="text-purple-700 font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Play className="w-3 h-3 fill-purple-700" />
                      <span>Test Play Video</span>
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="Paste YouTube watch or embed link (e.g. https://www.youtube.com/watch?v=...)"
                  value={editSrvVideo}
                  onChange={(e) => setEditSrvVideo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-500">
                  Accepts standard YouTube links, youtu.be, shorts, or direct video files.
                </p>
              </div>

              {/* Service Photo / Thumbnail */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700">Service Image / Thumbnail</label>
                <input
                  type="file"
                  ref={editSrvImageFileInputRef}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        showNotice("Optimizing service image...");
                        const { dataUrl } = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.75, maxSizeBytes: 70 * 1024 });
                        if (dataUrl) {
                          setEditSrvImage(dataUrl);
                          showNotice("Service image loaded and optimized!");
                        }
                      } catch {
                        showNotice("Failed to process service image.");
                      }
                    }
                  }}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter image URL or upload from device"
                    value={editSrvImage}
                    onChange={(e) => setEditSrvImage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => editSrvImageFileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
                {editSrvImage && (
                  <div className="w-28 h-16 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 mt-1">
                    <img src={editSrvImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditServiceItem(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Update Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD CLINIC PHOTO MODAL ================= */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Clinic Tour Photo</h3>
                  <p className="text-xs text-slate-500">Showcase clinic infrastructure, treatment rooms, and machines.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePhoto} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Dental Chair & Operatory"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newPhotoCat}
                  onChange={(e) => setNewPhotoCat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                >
                  <option value="Reception">Reception & Waiting Lounge</option>
                  <option value="Treatment">Treatment Operatories</option>
                  <option value="Machines">Digital Machines & X-Ray</option>
                  <option value="Sterilization">Autoclave Sterilization</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image Source (File or Web Link) *</label>
                <input
                  type="file"
                  ref={addPhotoFileInputRef}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        showNotice("Optimizing gallery photo...");
                        const { dataUrl } = await compressImageFile(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.75, maxSizeBytes: 90 * 1024 });
                        if (dataUrl) {
                          setNewPhotoUrl(dataUrl);
                          showNotice("Gallery photo loaded and optimized!");
                        }
                      } catch {
                        showNotice("Failed to process gallery photo.");
                      }
                    }
                  }}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="Enter image URL or upload from device"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => addPhotoFileInputRef.current?.click()}
                    className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
                {newPhotoUrl && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 relative bg-slate-900 mt-2">
                    <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Caption / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Equipped with intraoral sensor and ultra-quiet motor"
                  value={newPhotoDesc}
                  onChange={(e) => setNewPhotoDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPhotoOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Publish Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADMIN EXPLAINER VIDEO PREVIEW MODAL ================= */}
      {previewVideoService && (
        <VideoModal
          isOpen={true}
          service={previewVideoService}
          onClose={() => setPreviewVideoService(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
