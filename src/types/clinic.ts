export interface AllowedStaff {
  id?: string;
  phone: string;
  name: string;
  role: string;
  addedAt?: string;
  active?: boolean;
  uid?: string;
  password?: string;
  passwordHash?: string;
  failedAttempts?: number;
  lockedUntil?: string | null;
  recoveryAnswerHash?: string;
  recoveryQuestionVersion?: number;
  lastLoginAt?: string;
  status?: 'approved' | 'pending' | 'rejected';
  isPendingApproval?: boolean;
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  role: 'admin' | 'staff' | 'patient';
  name?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AdminConfig {
  password?: string;
  initialPasswordHash?: string;
  finalPasswordHash?: string;
  adminPhone?: string;
  adminUid?: string;
  otpRequired?: boolean;
  autoLogoutMinutes?: number;
  securityQuestion?: string;
  securityQuestionVersion?: number;
  recoveryAnswerHash?: string;
  recoveryQuestionVersion?: number;
  failedAttempts?: number;
  lockedUntil?: string | null;
  updatedAt?: string;
}

export interface InventoryItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  minThreshold?: number;
  updatedAt: string;
}

export interface Patient {
  id?: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  address?: string;
  notes?: string;
  totalVisits: number;
  lastVisit?: string;
  createdAt: string;
  password?: string;
  passwordHash?: string;
  failedAttempts?: number;
  lockedUntil?: string | null;
  recoveryAnswerHash?: string;
  recoveryQuestionVersion?: number;
  hasAccount?: boolean;
  registeredOnline?: boolean;
  whatsappConsent?: boolean;
  whatsappOptOut?: boolean;
  whatsappConsentDate?: string;
  whatsappConsentSource?: 'portal_registration' | 'patient_portal' | 'in_clinic' | 'booking' | 'manual';
  whatsappLastNotificationAt?: string;
  whatsappLastDeliveryStatus?: 'delivered' | 'failed' | 'opted_out' | 'sent';
}

export interface MedicineEntry {
  name: string;
  dosage: string;
  frequency: string; // e.g., "1-0-1", "TDS", "SOS"
  duration: string; // e.g., "5 days"
  instructions: string; // e.g., "After food"
}

export interface Prescription {
  id?: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  showPhoneOnPrescription?: boolean;
  age?: number;
  gender?: string;
  ageSex?: string; // Unified Age / Sex field (e.g. "28 / M")
  date: string;
  address?: string;
  chiefComplaint?: string; // C / C
  onExamination?: string; // O / E
  pastMedicalHistory?: string; // PMH
  treatmentAdvised?: string; // TREATMENT ADVISED
  serviceTaken?: string;
  resultUpdate?: string;
  prescriptionText?: string;
  medicinesList?: MedicineEntry[];
  doctorName?: string;
  doctorDegree?: string;
  doctorRegNo?: string;
  customBannerUrl?: string;
  visitNotes?: string; // Short history / clinic notes for this visit
  previousVisitNotes?: string; // Associated previous visit history
  createdAt?: string;
  isPublishedToPortal?: boolean; // When false, hidden from patient portal
  createdByRole?: 'admin' | 'staff' | 'doctor';
  createdByName?: string;
  approvalStatus?: 'approved' | 'pending_approval' | 'draft';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Booking {
  id?: string;
  patientName: string;
  phone: string;
  service: string;
  date: string;
  timeSlot: string;
  problemDescription?: string;
  status: 'New' | 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Paid';
  fee: number;
  seenByStaff: boolean;
  createdAt: string;
}

export interface Review {
  id?: string;
  name: string;
  rating: number;
  reviewText: string;
  date: string;
  isApproved?: boolean;
}

export interface AboutContent {
  title: string;
  subtitle: string;
  description: string;
  doctorName: string;
  doctorDegree: string;
  doctorSpecialization: string;
  doctorRegNo?: string;
  experienceYears: string;
  happyPatients: string;
  clinicPhilosophy: string;
  doctorPhotoUrl?: string;
  doctorPhotos?: string[];
  showDoctorSection?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HighlightItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: string;
}

export interface Expense {
  id?: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Income {
  id?: string;
  source: string;
  service: string;
  amount: number;
  date: string;
  paymentMode: 'Cash' | 'UPI' | 'Card';
  notes?: string;
  createdAt: string;
}

export interface DentalService {
  id: string;
  name: string;
  price: string;
  numericPrice: number;
  duration: string;
  description: string;
  features: string[];
  icon: string;
  videoUrl: string;
  videoTitle: string;
  videoSource?: 'url' | 'upload';
  imageUrl?: string;
  imageSource?: 'url' | 'upload';
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  logoUrl?: string;
  logoPreset?: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  cityState?: string;
  email?: string;
  googleMapUrl: string;
  googleMapEmbedQuery: string;
  openingHours: string;
  emergencyPhone: string;
  consultationFee: number;
  doctorName: string;
  doctorDegree: string;
  doctorSpecialization: string;
  doctorRegNo: string;
  experienceYears?: string;
  freeSundayTimings?: string;
  announcementBanner?: string;
  isBannerActive?: boolean;
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroUsp1?: string;
  heroUsp2?: string;
  heroUsp3?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  updatedAt?: string;
}

export interface ClinicPhoto {
  id: string;
  title: string;
  category: 'Reception' | 'Treatment' | 'Machines' | 'Sterilization';
  url: string;
  description: string;
}

export type DocumentCategory = 
  | 'Dental Prescription'
  | 'X-Ray / Dental Imaging'
  | 'Laboratory Report'
  | 'Medical or Dental Report'
  | 'Invoice / Bill'
  | 'Treatment Plan'
  | 'Other Documents';

export interface PatientDocument {
  id?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  documentDate: string;
  fileUrl: string;
  fileName: string;
  fileType: string; // e.g. application/pdf, image/jpeg, image/png
  fileSize: number; // in bytes
  uploaderName: string;
  uploaderRole: 'staff' | 'admin';
  isPublished: boolean; // Accessible in patient portal
  isChunked?: boolean;
  chunksCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  invoiceDate: string;
  treatmentDescription: string;
  totalCharges: number;
  discount: number;
  finalAmount: number; // totalCharges - discount
  amountPaid: number;
  outstandingBalance: number; // finalAmount - amountPaid
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientPayment {
  id?: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  referenceNumber?: string;
  recordedBy: string;
  recordedByRole: 'staff' | 'admin';
  notes?: string;
  isRefund?: boolean;
  createdAt: string;
}

export interface AuditLog {
  id?: string;
  patientId: string;
  patientName?: string;
  action: string;
  details: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
}

export type CampaignType = 'text' | 'image' | 'video' | 'offer' | 'notice';

export type CampaignCategory = 
  | 'promotional' 
  | 'announcement' 
  | 'festival_greeting' 
  | 'timing_update' 
  | 'health_awareness' 
  | 'service_update' 
  | 'appointment_reminder';

export type CampaignStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'queued' 
  | 'processing' 
  | 'submitted' 
  | 'delivered' 
  | 'partially_failed' 
  | 'failed' 
  | 'cancelled';

export type AudienceType = 
  | 'all_eligible' 
  | 'consented_only' 
  | 'recent_patients' 
  | 'male_only' 
  | 'female_only';

export interface CampaignOfferDetails {
  discountText?: string;
  couponCode?: string;
  startDate?: string;
  expiryDate?: string;
  terms?: string;
}

export interface CampaignStats {
  totalRecipients: number;
  submitted: number;
  delivered: number;
  read: number;
  failed: number;
  optedOutExcluded: number;
  invalidExcluded: number;
}

export interface WhatsAppCampaign {
  id?: string;
  title: string;
  type: CampaignType;
  category: CampaignCategory;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaCaption?: string;
  mediaFileName?: string;
  mediaFileSize?: number;
  offerDetails?: CampaignOfferDetails;
  ctaText?: string;
  ctaUrl?: string;
  audienceType: AudienceType;
  status: CampaignStatus;
  scheduledAt?: string;
  scheduledTimezone?: string;
  createdAt: string;
  createdBy: string;
  sentAt?: string;
  completedAt?: string;
  stats: CampaignStats;
  idempotencyKey?: string;
  errorDetails?: string;
  isTemplate?: boolean;
}

export type RecipientDeliveryStatus = 
  | 'pending' 
  | 'submitted' 
  | 'delivered' 
  | 'read' 
  | 'failed' 
  | 'opted_out';

export interface CampaignRecipient {
  id?: string;
  campaignId: string;
  patientId?: string;
  patientName: string;
  phoneNumber: string; // Normalized E.164 (e.g. +919876543210)
  status: RecipientDeliveryStatus;
  whatsappMessageId?: string;
  error?: string;
  retryCount: number;
  lastAttemptAt?: string;
  submittedAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface WhatsAppConfigStatus {
  isConfigured: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  hasAccessToken: boolean;
  webhookVerified: boolean;
  verifiedPhoneNumber?: string;
  missingKeys: string[];
}

// ==========================================
// CLINIC NOTICES & INFORMATION BOARD TYPES
// ==========================================

export type NoticeCategory = 
  | 'offer_promotion'
  | 'important_notice'
  | 'general_announcement'
  | 'custom'
  | 'timing_holiday'
  | 'new_service'
  | 'events'
  | 'health_awareness'
  | 'photo_poster'
  | 'educational_video';

export type NoticePriority = 'urgent' | 'high' | 'normal' | 'low';

export type NoticeStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'changes_requested'
  | 'rejected'
  | 'published'
  | 'scheduled'
  | 'unpublished'
  | 'expired'
  | 'archived';

export interface NoticeAuditEntry {
  action: 
    | 'created' 
    | 'updated' 
    | 'submitted_for_approval' 
    | 'approved' 
    | 'rejected' 
    | 'changes_requested' 
    | 'published' 
    | 'unpublished' 
    | 'archived'
    | 'pinned'
    | 'unpinned';
  performedBy: string;
  performedByRole: 'admin' | 'staff';
  performedByPhone?: string;
  timestamp: string;
  notes?: string;
}

export interface NoticeOfferDetails {
  discountText?: string;
  couponCode?: string;
  validUntil?: string;
  terms?: string;
}

export interface ClinicNotice {
  id?: string;
  title: string;
  category: NoticeCategory;
  customCategory?: string; // Custom category label configured by staff or admin
  priority: NoticePriority;
  content: string; // Markdown / multiline text
  summary?: string; // Short lead text

  // Eye-catching Offer / Notice Highlights
  mainHighlight?: string; // e.g. "50% OFF", "₹500 OFF", "FREE CHECKUP", "WALK-IN OPD"
  applicableServices?: string; // e.g. "Ultrasonic Scaling & Polishing", "Root Canal", "All Services"
  ctaText?: string; // e.g. "Claim Offer", "Book Visit", "View Details"
  ctaUrl?: string; // Custom anchor e.g. "#booking"
  termsAndConditions?: string; // Specific offer terms & conditions
  isFeatured?: boolean; // Prominently displayed in homepage spotlight

  // Media attachments
  mediaType?: 'image' | 'video' | 'poster' | 'none';
  mediaUrl?: string; // Data URL or external image/poster link
  mediaCaption?: string;
  videoUrl?: string; // YouTube, Vimeo, or video URL
  videoTitle?: string;

  // Promotional Offer Specifics
  offerDetails?: NoticeOfferDetails;

  // Publication dates & schedule
  publishDate: string; // YYYY-MM-DD or ISO string
  expiryDate?: string; // Optional expiry date YYYY-MM-DD
  isPinned: boolean; // Pinned to top of board

  // Status & Author
  status: NoticeStatus;
  authorName: string;
  authorRole: 'admin' | 'staff';
  authorPhone?: string;

  // Review & Admin feedback
  adminFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  publishedAt?: string;

  // Audit trail
  auditHistory: NoticeAuditEntry[];

  createdAt: string;
  updatedAt: string;
}

