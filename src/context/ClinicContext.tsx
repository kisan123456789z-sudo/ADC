import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import { 
  Booking, 
  InventoryItem, 
  Patient, 
  Prescription, 
  Review, 
  Expense, 
  Income,
  AllowedStaff, 
  ClinicSettings, 
  AboutContent, 
  FaqItem, 
  HighlightItem, 
  DentalService, 
  ClinicPhoto,
  PatientDocument,
  Invoice,
  PatientPayment,
  AuditLog
} from '../types/clinic';
import { 
  DEFAULT_SETTINGS, 
  DEFAULT_ABOUT, 
  DEFAULT_FAQS, 
  DEFAULT_HIGHLIGHTS, 
  DEFAULT_SERVICES, 
  DEFAULT_PHOTOS,
  seedInitialClinicData 
} from '../services/seedData';
import { 
  storeDocumentFileChunks, 
  sanitizeForFirestore,
  compressDataUrl
} from '../utils/fileStorageHelper';

interface ClinicContextType {
  settings: ClinicSettings;
  about: AboutContent;
  faqs: FaqItem[];
  highlights: HighlightItem[];
  services: DentalService[];
  gallery: ClinicPhoto[];
  bookings: Booking[];
  newBookingsCount: number;
  inventory: InventoryItem[];
  patients: Patient[];
  prescriptions: Prescription[];
  reviews: Review[];
  expenses: Expense[];
  income: Income[];
  staffList: AllowedStaff[];
  documents: PatientDocument[];
  invoices: Invoice[];
  patientPayments: PatientPayment[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;

  // Mutators
  updateSettings: (newSettings: Partial<ClinicSettings>) => Promise<boolean>;
  updateAbout: (newAbout: AboutContent) => Promise<boolean>;
  updateFaqs: (newFaqs: FaqItem[]) => Promise<boolean>;
  updateHighlights: (newHighlights: HighlightItem[]) => Promise<boolean>;
  updateServices: (newServices: DentalService[]) => Promise<boolean>;
  updateGallery: (newGallery: ClinicPhoto[]) => Promise<boolean>;

  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'seenByStaff' | 'status' | 'paymentStatus'>) => Promise<{ success: boolean; id?: string }>;
  markBookingSeen: (id: string) => Promise<boolean>;
  updateBookingStatus: (id: string, status: Booking['status'], paymentStatus?: Booking['paymentStatus']) => Promise<boolean>;
  updateBookingDetails: (id: string, updates: Partial<Booking>) => Promise<boolean>;
  deleteBooking: (id: string) => Promise<boolean>;

  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<boolean>;
  updateInventoryQuantity: (id: string, newQty: number) => Promise<boolean>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteInventoryItem: (id: string) => Promise<boolean>;

  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'totalVisits'>) => Promise<{ success: boolean; id?: string }>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;

  addPrescription: (presc: Omit<Prescription, 'id' | 'createdAt'>) => Promise<{ success: boolean; id?: string }>;
  updatePrescription: (id: string, updates: Partial<Prescription>) => Promise<boolean>;
  updatePrescriptionResult: (id: string, resultUpdate: string) => Promise<boolean>;
  deletePrescription: (id: string) => Promise<boolean>;

  addReview: (review: Omit<Review, 'id' | 'date'>) => Promise<boolean>;
  deleteReview: (id: string) => Promise<boolean>;
  toggleReviewApproval: (id: string, isApproved: boolean) => Promise<boolean>;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<boolean>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;

  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<boolean>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<boolean>;
  deleteIncome: (id: string) => Promise<boolean>;

  addStaffMember: (staff: Omit<AllowedStaff, 'id' | 'addedAt'>) => Promise<boolean>;
  updateStaffMember: (id: string, updates: Partial<AllowedStaff>) => Promise<boolean>;
  removeStaffMember: (id: string) => Promise<boolean>;

  sendPatientReminder: (booking: Booking) => void;

  // Patient Reports & Billing Mutators
  addDocument: (docData: Omit<PatientDocument, 'id' | 'createdAt'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateDocument: (id: string, updates: Partial<PatientDocument>, auditDetails?: string, performedBy?: string, performedByRole?: string) => Promise<boolean>;
  replaceDocumentFile: (id: string, newFile: { fileUrl: string; fileName: string; fileType: string; fileSize: number }, uploader: string, uploaderRole: 'staff' | 'admin') => Promise<boolean>;
  deleteDocument: (id: string, patientId: string, performedBy: string, performedByRole: string) => Promise<boolean>;

  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'amountPaid' | 'outstandingBalance' | 'paymentStatus' | 'invoiceNumber'> & { invoiceNumber?: string }) => Promise<{ success: boolean; id?: string; invoiceNumber: string }>;
  updateInvoice: (id: string, updates: Partial<Invoice>, auditDetails?: string, performedBy?: string, performedByRole?: string) => Promise<boolean>;
  deleteInvoice: (id: string, patientId: string, performedBy: string, performedByRole: string) => Promise<boolean>;

  addPayment: (paymentData: Omit<PatientPayment, 'id' | 'createdAt'>) => Promise<{ success: boolean; id?: string }>;
  recordRefundOrCorrection: (paymentId: string, reason: string, performedBy: string, performedByRole: 'staff' | 'admin') => Promise<boolean>;
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  deleteAuditLog: (id: string) => Promise<boolean>;
  clearPatientAuditLogs: (patientId: string) => Promise<boolean>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);
  const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [highlights, setHighlights] = useState<HighlightItem[]>(DEFAULT_HIGHLIGHTS);
  const [services, setServices] = useState<DentalService[]>(DEFAULT_SERVICES);
  const [gallery, setGallery] = useState<ClinicPhoto[]>(DEFAULT_PHOTOS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [staffList, setStaffList] = useState<AllowedStaff[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patientPayments, setPatientPayments] = useState<PatientPayment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const recentReviewSubmissionsRef = useRef<Set<string>>(new Set());

  // Initialize and seed if empty with timeout fallback
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 2000);

    seedInitialClinicData()
      .catch((err) => {
        console.warn('Seed data initial load note:', err);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // Listen to Content docs
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'content', 'settings'), async (snap) => {
      if (snap.exists() && snap.data()?.data) {
        try {
          const parsed = JSON.parse(snap.data().data);
          if (!parsed.address || !parsed.address.includes('Utsav Bhavan') || parsed.address.includes('Kohka') || parsed.address.includes('Gudhiyari')) {
            let corrected = {
              ...parsed,
              address: 'Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026',
              cityState: 'Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026',
              googleMapEmbedQuery: 'AnuJay Dental Clinic, Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026',
              googleMapUrl: 'https://maps.app.goo.gl/z2c6moS2vPQ87f1V8'
            };
            // Safely compress logoUrl if it was oversized
            if (corrected.logoUrl && corrected.logoUrl.startsWith('data:image/') && corrected.logoUrl.length > 80000) {
              try {
                corrected.logoUrl = await compressDataUrl(corrected.logoUrl, { maxWidth: 500, maxHeight: 500, quality: 0.8, maxSizeBytes: 60 * 1024 });
              } catch {}
            }
            setSettings(corrected);
            const serialized = JSON.stringify(corrected);
            if (serialized.length < 800000) {
              setDoc(doc(db, 'content', 'settings'), {
                sectionKey: 'settings',
                data: serialized,
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(console.warn);
            }
          } else {
            setSettings(parsed);
          }
        } catch {
          // fallback
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'content/settings'));

    const unsubAbout = onSnapshot(doc(db, 'content', 'about'), (snap) => {
      if (snap.exists() && snap.data()?.data) {
        try {
          const parsed = JSON.parse(snap.data().data);
          setAbout({ ...DEFAULT_ABOUT, ...parsed });
        } catch {}
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'content/about'));

    const unsubFaq = onSnapshot(doc(db, 'content', 'faq'), (snap) => {
      if (snap.exists() && snap.data()?.data) {
        try {
          setFaqs(JSON.parse(snap.data().data));
        } catch {}
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'content/faq'));

    const unsubHighlights = onSnapshot(doc(db, 'content', 'highlights'), (snap) => {
      if (snap.exists() && snap.data()?.data) {
        try {
          setHighlights(JSON.parse(snap.data().data));
        } catch {}
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'content/highlights'));

    const unsubServices = onSnapshot(doc(db, 'content', 'services'), (snap) => {
      if (snap.exists() && snap.data()?.data) {
        try {
          setServices(JSON.parse(snap.data().data));
        } catch {}
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'content/services'));

    const unsubGallery = onSnapshot(doc(db, 'content', 'gallery'), (snap) => {
      if (snap.exists() && snap.data()?.data) {
        try {
          setGallery(JSON.parse(snap.data().data));
        } catch {}
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'content/gallery'));

    return () => {
      unsubSettings();
      unsubAbout();
      unsubFaq();
      unsubHighlights();
      unsubServices();
      unsubGallery();
    };
  }, []);

  // 1. Listen to Public Inventory (safe for all visitors)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      const map = new Map<string, InventoryItem>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as InventoryItem));
      const items = Array.from(map.values());
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setInventory(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'inventory'));
    return () => unsub();
  }, []);

  // 2. Listen to Public Patient Reviews (safe for all visitors)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reviews'), (snap) => {
      const map = new Map<string, Review>();
      const seenSignatures = new Set<string>();
      snap.docs.forEach(d => {
        const data = d.data() as Review;
        const sig = `${(data.name || '').trim().toLowerCase()}:::${(data.reviewText || '').trim().toLowerCase()}`;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          map.set(d.id, { id: d.id, ...data });
        }
      });
      const items = Array.from(map.values());
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setReviews(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'reviews'));
    return () => unsub();
  }, []);

  // 3. Listen to Bookings (Authorized Staff & Admin Only)
  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') {
      setBookings([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'bookings'), (snap) => {
      const map = new Map<string, Booking>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Booking));
      const items = Array.from(map.values());
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setBookings(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'bookings'));
    return () => unsub();
  }, [role]);

  // 4. Listen to Patients (Authorized Staff & Admin Only)
  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') {
      setPatients([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'patients'), (snap) => {
      const map = new Map<string, Patient>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Patient));
      const items = Array.from(map.values());
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setPatients(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'patients'));
    return () => unsub();
  }, [role]);

  // 5. Listen to Prescriptions (Staff/Admin: all; Patient: scoped to activePatientId)
  useEffect(() => {
    if (role === 'admin' || role === 'staff') {
      const unsub = onSnapshot(collection(db, 'prescriptions'), (snap) => {
        const map = new Map<string, Prescription>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Prescription));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setPrescriptions(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'prescriptions'));
      return () => unsub();
    } else if (activePatientId) {
      const q = query(collection(db, 'prescriptions'), where('patientId', '==', activePatientId));
      const unsub = onSnapshot(q, (snap) => {
        const map = new Map<string, Prescription>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Prescription));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setPrescriptions(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'prescriptions'));
      return () => unsub();
    } else {
      setPrescriptions([]);
    }
  }, [role, activePatientId]);

  // 6. Listen to Expenses (Staff & Admin Only)
  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') {
      setExpenses([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'expenses'), (snap) => {
      const map = new Map<string, Expense>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Expense));
      const items = Array.from(map.values());
      items.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
      setExpenses(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'expenses'));
    return () => unsub();
  }, [role]);

  // 7. Listen to Direct Clinic Income (Staff & Admin Only)
  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') {
      setIncome([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'income'), (snap) => {
      const map = new Map<string, Income>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Income));
      const items = Array.from(map.values());
      items.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
      setIncome(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'income'));
    return () => unsub();
  }, [role]);

  // 8. Listen to Allowed Staff (Staff & Admin Only)
  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') {
      setStaffList([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'allowed_staff'), (snap) => {
      const map = new Map<string, AllowedStaff>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as AllowedStaff));
      const items = Array.from(map.values());
      setStaffList(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'allowed_staff'));
    return () => unsub();
  }, [role]);

  // 9. Listen to Patient Documents (Staff/Admin: all; Patient: scoped to activePatientId)
  useEffect(() => {
    if (role === 'admin' || role === 'staff') {
      const unsub = onSnapshot(collection(db, 'documents'), (snap) => {
        const map = new Map<string, PatientDocument>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as PatientDocument));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.documentDate || b.createdAt || '').localeCompare(a.documentDate || a.createdAt || ''));
        setDocuments(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'documents'));
      return () => unsub();
    } else if (activePatientId) {
      const q = query(collection(db, 'documents'), where('patientId', '==', activePatientId));
      const unsub = onSnapshot(q, (snap) => {
        const map = new Map<string, PatientDocument>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as PatientDocument));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.documentDate || b.createdAt || '').localeCompare(a.documentDate || a.createdAt || ''));
        setDocuments(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'documents'));
      return () => unsub();
    } else {
      setDocuments([]);
    }
  }, [role, activePatientId]);

  // 10. Listen to Invoices (Staff/Admin: all; Patient: scoped to activePatientId)
  useEffect(() => {
    if (role === 'admin' || role === 'staff') {
      const unsub = onSnapshot(collection(db, 'invoices'), (snap) => {
        const map = new Map<string, Invoice>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Invoice));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.invoiceDate || b.createdAt || '').localeCompare(a.invoiceDate || a.createdAt || ''));
        setInvoices(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'invoices'));
      return () => unsub();
    } else if (activePatientId) {
      const q = query(collection(db, 'invoices'), where('patientId', '==', activePatientId));
      const unsub = onSnapshot(q, (snap) => {
        const map = new Map<string, Invoice>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Invoice));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.invoiceDate || b.createdAt || '').localeCompare(a.invoiceDate || a.createdAt || ''));
        setInvoices(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'invoices'));
      return () => unsub();
    } else {
      setInvoices([]);
    }
  }, [role, activePatientId]);

  // 11. Listen to Patient Payments (Staff/Admin: all; Patient: scoped to activePatientId)
  useEffect(() => {
    if (role === 'admin' || role === 'staff') {
      const unsub = onSnapshot(collection(db, 'patient_payments'), (snap) => {
        const map = new Map<string, PatientPayment>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as PatientPayment));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.paymentDate || b.createdAt || '').localeCompare(a.paymentDate || a.createdAt || ''));
        setPatientPayments(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'patient_payments'));
      return () => unsub();
    } else if (activePatientId) {
      const q = query(collection(db, 'patient_payments'), where('patientId', '==', activePatientId));
      const unsub = onSnapshot(q, (snap) => {
        const map = new Map<string, PatientPayment>();
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as PatientPayment));
        const items = Array.from(map.values());
        items.sort((a, b) => (b.paymentDate || b.createdAt || '').localeCompare(a.paymentDate || a.createdAt || ''));
        setPatientPayments(items);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'patient_payments'));
      return () => unsub();
    } else {
      setPatientPayments([]);
    }
  }, [role, activePatientId]);

  // 12. Listen to Audit Logs (Admin & Staff Only)
  useEffect(() => {
    if (role !== 'admin' && role !== 'staff') {
      setAuditLogs([]);
      return;
    }
    const unsub = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const map = new Map<string, AuditLog>();
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as AuditLog));
      const items = Array.from(map.values());
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setAuditLogs(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'audit_logs'));
    return () => unsub();
  }, [role]);

  const newBookingsCount = bookings.filter(b => b.status === 'New').length;

  // Mutator Implementations
  const updateSettings = async (newSettings: Partial<ClinicSettings>): Promise<boolean> => {
    try {
      let merged = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };

      // Ensure logo image data URL is compressed and never exceeds Firestore 1MB limits
      if (merged.logoUrl && merged.logoUrl.startsWith('data:image/') && merged.logoUrl.length > 80000) {
        try {
          merged.logoUrl = await compressDataUrl(merged.logoUrl, { 
            maxWidth: 500, 
            maxHeight: 500, 
            quality: 0.82, 
            maxSizeBytes: 65 * 1024 
          });
        } catch (e) {
          console.warn("Could not compress logoUrl:", e);
        }
      }

      let serialized = JSON.stringify(merged);
      // Double check size under Firestore 1MB limit (safe threshold: 850KB)
      if (serialized.length > 850000 && merged.logoUrl) {
        try {
          merged.logoUrl = await compressDataUrl(merged.logoUrl, { 
            maxWidth: 320, 
            maxHeight: 320, 
            quality: 0.65, 
            maxSizeBytes: 35 * 1024 
          });
          serialized = JSON.stringify(merged);
        } catch {}
      }

      await setDoc(doc(db, 'content', 'settings'), {
        sectionKey: 'settings',
        data: serialized,
        updatedAt: new Date().toISOString()
      });
      setSettings(merged);
      return true;
    } catch (err) {
      console.error("Failed to update settings:", err);
      return false;
    }
  };

  const updateAbout = async (newAbout: AboutContent): Promise<boolean> => {
    try {
      const cleaned: AboutContent = { ...newAbout };

      // Compress primary doctor photo if it is a large data URL
      if (cleaned.doctorPhotoUrl && cleaned.doctorPhotoUrl.startsWith('data:image/') && cleaned.doctorPhotoUrl.length > 80000) {
        try {
          cleaned.doctorPhotoUrl = await compressDataUrl(cleaned.doctorPhotoUrl, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.8,
            maxSizeBytes: 90 * 1024
          });
        } catch (e) {
          console.warn("Could not compress doctorPhotoUrl:", e);
        }
      }

      // Compress and sanitize doctor gallery photos (keep max 8 photos to stay well under 1MB)
      if (cleaned.doctorPhotos && cleaned.doctorPhotos.length > 0) {
        const sliced = cleaned.doctorPhotos.slice(0, 8);
        cleaned.doctorPhotos = await Promise.all(
          sliced.map(async (photo) => {
            if (photo.startsWith('data:image/') && photo.length > 80000) {
              try {
                return await compressDataUrl(photo, {
                  maxWidth: 800,
                  maxHeight: 800,
                  quality: 0.75,
                  maxSizeBytes: 80 * 1024
                });
              } catch {
                return photo;
              }
            }
            return photo;
          })
        );
      }

      await setDoc(doc(db, 'content', 'about'), {
        sectionKey: 'about',
        data: JSON.stringify(cleaned),
        updatedAt: new Date().toISOString()
      });
      setAbout(cleaned);
      return true;
    } catch (err) {
      console.error("Failed to update about:", err);
      return false;
    }
  };

  const updateFaqs = async (newFaqs: FaqItem[]): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'content', 'faq'), {
        sectionKey: 'faq',
        data: JSON.stringify(newFaqs),
        updatedAt: new Date().toISOString()
      });
      setFaqs(newFaqs);
      return true;
    } catch (err) {
      console.error("Failed to update faqs:", err);
      return false;
    }
  };

  const updateHighlights = async (newHighlights: HighlightItem[]): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'content', 'highlights'), {
        sectionKey: 'highlights',
        data: JSON.stringify(newHighlights),
        updatedAt: new Date().toISOString()
      });
      setHighlights(newHighlights);
      return true;
    } catch (err) {
      console.error("Failed to update highlights:", err);
      return false;
    }
  };

  const updateServices = async (newServices: DentalService[]): Promise<boolean> => {
    try {
      const cleaned = await Promise.all(
        newServices.map(async (s) => {
          if (s.imageUrl && s.imageUrl.startsWith('data:image/') && s.imageUrl.length > 80000) {
            try {
              const compressed = await compressDataUrl(s.imageUrl, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.75,
                maxSizeBytes: 70 * 1024
              });
              return { ...s, imageUrl: compressed };
            } catch {
              return s;
            }
          }
          return s;
        })
      );

      await setDoc(doc(db, 'content', 'services'), {
        sectionKey: 'services',
        data: JSON.stringify(cleaned),
        updatedAt: new Date().toISOString()
      });
      setServices(cleaned);
      return true;
    } catch (err) {
      console.error("Failed to update services:", err);
      return false;
    }
  };

  const updateGallery = async (newGallery: ClinicPhoto[]): Promise<boolean> => {
    try {
      const cleaned = await Promise.all(
        newGallery.map(async (p) => {
          if (p.url && p.url.startsWith('data:image/') && p.url.length > 90000) {
            try {
              const compressed = await compressDataUrl(p.url, {
                maxWidth: 1000,
                maxHeight: 1000,
                quality: 0.75,
                maxSizeBytes: 90 * 1024
              });
              return { ...p, url: compressed };
            } catch {
              return p;
            }
          }
          return p;
        })
      );

      await setDoc(doc(db, 'content', 'gallery'), {
        sectionKey: 'gallery',
        data: JSON.stringify(cleaned),
        updatedAt: new Date().toISOString()
      });
      setGallery(cleaned);
      return true;
    } catch (err) {
      console.error("Failed to update gallery:", err);
      return false;
    }
  };

  const addBooking = async (data: Omit<Booking, 'id' | 'createdAt' | 'seenByStaff' | 'status' | 'paymentStatus'>) => {
    try {
      const newBooking = {
        ...data,
        status: 'New' as const,
        paymentStatus: 'Unpaid' as const,
        seenByStaff: false,
        createdAt: new Date().toISOString()
      };
      const res = await addDoc(collection(db, 'bookings'), newBooking);

      // Check if patient exists or add to patients collection automatically
      const cleanPhone = data.phone.trim().replace(/\D/g, '').slice(-10);
      const existingPat = patients.find(p => p.phone.replace(/\D/g, '').slice(-10) === cleanPhone);
      if (!existingPat) {
        await addDoc(collection(db, 'patients'), {
          name: data.patientName,
          phone: data.phone,
          age: 30, // default if not specified
          gender: 'Other',
          address: 'Self-registered via Website',
          notes: `First appointment booked for ${data.service}`,
          totalVisits: 1,
          lastVisit: data.date,
          createdAt: new Date().toISOString()
        });
      }

      return { success: true, id: res.id };
    } catch (err) {
      console.error("Failed to add booking:", err);
      return { success: false };
    }
  };

  const markBookingSeen = async (id: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), {
        seenByStaff: true
      });
      return true;
    } catch (err) {
      console.error("Mark booking seen error:", err);
      return false;
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status'], paymentStatus?: Booking['paymentStatus']) => {
    try {
      const updates: Partial<Booking> = { status, seenByStaff: true };
      if (paymentStatus) {
        updates.paymentStatus = paymentStatus;
      }
      await updateDoc(doc(db, 'bookings', id), updates);
      return true;
    } catch (err) {
      console.error("Update booking status error:", err);
      return false;
    }
  };

  const updateBookingDetails = async (id: string, updates: Partial<Booking>) => {
    try {
      await updateDoc(doc(db, 'bookings', id), updates);
      return true;
    } catch (err) {
      console.error("Update booking details error:", err);
      return false;
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      setBookings(prev => prev.filter(b => b.id !== id));
      await deleteDoc(doc(db, 'bookings', id));
      return true;
    } catch (err) {
      console.error("Delete booking error:", err);
      return false;
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'inventory'), {
        ...item,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Add inventory item error:", err);
      return false;
    }
  };

  const updateInventoryQuantity = async (id: string, newQty: number) => {
    try {
      setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, newQty), updatedAt: new Date().toISOString() } : i));
      await updateDoc(doc(db, 'inventory', id), {
        quantity: Math.max(0, newQty),
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Update inventory quantity error:", err);
      return false;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      setInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i));
      await updateDoc(doc(db, 'inventory', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Update inventory error:", err);
      return false;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      setInventory(prev => prev.filter(i => i.id !== id));
      await deleteDoc(doc(db, 'inventory', id));
      return true;
    } catch (err) {
      console.error("Delete inventory error:", err);
      return false;
    }
  };

  const addPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'totalVisits'>) => {
    try {
      const docRef = await addDoc(collection(db, 'patients'), {
        ...patient,
        totalVisits: 1,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error("Add patient error:", err);
      return { success: false };
    }
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    try {
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      await updateDoc(doc(db, 'patients', id), updates);
      return true;
    } catch (err) {
      console.error("Update patient error:", err);
      return false;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      setPatients(prev => prev.filter(p => p.id !== id));
      await deleteDoc(doc(db, 'patients', id));
      return true;
    } catch (err) {
      console.error("Delete patient error:", err);
      return false;
    }
  };

  const addPrescription = async (presc: Omit<Prescription, 'id' | 'createdAt'>) => {
    try {
      // 1. Extract patient details
      const cleanPhone = presc.patientPhone ? presc.patientPhone.trim().replace(/\D/g, '').slice(-10) : '';
      const trimmedName = presc.patientName ? presc.patientName.trim() : '';
      let patientId = presc.patientId || '';

      // Check if patient already exists in the Patient Directory (by patientId, by phone, or by name)
      const pat = presc.patientId 
        ? patients.find(p => p.id === presc.patientId)
        : (cleanPhone && cleanPhone.length === 10)
          ? patients.find(p => p.phone && p.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
          : patients.find(p => p.name && p.name.trim().toLowerCase() === trimmedName.toLowerCase());

      const noteText = presc.visitNotes 
        ? `[${presc.date || new Date().toISOString().slice(0, 10)}] ${presc.visitNotes.trim()}`
        : `${presc.serviceTaken || 'Prescription issued'} on ${presc.date || new Date().toISOString().slice(0, 10)}`;

      if (pat && pat.id) {
        // Patient exists: update their visit count, last visit date, and clinical notes
        patientId = pat.id;
        const combinedNotes = pat.notes ? `${pat.notes}\n• ${noteText}` : `• ${noteText}`;
        const updatedFields: Partial<Patient> = {
          totalVisits: (pat.totalVisits || 1) + 1,
          lastVisit: presc.date || new Date().toISOString().slice(0, 10),
          notes: combinedNotes,
          ...(cleanPhone && (!pat.phone || pat.phone === 'N/A') ? { phone: cleanPhone } : {}),
          ...(presc.age ? { age: presc.age } : {}),
          ...(presc.gender && presc.gender !== 'Other' ? { gender: presc.gender } : {})
        };
        setPatients(prev => prev.map(p => p.id === pat.id ? { ...p, ...updatedFields } : p));
        try {
          await updateDoc(doc(db, 'patients', pat.id), updatedFields);
        } catch (e) {
          console.warn("Could not sync patient update to Firestore:", e);
        }
      } else if (trimmedName) {
        // Patient does NOT exist yet: AUTOMATICALLY create new entry in Patients Directory
        const fallbackId = `pat-${Date.now()}`;
        const newPatientData: Patient = {
          id: fallbackId,
          name: trimmedName,
          phone: cleanPhone || 'N/A',
          age: presc.age || 30,
          gender: presc.gender || 'Other',
          address: presc.address || 'Clinic Prescription Patient',
          notes: `• ${noteText}`,
          totalVisits: 1,
          lastVisit: presc.date || new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString()
        };
        try {
          const newPatDoc = await addDoc(collection(db, 'patients'), {
            name: newPatientData.name,
            phone: newPatientData.phone,
            age: newPatientData.age,
            gender: newPatientData.gender,
            address: newPatientData.address,
            notes: newPatientData.notes,
            totalVisits: newPatientData.totalVisits,
            lastVisit: newPatientData.lastVisit,
            createdAt: newPatientData.createdAt
          });
          newPatientData.id = newPatDoc.id;
          patientId = newPatDoc.id;
        } catch (e) {
          console.warn("Could not auto-create patient in firestore, saved in local state:", e);
          patientId = fallbackId;
        }
        setPatients(prev => [newPatientData, ...prev.filter(p => p.id !== newPatientData.id)]);
      }

      // 2. Save the prescription document with linked patientId
      const tempRxId = `rx-${Date.now()}`;
      const newPresc: Prescription = {
        ...presc,
        id: tempRxId,
        patientId: patientId || undefined,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await addDoc(collection(db, 'prescriptions'), {
          ...presc,
          patientId: patientId || undefined,
          createdAt: new Date().toISOString()
        });
        newPresc.id = res.id;
      } catch (err) {
        console.warn("Could not save prescription to firestore, saved locally:", err);
      }

      setPrescriptions(prev => [newPresc, ...prev.filter(p => p.id !== newPresc.id)]);
      return { success: true, id: newPresc.id };
    } catch (err) {
      console.error("Add prescription error:", err);
      return { success: false };
    }
  };

  const updatePrescription = async (id: string, updates: Partial<Prescription>) => {
    try {
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      try {
        await updateDoc(doc(db, 'prescriptions', id), updates);
      } catch (e) {
        console.warn("Could not update prescription doc:", e);
      }

      // If patient information updated, sync with Patients Directory
      if (updates.patientName || updates.patientPhone) {
        const cleanPhone = updates.patientPhone ? updates.patientPhone.trim().replace(/\D/g, '').slice(-10) : '';
        const trimmedName = updates.patientName ? updates.patientName.trim() : '';

        const pat = updates.patientId 
          ? patients.find(p => p.id === updates.patientId)
          : (cleanPhone && cleanPhone.length === 10)
            ? patients.find(p => p.phone && p.phone.replace(/\D/g, '').slice(-10) === cleanPhone)
            : patients.find(p => p.name && p.name.trim().toLowerCase() === trimmedName.toLowerCase());

        if (pat && pat.id) {
          const syncUpdates: Partial<Patient> = {
            ...(trimmedName ? { name: trimmedName } : {}),
            ...(cleanPhone ? { phone: cleanPhone } : {}),
            ...(updates.age ? { age: updates.age } : {}),
            ...(updates.gender && updates.gender !== 'Other' ? { gender: updates.gender } : {}),
            lastVisit: updates.date || new Date().toISOString().slice(0, 10)
          };
          setPatients(prev => prev.map(p => p.id === pat.id ? { ...p, ...syncUpdates } : p));
          try {
            await updateDoc(doc(db, 'patients', pat.id), syncUpdates);
          } catch (e) {
            console.warn("Could not sync update to firestore:", e);
          }
        } else if (trimmedName) {
          const fallbackId = `pat-${Date.now()}`;
          const newPatientData: Patient = {
            id: fallbackId,
            name: trimmedName,
            phone: cleanPhone || 'N/A',
            age: updates.age || 30,
            gender: updates.gender || 'Other',
            address: updates.address || 'Clinic Prescription Patient',
            notes: updates.visitNotes ? `• ${updates.visitNotes.trim()}` : `Prescription updated on ${updates.date || new Date().toISOString().slice(0, 10)}`,
            totalVisits: 1,
            lastVisit: updates.date || new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString()
          };
          try {
            const newPatDoc = await addDoc(collection(db, 'patients'), {
              name: newPatientData.name,
              phone: newPatientData.phone,
              age: newPatientData.age,
              gender: newPatientData.gender,
              address: newPatientData.address,
              notes: newPatientData.notes,
              totalVisits: newPatientData.totalVisits,
              lastVisit: newPatientData.lastVisit,
              createdAt: newPatientData.createdAt
            });
            newPatientData.id = newPatDoc.id;
          } catch (e) {
            console.warn("Could not save new patient to firestore:", e);
          }
          setPatients(prev => [newPatientData, ...prev.filter(p => p.id !== newPatientData.id)]);
        }
      }

      return true;
    } catch (err) {
      console.error("Update prescription error:", err);
      return false;
    }
  };

  const updatePrescriptionResult = async (id: string, resultUpdate: string) => {
    try {
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, resultUpdate } : p));
      await updateDoc(doc(db, 'prescriptions', id), {
        resultUpdate
      });
      return true;
    } catch (err) {
      console.error("Update prescription result error:", err);
      return false;
    }
  };

  const deletePrescription = async (id: string) => {
    try {
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      await deleteDoc(doc(db, 'prescriptions', id));
      return true;
    } catch (err) {
      console.error("Delete prescription error:", err);
      return false;
    }
  };

  const addReview = async (review: Omit<Review, 'id' | 'date'>) => {
    try {
      const sig = `${(review.name || '').trim().toLowerCase()}:::${(review.reviewText || '').trim().toLowerCase()}`;
      
      // 1. Prevent rapid submission double-calls in memory
      if (recentReviewSubmissionsRef.current.has(sig)) {
        return true;
      }
      recentReviewSubmissionsRef.current.add(sig);
      setTimeout(() => recentReviewSubmissionsRef.current.delete(sig), 60000);

      // 2. Check if identical review already exists in current state
      const isDuplicate = reviews.some(r => 
        (r.name || '').trim().toLowerCase() === (review.name || '').trim().toLowerCase() &&
        (r.reviewText || '').trim().toLowerCase() === (review.reviewText || '').trim().toLowerCase()
      );
      if (isDuplicate) {
        return true;
      }

      // 3. Create deterministic document ID from name and text hash
      const cleanName = (review.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      const cleanText = (review.reviewText || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      const docId = `rev_${cleanName}_${cleanText}`;

      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await setDoc(doc(db, 'reviews', docId), {
        ...review,
        date,
        isApproved: true,
        createdAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Add review error:", err);
      return false;
    }
  };

  const deleteReview = async (id: string) => {
    try {
      setReviews(prev => prev.filter(r => r.id !== id));
      await deleteDoc(doc(db, 'reviews', id));
      return true;
    } catch (err) {
      console.error("Delete review error:", err);
      return false;
    }
  };

  const toggleReviewApproval = async (id: string, isApproved: boolean) => {
    try {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved } : r));
      await updateDoc(doc(db, 'reviews', id), { isApproved });
      return true;
    } catch (err) {
      console.error("Toggle review approval error:", err);
      return false;
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const createdAt = new Date().toISOString();
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt
      });
      return true;
    } catch (err) {
      console.error("Add expense error:", err);
      return false;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      await updateDoc(doc(db, 'expenses', id), updates);
      return true;
    } catch (err) {
      console.error("Update expense error:", err);
      return false;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setExpenses(prev => prev.filter(e => e.id !== id));
      await deleteDoc(doc(db, 'expenses', id));
      return true;
    } catch (err) {
      console.error("Delete expense error:", err);
      return false;
    }
  };

  const addIncome = async (inc: Omit<Income, 'id' | 'createdAt'>) => {
    try {
      const createdAt = new Date().toISOString();
      await addDoc(collection(db, 'income'), {
        ...inc,
        createdAt
      });
      return true;
    } catch (err) {
      console.error("Add income error:", err);
      return false;
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      setIncome(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      await updateDoc(doc(db, 'income', id), updates);
      return true;
    } catch (err) {
      console.error("Update income error:", err);
      return false;
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      setIncome(prev => prev.filter(i => i.id !== id));
      await deleteDoc(doc(db, 'income', id));
      return true;
    } catch (err) {
      console.error("Delete income error:", err);
      return false;
    }
  };

  const addStaffMember = async (staff: Omit<AllowedStaff, 'id' | 'addedAt'>) => {
    try {
      const addedAt = new Date().toISOString();
      await addDoc(collection(db, 'allowed_staff'), {
        ...staff,
        active: staff.active !== false,
        addedAt
      });
      return true;
    } catch (err) {
      console.error("Add staff member error:", err);
      return false;
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<AllowedStaff>) => {
    try {
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      await updateDoc(doc(db, 'allowed_staff', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Update staff member error:", err);
      return false;
    }
  };

  const removeStaffMember = async (id: string) => {
    try {
      setStaffList(prev => prev.filter(s => s.id !== id));
      await deleteDoc(doc(db, 'allowed_staff', id));
      return true;
    } catch (err) {
      console.error("Remove staff error:", err);
      return false;
    }
  };

  const sendPatientReminder = (booking: Booking) => {
    const text = encodeURIComponent(
      `🦷 *Appointment Reminder - ${settings.clinicName}*\n\n` +
      `Dear ${booking.patientName},\n` +
      `This is a gentle reminder for your dental appointment for *${booking.service}*.\n\n` +
      `📅 *Date:* ${booking.date}\n` +
      `⏰ *Time Slot:* ${booking.timeSlot}\n` +
      `📍 *Location:* ${settings.address}\n\n` +
      `Please arrive 10 minutes before your slot. Fee: ₹ ${booking.fee} (Pay at clinic - Cash).\n` +
      `For queries, call ${settings.phone}. See you soon!`
    );
    const cleanPhone = booking.phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${cleanPhone}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ================= PATIENT REPORTS & BILLING MUTATORS =================

  const addAuditLog = async (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        ...entry,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Audit log error:", err);
    }
  };

  const deleteAuditLog = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'audit_logs', id));
      return true;
    } catch (err) {
      console.error("Failed to delete audit log:", err);
      return false;
    }
  };

  const clearPatientAuditLogs = async (patientId: string): Promise<boolean> => {
    try {
      const logsToDelete = auditLogs.filter(a => a.patientId === patientId && a.id);
      await Promise.all(logsToDelete.map(l => deleteDoc(doc(db, 'audit_logs', l.id!))));
      return true;
    } catch (err) {
      console.error("Failed to clear patient audit logs:", err);
      return false;
    }
  };

  const addDocument = async (docData: Omit<PatientDocument, 'id' | 'createdAt'>) => {
    try {
      const docRef = doc(collection(db, 'documents'));
      
      // Check and store large files with chunking if needed
      const chunkRes = await storeDocumentFileChunks(docRef.id, docData.fileUrl || '');

      const newDoc: PatientDocument = sanitizeForFirestore({
        id: docRef.id,
        patientId: docData.patientId || '',
        patientName: docData.patientName || '',
        patientPhone: docData.patientPhone || '',
        category: docData.category,
        title: docData.title || 'Untitled Document',
        description: docData.description || '',
        documentDate: docData.documentDate || new Date().toISOString().slice(0, 10),
        fileUrl: chunkRes.primaryFileUrl,
        fileName: docData.fileName || 'file',
        fileType: docData.fileType || 'application/octet-stream',
        fileSize: docData.fileSize || 0,
        uploaderName: docData.uploaderName || 'Staff',
        uploaderRole: docData.uploaderRole || 'staff',
        isPublished: docData.isPublished !== undefined ? docData.isPublished : true,
        isChunked: chunkRes.isChunked,
        chunksCount: chunkRes.chunksCount,
        createdAt: new Date().toISOString()
      });

      await setDoc(docRef, newDoc);

      await addAuditLog({
        patientId: docData.patientId || '',
        patientName: docData.patientName || '',
        action: 'DOCUMENT_UPLOADED',
        details: `Uploaded ${docData.category}: "${docData.title}" (${docData.fileName})`,
        performedBy: docData.uploaderName || 'Staff',
        performedByRole: docData.uploaderRole || 'staff'
      });

      return { success: true, id: docRef.id };
    } catch (err) {
      console.error("Add document error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return { success: false, error: errMsg };
    }
  };

  const updateDocument = async (
    id: string, 
    updates: Partial<PatientDocument>, 
    auditDetails?: string, 
    performedBy: string = 'Staff', 
    performedByRole: string = 'staff'
  ) => {
    try {
      const existing = documents.find(d => d.id === id);
      await updateDoc(doc(db, 'documents', id), sanitizeForFirestore({
        ...updates,
        updatedAt: new Date().toISOString()
      }));

      if (existing) {
        await addAuditLog({
          patientId: existing.patientId || '',
          patientName: existing.patientName || '',
          action: 'DOCUMENT_METADATA_UPDATED',
          details: auditDetails || `Updated metadata for "${existing.title}" (${existing.category})`,
          performedBy: performedBy || 'Staff',
          performedByRole: (performedByRole as any) || 'staff'
        });
      }
      return true;
    } catch (err) {
      console.error("Update document error:", err);
      return false;
    }
  };

  const replaceDocumentFile = async (
    id: string, 
    newFile: { fileUrl: string; fileName: string; fileType: string; fileSize: number }, 
    uploader: string, 
    uploaderRole: 'staff' | 'admin'
  ) => {
    try {
      const existing = documents.find(d => d.id === id);
      if (!existing) return false;

      // Handle large file chunking
      const chunkRes = await storeDocumentFileChunks(id, newFile.fileUrl || '');

      await updateDoc(doc(db, 'documents', id), sanitizeForFirestore({
        ...newFile,
        fileUrl: chunkRes.primaryFileUrl,
        isChunked: chunkRes.isChunked,
        chunksCount: chunkRes.chunksCount,
        uploaderName: uploader || 'Staff',
        uploaderRole: uploaderRole || 'staff',
        updatedAt: new Date().toISOString()
      }));

      await addAuditLog({
        patientId: existing.patientId || '',
        patientName: existing.patientName || '',
        action: 'DOCUMENT_REPLACED',
        details: `Replaced file for "${existing.title}" with new file "${newFile.fileName}" (${(newFile.fileSize / 1024).toFixed(1)} KB)`,
        performedBy: uploader || 'Staff',
        performedByRole: uploaderRole || 'staff'
      });

      return true;
    } catch (err) {
      console.error("Replace document error:", err);
      return false;
    }
  };

  const deleteDocument = async (id: string, patientId: string, performedBy: string, performedByRole: string) => {
    try {
      const existing = documents.find(d => d.id === id);
      await deleteDoc(doc(db, 'documents', id));

      await addAuditLog({
        patientId,
        patientName: existing?.patientName || 'Patient',
        action: 'DOCUMENT_DELETED',
        details: `Removed document "${existing?.title || id}" (${existing?.category || 'General'})`,
        performedBy,
        performedByRole
      });
      return true;
    } catch (err) {
      console.error("Delete document error:", err);
      return false;
    }
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'amountPaid' | 'outstandingBalance' | 'paymentStatus' | 'invoiceNumber'> & { invoiceNumber?: string }) => {
    try {
      const finalAmount = Math.max(0, Number(invoiceData.totalCharges || 0) - Number(invoiceData.discount || 0));
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invNumber = invoiceData.invoiceNumber || `INV-${year}-${invoices.length + 101}-${randomSuffix.toString().slice(0, 2)}`;
      
      const newInvoice: Omit<Invoice, 'id'> = {
        ...invoiceData,
        invoiceNumber: invNumber,
        totalCharges: Number(invoiceData.totalCharges || 0),
        discount: Number(invoiceData.discount || 0),
        finalAmount,
        amountPaid: 0,
        outstandingBalance: finalAmount,
        paymentStatus: 'Unpaid',
        createdAt: new Date().toISOString()
      };

      const res = await addDoc(collection(db, 'invoices'), newInvoice);

      await addAuditLog({
        patientId: invoiceData.patientId,
        patientName: invoiceData.patientName,
        action: 'INVOICE_CREATED',
        details: `Generated Invoice #${invNumber} for ₹ ${finalAmount} (${invoiceData.treatmentDescription})`,
        performedBy: invoiceData.createdBy || 'Staff',
        performedByRole: 'staff'
      });

      return { success: true, id: res.id, invoiceNumber: invNumber };
    } catch (err) {
      console.error("Add invoice error:", err);
      return { success: false, invoiceNumber: '' };
    }
  };

  const updateInvoice = async (
    id: string, 
    updates: Partial<Invoice>, 
    auditDetails?: string, 
    performedBy: string = 'Admin', 
    performedByRole: string = 'admin'
  ) => {
    try {
      const existing = invoices.find(inv => inv.id === id);
      if (!existing) return false;
      
      const newTotal = updates.totalCharges !== undefined ? Number(updates.totalCharges) : existing.totalCharges;
      const newDiscount = updates.discount !== undefined ? Number(updates.discount) : (existing.discount || 0);
      const finalAmount = Math.max(0, newTotal - newDiscount);
      const amountPaid = updates.amountPaid !== undefined ? Number(updates.amountPaid) : existing.amountPaid;
      const outstandingBalance = Math.max(0, finalAmount - amountPaid);
      const paymentStatus: Invoice['paymentStatus'] = outstandingBalance <= 0 ? 'Paid' : (amountPaid > 0 ? 'Partially Paid' : 'Unpaid');

      const merged = {
        ...updates,
        totalCharges: newTotal,
        discount: newDiscount,
        finalAmount,
        amountPaid,
        outstandingBalance,
        paymentStatus,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'invoices', id), merged);

      await addAuditLog({
        patientId: existing.patientId,
        patientName: existing.patientName,
        action: 'INVOICE_UPDATED',
        details: auditDetails || `Corrected Invoice #${existing.invoiceNumber} charges: Total ₹ ${newTotal}, Discount ₹ ${newDiscount}, Final ₹ ${finalAmount}`,
        performedBy,
        performedByRole
      });

      return true;
    } catch (err) {
      console.error("Update invoice error:", err);
      return false;
    }
  };

  const deleteInvoice = async (id: string, patientId: string, performedBy: string, performedByRole: string) => {
    try {
      const existing = invoices.find(inv => inv.id === id);
      await deleteDoc(doc(db, 'invoices', id));

      await addAuditLog({
        patientId,
        patientName: existing?.patientName || 'Patient',
        action: 'INVOICE_VOIDED',
        details: `Voided & removed Invoice #${existing?.invoiceNumber} (₹ ${existing?.finalAmount})`,
        performedBy,
        performedByRole
      });
      return true;
    } catch (err) {
      console.error("Delete invoice error:", err);
      return false;
    }
  };

  const addPayment = async (paymentData: Omit<PatientPayment, 'id' | 'createdAt'>) => {
    try {
      const amount = Number(paymentData.amount || 0);
      if (amount <= 0) return { success: false };

      const newPayment: Omit<PatientPayment, 'id'> = {
        ...paymentData,
        amount,
        createdAt: new Date().toISOString()
      };

      const res = await addDoc(collection(db, 'patient_payments'), newPayment);

      // Update target invoice's balance
      const targetInvoice = invoices.find(inv => inv.id === paymentData.invoiceId || inv.invoiceNumber === paymentData.invoiceNumber);
      if (targetInvoice && targetInvoice.id) {
        const newAmountPaid = (targetInvoice.amountPaid || 0) + amount;
        const newOutstanding = Math.max(0, targetInvoice.finalAmount - newAmountPaid);
        const newStatus: Invoice['paymentStatus'] = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';

        await updateDoc(doc(db, 'invoices', targetInvoice.id), {
          amountPaid: newAmountPaid,
          outstandingBalance: newOutstanding,
          paymentStatus: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      // Automatically sync into clinic income register
      await addIncome({
        source: `${paymentData.patientName} (Inv #${paymentData.invoiceNumber})`,
        service: targetInvoice?.treatmentDescription || 'Dental Treatment Payment',
        amount,
        date: paymentData.paymentDate || new Date().toISOString().slice(0, 10),
        paymentMode: paymentData.paymentMethod === 'Cash' ? 'Cash' : (paymentData.paymentMethod === 'Card' ? 'Card' : 'UPI'),
        notes: `Ref: ${paymentData.referenceNumber || 'Counter'} - Recorded by ${paymentData.recordedBy} (${paymentData.recordedByRole})`
      });

      // Record Audit Log
      await addAuditLog({
        patientId: paymentData.patientId,
        patientName: paymentData.patientName,
        action: 'PAYMENT_RECORDED',
        details: `Recorded payment of ₹ ${amount} via ${paymentData.paymentMethod} (Ref: ${paymentData.referenceNumber || 'N/A'}) for Inv #${paymentData.invoiceNumber}`,
        performedBy: paymentData.recordedBy,
        performedByRole: paymentData.recordedByRole
      });

      return { success: true, id: res.id };
    } catch (err) {
      console.error("Add payment error:", err);
      return { success: false };
    }
  };

  const recordRefundOrCorrection = async (
    paymentId: string, 
    reason: string, 
    performedBy: string, 
    performedByRole: 'staff' | 'admin'
  ) => {
    try {
      const existingPayment = patientPayments.find(p => p.id === paymentId);
      if (!existingPayment) return false;

      // Create a traceable refund transaction entry
      const refundEntry: Omit<PatientPayment, 'id'> = {
        invoiceId: existingPayment.invoiceId,
        invoiceNumber: existingPayment.invoiceNumber,
        patientId: existingPayment.patientId,
        patientName: existingPayment.patientName,
        amount: -existingPayment.amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: existingPayment.paymentMethod,
        referenceNumber: `REFUND-${existingPayment.referenceNumber || Date.now().toString().slice(-6)}`,
        recordedBy: performedBy,
        recordedByRole: performedByRole,
        notes: `Refund/Correction: ${reason}`,
        isRefund: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'patient_payments'), refundEntry);

      // Update target invoice's balance
      const targetInvoice = invoices.find(inv => inv.id === existingPayment.invoiceId || inv.invoiceNumber === existingPayment.invoiceNumber);
      if (targetInvoice && targetInvoice.id) {
        const newAmountPaid = Math.max(0, (targetInvoice.amountPaid || 0) - existingPayment.amount);
        const newOutstanding = Math.max(0, targetInvoice.finalAmount - newAmountPaid);
        const newStatus: Invoice['paymentStatus'] = newOutstanding <= 0 ? 'Paid' : (newAmountPaid > 0 ? 'Partially Paid' : 'Unpaid');

        await updateDoc(doc(db, 'invoices', targetInvoice.id), {
          amountPaid: newAmountPaid,
          outstandingBalance: newOutstanding,
          paymentStatus: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      // Add Audit Log
      await addAuditLog({
        patientId: existingPayment.patientId,
        patientName: existingPayment.patientName,
        action: 'REFUND_RECORDED',
        details: `Refunded ₹ ${existingPayment.amount} on Inv #${existingPayment.invoiceNumber}. Reason: ${reason}`,
        performedBy,
        performedByRole
      });

      return true;
    } catch (err) {
      console.error("Record refund error:", err);
      return false;
    }
  };

  return (
    <ClinicContext.Provider
      value={{
        settings,
        about,
        faqs,
        highlights,
        services,
        gallery,
        bookings,
        newBookingsCount,
        inventory,
        patients,
        prescriptions,
        reviews,
        expenses,
        income,
        staffList,
        documents,
        invoices,
        patientPayments,
        auditLogs,
        isLoading,
        activePatientId,
        setActivePatientId,

        updateSettings,
        updateAbout,
        updateFaqs,
        updateHighlights,
        updateServices,
        updateGallery,

        addBooking,
        markBookingSeen,
        updateBookingStatus,
        updateBookingDetails,
        deleteBooking,

        addInventoryItem,
        updateInventoryQuantity,
        updateInventoryItem,
        deleteInventoryItem,

        addPatient,
        updatePatient,
        deletePatient,

        addPrescription,
        updatePrescription,
        updatePrescriptionResult,
        deletePrescription,

        addReview,
        deleteReview,
        toggleReviewApproval,

        addExpense,
        updateExpense,
        deleteExpense,

        addIncome,
        updateIncome,
        deleteIncome,

        addStaffMember,
        updateStaffMember,
        removeStaffMember,

        sendPatientReminder,

        addDocument,
        updateDocument,
        replaceDocumentFile,
        deleteDocument,

        addInvoice,
        updateInvoice,
        deleteInvoice,

        addPayment,
        recordRefundOrCorrection,
        addAuditLog,
        deleteAuditLog,
        clearPatientAuditLogs,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
