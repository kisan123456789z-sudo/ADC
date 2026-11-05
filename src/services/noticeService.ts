import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { connectivityService } from './connectivityService';
import { 
  ClinicNotice, 
  NoticeStatus, 
  NoticeCategory, 
  NoticeAuditEntry 
} from '../types/clinic';
import { sanitizeForFirestore } from './whatsappService';
import { getVideoThumbnailUrl } from '../components/common/VideoModal';

const NOTICES_CONTENT_DOC = 'clinic_notices_store';
const LOCAL_STORAGE_KEY_NOTICES = 'anujay_clinic_notices_cache';

// Helper to ensure all video notices have accessible thumbnails
export const enrichNoticeThumbnails = (notices: ClinicNotice[]): ClinicNotice[] => {
  return notices.map(n => {
    if (n.videoUrl && !n.mediaUrl) {
      const autoThumb = getVideoThumbnailUrl(n.videoUrl);
      if (autoThumb) {
        return { ...n, mediaUrl: autoThumb };
      }
    }
    return n;
  });
};

// Seed notices for realistic initial clinic data
export const INITIAL_CLINIC_NOTICES: ClinicNotice[] = [
  {
    id: 'notice_seed_1',
    title: 'Sunday Extended Emergency & Walk-in OPD Timings',
    category: 'timing_holiday',
    priority: 'urgent',
    mainHighlight: 'EMERGENCY OPD',
    applicableServices: 'Acute Toothache, Broken Fillings, Dental Trauma',
    ctaText: 'Visit Sunday OPD',
    isFeatured: true,
    content: `Dear Patients,\n\nWe understand that dental toothaches and sudden emergencies cannot wait for Monday. AnuJay Dental Clinic is pleased to announce extended Sunday emergency hours.\n\n* **Sunday Emergency OPD**: 10:00 AM – 2:00 PM\n* **Weekday Regular Hours**: 10:00 AM – 1:30 PM & 5:00 PM – 9:00 PM (Mon to Sat)\n* **Location**: Shop no. 3, In front of Utsav Bhavan, Supela, Bhilai.\n\nFor sudden trauma, severe throbbing pain, or broken restorations, walk in directly or call our emergency desk at +91 98765 43210.`,
    summary: 'Sunday Emergency OPD now open from 10:00 AM to 2:00 PM for urgent toothache and trauma care.',
    mediaType: 'poster',
    mediaUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    mediaCaption: 'Emergency dental operatory at AnuJay Dental Clinic',
    publishDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    isPinned: true,
    status: 'published',
    authorName: 'Dr. Jayesh Sen',
    authorRole: 'admin',
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    auditHistory: [
      {
        action: 'created',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        notes: 'Initial administrative publication'
      },
      {
        action: 'published',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        notes: 'Directly published by clinic administrator'
      }
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'notice_seed_2',
    title: 'Festival Care: Full Mouth Ultrasonic Scaling & Polishing Special',
    category: 'offer_promotion',
    priority: 'high',
    mainHighlight: '₹500 OFF',
    applicableServices: 'Ultrasonic Piezoelectric Scaling & Micro-Polishing',
    ctaText: 'Claim Offer',
    termsAndConditions: 'Valid on complete full-mouth ultrasonic scaling appointments. Single use per patient. Prior appointment recommended.',
    isFeatured: true,
    content: `Celebrate the festive season with a brighter, healthier smile!\n\nAvail our comprehensive Ultrasonic Scaling, Stain Removal, and Fluoride Enamel Polishing package at special festive savings.\n\n* **Complete Plaque & Tartar Removal** using gentle German piezoelectric ultrasonic tips.\n* **Enamel Micro-Polishing** for stain removal and natural tooth glow.\n* **Complimentary Digital Camera Intraoral Checkup**.\n\nUse coupon code **SMILEFEST** at reception. Walk-in or book online through the Patient Portal.`,
    summary: 'Complete ultrasonic scaling and stain removal package at special festive rates with coupon code SMILEFEST.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1000&q=80',
    mediaCaption: 'Ultrasonic Piezoelectric Teeth Cleaning at AnuJay Clinic',
    offerDetails: {
      discountText: 'Special Flat ₹500 Festive Savings',
      couponCode: 'SMILEFEST',
      validUntil: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
      terms: 'Applicable on complete full-mouth scaling appointments. One coupon per patient.'
    },
    publishDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10),
    isPinned: false,
    status: 'published',
    authorName: 'Dr. Jayesh Sen',
    authorRole: 'admin',
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    auditHistory: [
      {
        action: 'created',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        action: 'published',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'notice_seed_3',
    title: 'Comprehensive Dental Consultation & Digital X-Ray Package',
    category: 'offer_promotion',
    priority: 'normal',
    mainHighlight: '50% OFF',
    applicableServices: 'Digital RVG X-Ray & Comprehensive Oral Examination',
    ctaText: 'Explore Offer',
    termsAndConditions: 'Applies to first-time consultations and routine preventive dental checks. Walk-in or book online.',
    isFeatured: true,
    content: `Start your preventive dental journey with our comprehensive oral health evaluation!\n\nIncludes:\n* High-definition digital RVG sensor X-ray of target teeth with ultra-low radiation.\n* Full tooth-by-tooth cavity and gum health charting.\n* Clear, honest clinical consultation with Dr. Jayesh Sen.\n\nBook your slot this month and receive 50% discount on initial clinical examination fees.`,
    summary: 'Get 50% discount on comprehensive oral checkup and HD digital RVG dental radiography.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1000&q=80',
    mediaCaption: 'Modern digital intraoral diagnostic radiography at AnuJay Clinic',
    offerDetails: {
      discountText: '50% Off Consultation & RVG X-Ray',
      couponCode: 'FIRSTSMILE',
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      terms: 'Applicable for all new outpatient registrations.'
    },
    publishDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isPinned: false,
    status: 'published',
    authorName: 'Dr. Jayesh Sen',
    authorRole: 'admin',
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    auditHistory: [
      {
        action: 'created',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        action: 'published',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'notice_seed_4',
    title: 'Free Pediatric Dental Screening & Fluoride Varnish Camp',
    category: 'health_awareness',
    priority: 'high',
    mainHighlight: 'FREE CAMP',
    applicableServices: 'Children Dental Checkup & Cavity Prevention Varnish',
    ctaText: 'Register Child',
    termsAndConditions: 'For children aged 3 to 14 years. Parents must accompany. Prior token reservation required.',
    isFeatured: true,
    content: `Protect your child's developing teeth from early childhood decay and sweet tooth erosion.\n\nJoin our community Oral Health Awareness Camp this Saturday:\n* Free pediatric dental exam and milk teeth growth assessment.\n* Protective Fluoride Varnish application for cavity-prone teeth.\n* Oral hygiene kit and fun brushing education for kids.\n\nLimited to 40 children. Call our reception to reserve your entry pass.`,
    summary: 'Community preventive health camp offering complimentary pediatric oral checkups and fluoride varnish.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1000&q=80',
    mediaCaption: 'Gentle, child-friendly pediatric dental care at AnuJay Clinic',
    publishDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    isPinned: false,
    status: 'published',
    authorName: 'Dr. Jayesh Sen',
    authorRole: 'admin',
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    auditHistory: [
      {
        action: 'created',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        action: 'published',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'notice_seed_5',
    title: 'Educational Guide: Proper Brushing Technique & Flossing Protocol',
    category: 'educational_video',
    priority: 'normal',
    mainHighlight: 'VIDEO GUIDE',
    applicableServices: 'Preventive Oral Hygiene & Gum Health Maintenance',
    ctaText: 'Watch Video',
    isFeatured: false,
    content: `Did you know that 80% of gum bleeding and sensitivity can be reversed within 14 days with the correct Modified Bass brushing technique?\n\nWatch our chief dental surgeon demonstrate the proper 45-degree angle circular motion, gentle gum sulcus sweeping, and interdental flossing tips.\n\nKey takeaways:\n1. Use soft bristles only; hard bristles erode enamel.\n2. Brush for 2 full minutes twice daily.\n3. Clean tongue gently to eliminate bacteria causing morning breath.`,
    summary: 'Clinical video demonstration on the Modified Bass technique to stop gum bleeding and preserve enamel.',
    mediaType: 'video',
    mediaUrl: 'https://img.youtube.com/vi/xm9c5HAUBpY/hqdefault.jpg',
    mediaCaption: 'Video: Modified Bass Brushing & Flossing Guide',
    videoUrl: 'https://www.youtube.com/watch?v=xm9c5HAUBpY',
    videoTitle: 'Modified Bass Dental Brushing Technique & Flossing Guide',
    publishDate: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    isPinned: false,
    status: 'published',
    authorName: 'Dr. Jayesh Sen',
    authorRole: 'admin',
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    auditHistory: [
      {
        action: 'created',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
      },
      {
        action: 'published',
        performedBy: 'Dr. Jayesh Sen',
        performedByRole: 'admin',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

/**
 * Loads all notices from Firestore content document or local cache
 */
export async function getNoticesList(): Promise<ClinicNotice[]> {
  try {
    const snap = await getDoc(doc(db, 'content', NOTICES_CONTENT_DOC));
    if (snap.exists() && snap.data()?.data) {
      const parsed = JSON.parse(snap.data().data) as ClinicNotice[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const enriched = enrichNoticeThumbnails(parsed);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_NOTICES, JSON.stringify(enriched));
        } catch {}
        return enriched;
      }
    }
  } catch (err: any) {
    console.warn("Could not fetch notices from content document:", err);
    try {
      connectivityService.reportNetworkFailure(err);
    } catch {}
  }

  // Check local cache
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_NOTICES);
    if (cached) {
      const parsed = JSON.parse(cached) as ClinicNotice[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return enrichNoticeThumbnails(parsed);
      }
    }
  } catch {}

  // If in development and completely fresh, allow initial seed; never substitute mock notices in production on network failure
  if (import.meta.env.DEV) {
    try {
      await saveNoticesToStore(INITIAL_CLINIC_NOTICES);
      return enrichNoticeThumbnails(INITIAL_CLINIC_NOTICES);
    } catch {}
  }

  return [];
}

/**
 * Persists the entire notices array to Firestore and local cache
 */
async function saveNoticesToStore(notices: ClinicNotice[]): Promise<boolean> {
  const sanitized = notices.map(n => sanitizeForFirestore(n));
  const serialized = JSON.stringify(sanitized);

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTICES, serialized);
  } catch {}

  try {
    await setDoc(doc(db, 'content', NOTICES_CONTENT_DOC), {
      sectionKey: NOTICES_CONTENT_DOC,
      data: serialized,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Failed to persist notices to Firestore content store:", err);
    return false;
  }
}

/**
 * Patient-Facing Filter:
 * Only returns notices that are:
 * 1. status === 'published'
 * 2. publishDate <= today (schedule check)
 * 3. !expiryDate || expiryDate >= today (expiry check)
 * 4. Pinned notices first, then newest publishDate
 */
export async function getPublishedNoticesForPatients(): Promise<ClinicNotice[]> {
  const all = await getNoticesList();
  const todayStr = new Date().toISOString().slice(0, 10);

  const active = all.filter(n => {
    if (n.status !== 'published') return false;
    if (n.publishDate && n.publishDate > todayStr) return false; // Future scheduled
    if (n.expiryDate && n.expiryDate < todayStr) return false; // Expired
    return true;
  });

  // Sort: pinned first, then chronological
  active.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.publishDate || b.createdAt).localeCompare(a.publishDate || a.createdAt);
  });

  return active;
}

/**
 * Public Website Offers & Notices Query:
 * Returns published, currently active offers & announcements with featured items first.
 */
export async function getPublicOffersAndNotices(): Promise<ClinicNotice[]> {
  const active = await getPublishedNoticesForPatients();
  // Sort: pinned first, featured second, then newest date
  return active.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return (b.publishDate || b.createdAt).localeCompare(a.publishDate || a.createdAt);
  });
}

/**
 * Saves or updates a clinic notice with strict workflow & role validation.
 *
 * Enforces:
 * 1. Staff CANNOT publish directly; if staff submits for publication, it goes to `pending_approval`.
 * 2. If an approved staff notice is edited, it reverts to `pending_approval`.
 * 3. Detailed audit trail is recorded.
 */
export async function saveNoticeRecord(
  noticeData: Partial<ClinicNotice>,
  actor: { name: string; role: 'admin' | 'staff'; phone?: string },
  actionType: NoticeAuditEntry['action'] = 'created',
  actionNotes?: string
): Promise<{ success: boolean; id: string; notice: ClinicNotice }> {
  const allNotices = await getNoticesList();
  const now = new Date().toISOString();
  const todayStr = now.slice(0, 10);

  const targetId = noticeData.id || `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const existingNotice = allNotices.find(n => n.id === targetId);

  // Status computation with security enforcement
  let computedStatus: NoticeStatus = noticeData.status || 'draft';

  // Security guard: Staff can NEVER publish directly
  if (actor.role === 'staff') {
    if (computedStatus === 'published' || computedStatus === 'approved') {
      computedStatus = 'pending_approval';
    }
    // Re-approval rule: If an approved staff notice is edited, require re-approval
    if (existingNotice && (existingNotice.status === 'approved' || existingNotice.status === 'published')) {
      computedStatus = 'pending_approval';
      actionNotes = (actionNotes ? actionNotes + ' • ' : '') + 'Re-submitted for Admin approval after content modification.';
    }
  }

  // Admin direct publication auto-timestamp
  let publishedAt = existingNotice?.publishedAt;
  if (computedStatus === 'published') {
    publishedAt = publishedAt || now;
  } else if (computedStatus === 'unpublished' || computedStatus === 'draft') {
    publishedAt = undefined;
  }

  // Audit Entry
  const auditEntry: NoticeAuditEntry = {
    action: actionType,
    performedBy: actor.name,
    performedByRole: actor.role,
    performedByPhone: actor.phone,
    timestamp: now,
    notes: actionNotes
  };

  const existingAudit = existingNotice?.auditHistory || [];
  const updatedAudit = [auditEntry, ...existingAudit];

  const noticeToSave: ClinicNotice = sanitizeForFirestore({
    id: targetId,
    title: (noticeData.title || existingNotice?.title || 'Clinic Notice').trim(),
    category: noticeData.category || existingNotice?.category || 'important_notice',
    priority: noticeData.priority || existingNotice?.priority || 'normal',
    content: (noticeData.content || existingNotice?.content || '').trim(),
    summary: (noticeData.summary || existingNotice?.summary || '').trim(),
    
    // Prominent Highlight & Offer Details
    mainHighlight: noticeData.mainHighlight !== undefined ? noticeData.mainHighlight?.trim() : existingNotice?.mainHighlight,
    applicableServices: noticeData.applicableServices !== undefined ? noticeData.applicableServices?.trim() : existingNotice?.applicableServices,
    ctaText: noticeData.ctaText !== undefined ? noticeData.ctaText?.trim() : existingNotice?.ctaText,
    ctaUrl: noticeData.ctaUrl !== undefined ? noticeData.ctaUrl?.trim() : existingNotice?.ctaUrl,
    termsAndConditions: noticeData.termsAndConditions !== undefined ? noticeData.termsAndConditions?.trim() : existingNotice?.termsAndConditions,
    isFeatured: typeof noticeData.isFeatured === 'boolean' ? noticeData.isFeatured : (existingNotice?.isFeatured || false),

    mediaType: noticeData.mediaType || existingNotice?.mediaType || (noticeData.videoUrl ? 'video' : 'none'),
    mediaUrl: noticeData.mediaUrl || existingNotice?.mediaUrl || (noticeData.videoUrl ? getVideoThumbnailUrl(noticeData.videoUrl) || undefined : undefined),
    mediaCaption: noticeData.mediaCaption || existingNotice?.mediaCaption,
    videoUrl: noticeData.videoUrl || existingNotice?.videoUrl,
    videoTitle: noticeData.videoTitle || existingNotice?.videoTitle,
    offerDetails: noticeData.offerDetails || existingNotice?.offerDetails,
    publishDate: noticeData.publishDate || existingNotice?.publishDate || todayStr,
    expiryDate: noticeData.expiryDate || existingNotice?.expiryDate,
    isPinned: typeof noticeData.isPinned === 'boolean' ? noticeData.isPinned : (existingNotice?.isPinned || false),
    status: computedStatus,
    authorName: existingNotice?.authorName || actor.name,
    authorRole: existingNotice?.authorRole || actor.role,
    authorPhone: existingNotice?.authorPhone || actor.phone,
    adminFeedback: computedStatus === 'pending_approval' ? undefined : (noticeData.adminFeedback || existingNotice?.adminFeedback),
    reviewedBy: existingNotice?.reviewedBy,
    reviewedAt: existingNotice?.reviewedAt,
    approvedBy: computedStatus === 'published' && actor.role === 'admin' ? actor.name : existingNotice?.approvedBy,
    approvedAt: computedStatus === 'published' && actor.role === 'admin' ? now : existingNotice?.approvedAt,
    publishedAt,
    auditHistory: updatedAudit,
    createdAt: existingNotice?.createdAt || now,
    updatedAt: now
  });

  const existingIndex = allNotices.findIndex(n => n.id === targetId);
  let updatedList: ClinicNotice[];
  if (existingIndex >= 0) {
    updatedList = allNotices.map((n, i) => i === existingIndex ? noticeToSave : n);
  } else {
    updatedList = [noticeToSave, ...allNotices];
  }

  await saveNoticesToStore(updatedList);
  return { success: true, id: targetId, notice: noticeToSave };
}

/**
 * Admin Review Workflow: Approve, Reject, or Request Changes
 */
export async function reviewStaffNotice(
  noticeId: string,
  decision: 'approve' | 'reject' | 'changes_requested',
  adminName: string,
  comments?: string,
  directPublish = true
): Promise<{ success: boolean; notice?: ClinicNotice; error?: string }> {
  const allNotices = await getNoticesList();
  const notice = allNotices.find(n => n.id === noticeId);
  if (!notice) {
    return { success: false, error: 'Notice record not found.' };
  }

  const now = new Date().toISOString();
  let newStatus: NoticeStatus;
  let auditAction: NoticeAuditEntry['action'];

  if (decision === 'approve') {
    newStatus = directPublish ? 'published' : 'approved';
    auditAction = 'approved';
  } else if (decision === 'reject') {
    newStatus = 'rejected';
    auditAction = 'rejected';
  } else {
    newStatus = 'changes_requested';
    auditAction = 'changes_requested';
  }

  const auditEntry: NoticeAuditEntry = {
    action: auditAction,
    performedBy: adminName,
    performedByRole: 'admin',
    timestamp: now,
    notes: comments || `Admin review action: ${decision}`
  };

  const updatedNotice: ClinicNotice = {
    ...notice,
    status: newStatus,
    adminFeedback: decision === 'approve' ? undefined : (comments || 'Changes required before publication.'),
    reviewedBy: adminName,
    reviewedAt: now,
    approvedBy: decision === 'approve' ? adminName : notice.approvedBy,
    approvedAt: decision === 'approve' ? now : notice.approvedAt,
    publishedAt: newStatus === 'published' ? now : notice.publishedAt,
    auditHistory: [auditEntry, ...(notice.auditHistory || [])],
    updatedAt: now
  };

  const updatedList = allNotices.map(n => n.id === noticeId ? updatedNotice : n);
  await saveNoticesToStore(updatedList);

  return { success: true, notice: updatedNotice };
}

/**
 * Admin action: Pin / Unpin notice
 */
export async function togglePinNotice(
  noticeId: string,
  isPinned: boolean,
  adminName: string
): Promise<boolean> {
  const allNotices = await getNoticesList();
  const target = allNotices.find(n => n.id === noticeId);
  if (!target) return false;

  const now = new Date().toISOString();
  const auditEntry: NoticeAuditEntry = {
    action: isPinned ? 'pinned' : 'unpinned',
    performedBy: adminName,
    performedByRole: 'admin',
    timestamp: now,
    notes: isPinned ? 'Pinned announcement to the top of Patient Notice Board' : 'Unpinned notice'
  };

  const updatedNotice: ClinicNotice = {
    ...target,
    isPinned,
    auditHistory: [auditEntry, ...(target.auditHistory || [])],
    updatedAt: now
  };

  const updatedList = allNotices.map(n => n.id === noticeId ? updatedNotice : n);
  await saveNoticesToStore(updatedList);
  return true;
}

/**
 * Admin action: Unpublish or Archive notice
 */
export async function changeNoticeStatus(
  noticeId: string,
  newStatus: 'unpublished' | 'archived' | 'published',
  adminName: string,
  reason?: string
): Promise<boolean> {
  const allNotices = await getNoticesList();
  const target = allNotices.find(n => n.id === noticeId);
  if (!target) return false;

  const now = new Date().toISOString();
  const auditAction: NoticeAuditEntry['action'] = 
    newStatus === 'published' ? 'published' : (newStatus === 'archived' ? 'archived' : 'unpublished');

  const auditEntry: NoticeAuditEntry = {
    action: auditAction,
    performedBy: adminName,
    performedByRole: 'admin',
    timestamp: now,
    notes: reason || `Status updated to ${newStatus}`
  };

  const updatedNotice: ClinicNotice = {
    ...target,
    status: newStatus,
    publishedAt: newStatus === 'published' ? (target.publishedAt || now) : target.publishedAt,
    auditHistory: [auditEntry, ...(target.auditHistory || [])],
    updatedAt: now
  };

  const updatedList = allNotices.map(n => n.id === noticeId ? updatedNotice : n);
  await saveNoticesToStore(updatedList);
  return true;
}

/**
 * Admin-only: Delete notice permanently
 */
export async function deleteNoticeRecord(noticeId: string): Promise<boolean> {
  const allNotices = await getNoticesList();
  const filtered = allNotices.filter(n => n.id !== noticeId);
  await saveNoticesToStore(filtered);
  return true;
}
