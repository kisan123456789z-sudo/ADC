import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc,
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  AboutContent, 
  FaqItem, 
  HighlightItem, 
  ClinicSettings, 
  DentalService, 
  ClinicPhoto 
} from '../types/clinic';

export const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName: "AnuJay Dental Clinic",
  tagline: "Excellence in Modern Painless Dentistry",
  logoUrl: "", // Will use beautiful SVG tooth crest if empty
  phone: "+91 76928 08120",
  whatsappNumber: "917692808120",
  address: "Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026",
  googleMapUrl: "https://maps.app.goo.gl/z2c6moS2vPQ87f1V8",
  googleMapEmbedQuery: "AnuJay Dental Clinic, Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026",
  openingHours: "10:00 AM - 2:00 PM, 5:00 PM - 9:00 PM (Monday to Saturday)",
  emergencyPhone: "+91 98765 43211",
  consultationFee: 300,
  doctorName: "Dr. Anujay Sharma",
  doctorDegree: "B.D.S., M.D.S. (Orthodontics & Implantology)",
  doctorSpecialization: "Chief Dental Surgeon & Implantologist",
  doctorRegNo: "DC-58921 / DCI",
  experienceYears: "12+ Years",
  email: "anujaydentalclinic@gmail.com",
  cityState: "Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026",
  freeSundayTimings: "Every Sunday 10:00 AM - 2:00 PM",
  announcementBanner: "🌟 Free Oral Health Checkup & Consultation Every Sunday 10 AM - 2 PM! Book online or call now.",
  isBannerActive: true,
  heroBadge: "Multi-Specialty Dental & Oral Implant Center",
  heroTitle: "Painless Dental Care For Your Family's Healthiest Smile",
  heroSubtitle: "Experience gentle, stress-free dentistry with modern German digital diagnostics, computerized anesthesia, and single-sitting root canals under chief specialist Dr. Anujay Sharma.",
  heroUsp1: "100% Painless Protocol",
  heroUsp2: "Free Sunday Checkup",
  heroUsp3: "Pay at Clinic (Cash)",
  instagramUrl: "https://instagram.com/anujaydentalclinic",
  facebookUrl: "https://facebook.com/anujaydentalclinic"
};

export const DOCTOR_PHOTO_PRESETS = [
  {
    id: 'preset-doc-1',
    name: 'Male Dentist In Coat (Clinical)',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-doc-2',
    name: 'Doctor with Stethoscope / Friendly Smile',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-doc-3',
    name: 'Senior Dental Surgeon in Modern Clinic',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-doc-4',
    name: 'Doctor Consulting Patient in Operatory',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
  }
];

export const DEFAULT_ABOUT: AboutContent = {
  title: "About Anujay Dental Clinic",
  subtitle: "World-Class Dental Care with a Gentle Touch",
  description: "Anujay Dental Clinic is a premier multi-specialty dental centre dedicated to delivering painless, ethical, and modern dental treatments. Equipped with cutting-edge German digital imaging, ultrasonic scalers, and Class-B autoclave sterilization, we ensure maximum patient comfort and safety.",
  doctorName: "Dr. Anujay Sharma",
  doctorDegree: "B.D.S., M.D.S. (Orthodontics & Oral Implantology)",
  doctorSpecialization: "Chief Dental Surgeon & Implantologist",
  doctorRegNo: "DC-58921 / DCI",
  experienceYears: "12+ Years",
  happyPatients: "15,000+",
  clinicPhilosophy: "We believe in preserving natural teeth with painless precision and transparent patient education. Every patient is treated like family with customized care plans.",
  doctorPhotoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80",
  doctorPhotos: [
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80"
  ],
  showDoctorSection: true
};

export const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "Is Root Canal Treatment (RCT) painful at Anujay Dental Clinic?",
    answer: "Not at all! We use modern computer-assisted local anesthesia and rotary endodontics, making the entire root canal procedure virtually painless and completed in just 1 or 2 quick sittings."
  },
  {
    id: "faq-2",
    question: "What are the clinic timings and do you take walk-ins?",
    answer: "We are open Monday to Sunday from 9:00 AM to 8:00 PM. While walk-ins for dental emergencies are always welcomed, we strongly recommend booking an appointment online to avoid waiting."
  },
  {
    id: "faq-3",
    question: "Do you have Free Dental Checkups on Sundays?",
    answer: "Yes! Every Sunday between 10:00 AM and 2:00 PM, Dr. Anujay conducts free oral health screenings, digital camera assessments, and consultation for all patients."
  },
  {
    id: "faq-4",
    question: "What sterilization protocols are followed for safety?",
    answer: "We strictly follow international hospital-grade infection control standards. All instruments undergo 6-step sterilization including ultrasonic cleaning and vacuum Class-B Autoclaving in sealed individual pouches."
  },
  {
    id: "faq-5",
    question: "How much does teeth cleaning and polishing cost?",
    answer: "Ultrasonic scaling and polishing starts at ₹ 1,000. It effectively removes stubborn plaque, tobacco/tea stains, and protects against bleeding gums and bad breath."
  },
  {
    id: "faq-6",
    question: "What payment modes are accepted?",
    answer: "We follow a transparent 'Pay at Clinic - Cash' and UPI/Card mode at the counter. You only pay after your consultation or treatment is completed."
  }
];

export const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
  {
    id: "hl-1",
    title: "Free Dental Checkup Sunday",
    description: "Comprehensive oral checkup, digital X-Ray assessment, and personalized treatment advice every Sunday from 10 AM to 2 PM at zero cost.",
    badge: "Every Sunday",
    iconName: "Gift"
  },
  {
    id: "hl-2",
    title: "Advanced Digital Machines",
    description: "Equipped with RVG Digital Sensor (90% less radiation), Rotary Endodontic Motor, Apex Locator, and Ultrasonic Piezo Scaler for micro-precision.",
    badge: "Latest Tech",
    iconName: "Cpu"
  },
  {
    id: "hl-3",
    title: "Painless Anesthesia Protocol",
    description: "Specialized topical numbing gel applied prior to microscopic needle injection guarantees zero stinging sensation.",
    badge: "Comfort First",
    iconName: "HeartPulse"
  },
  {
    id: "hl-4",
    title: "100% Autoclaved & Sealed Pouches",
    description: "Every instrument is sealed in medical-grade color-changing indicator pouches and opened directly in front of the patient.",
    badge: "Hospital Grade",
    iconName: "ShieldCheck"
  }
];

export const DEFAULT_SERVICES: DentalService[] = [
  {
    id: "srv-1",
    name: "Single Sitting Root Canal (RCT)",
    price: "₹ 2,500 - ₹ 3,500",
    numericPrice: 2500,
    duration: "45 mins",
    description: "Microscope-assisted endodontics to save natural decayed teeth painlessly without extractions.",
    features: ["Digital Apex Locator", "Rotary NiTi Files", "Computerized Anesthesia", "Painless Technique"],
    icon: "ShieldAlert",
    videoUrl: "https://www.youtube.com/embed/jOxzF4f63c8",
    videoTitle: "Root Canal Treatment Procedure Animation"
  },
  {
    id: "srv-2",
    name: "Teeth Whitening & Laser Polishing",
    price: "₹ 1,500",
    numericPrice: 1500,
    duration: "30 mins",
    description: "Instant shade lightening by up to 5-8 shades using clinical grade LED light-activated gel.",
    features: ["Enamel Safe Formula", "Removes Smoke & Coffee Stains", "Long-lasting Shine", "Instant Results"],
    icon: "Sparkles",
    videoUrl: "https://www.youtube.com/embed/5a4GqT7qY4k",
    videoTitle: "Laser Teeth Whitening Explanation"
  },
  {
    id: "srv-3",
    name: "Dental Implants (Titanium / Zirconia)",
    price: "₹ 18,000",
    numericPrice: 1800,
    duration: "60 mins",
    description: "Permanent, bio-compatible tooth replacement that looks, feels, and chews exactly like real teeth.",
    features: ["German & Swiss Grade", "Lifetime Durability", "Flapless Guided Surgery", "Bone Preservation"],
    icon: "Anchor",
    videoUrl: "https://www.youtube.com/embed/sI_m_n4-q3g",
    videoTitle: "Dental Implant Placement 3D Guide"
  },
  {
    id: "srv-4",
    name: "Invisible Aligners & Braces",
    price: "₹ 25,000 - ₹ 65,000",
    numericPrice: 25000,
    duration: "Monthly Review",
    description: "Straighten crooked, crowded, or gapped teeth discreetly without metal wires or brackets.",
    features: ["Virtually Invisible", "Removable for Eating", "Custom 3D Digital Plan", "Comfortable"],
    icon: "Smile",
    videoUrl: "https://www.youtube.com/embed/x1QZ3J-pZtY",
    videoTitle: "Clear Aligners Step-by-Step Overview"
  },
  {
    id: "srv-5",
    name: "Ultrasonic Scaling & Deep Cleaning",
    price: "₹ 1,000",
    numericPrice: 1000,
    duration: "30 mins",
    description: "Gentle ultrasonic vibrations eliminate hardened calculus, yellow plaque, and bad breath.",
    features: ["No Enamel Damage", "Stops Bleeding Gums", "Subgingival Irrigation", "Air-Flow Polishing"],
    icon: "Activity",
    videoUrl: "https://www.youtube.com/embed/kF9sY9M64-A",
    videoTitle: "Ultrasonic Teeth Cleaning Mechanism"
  },
  {
    id: "srv-6",
    name: "Painless Tooth Extraction",
    price: "₹ 800 - ₹ 2,000",
    numericPrice: 800,
    duration: "25 mins",
    description: "Gentle atraumatic tooth removal and surgical wisdom tooth impaction with quick recovery.",
    features: ["Zero Pain Guarantee", "Preserves Socket Bone", "PRP Healing Boost", "Post-op Care Kit"],
    icon: "HeartPulse",
    videoUrl: "https://www.youtube.com/embed/G6jWlQv_tV8",
    videoTitle: "Wisdom Tooth Removal & Care"
  },
  {
    id: "srv-7",
    name: "Zirconia & Ceramic Crowns / Bridges",
    price: "₹ 3,500 - ₹ 7,500",
    numericPrice: 3500,
    duration: "2 Sittings",
    description: "CAD/CAM digitally designed metal-free crowns with natural translucency and 15-year warranty.",
    features: ["CAD/CAM Precision", "100% Metal-Free", "Natural Translucency", "Warranty Card Included"],
    icon: "Award",
    videoUrl: "https://www.youtube.com/embed/tW3YgJqR1Z0",
    videoTitle: "CAD-CAM Dental Crown Manufacturing"
  },
  {
    id: "srv-8",
    name: "Kids & Pediatric Dental Care",
    price: "₹ 600",
    numericPrice: 600,
    duration: "30 mins",
    description: "Child-friendly atmosphere with painless pit & fissure sealants, fluoride therapy, and fillings.",
    features: ["Friendly Doctor", "Fluoride Varnish", "No Fear / Happy Smiles", "Preventive Care"],
    icon: "SmilePlus",
    videoUrl: "https://www.youtube.com/embed/WbWlO8d3A-s",
    videoTitle: "Pediatric Dental Care Guide"
  }
];

export const DEFAULT_PHOTOS: ClinicPhoto[] = [
  {
    id: "ph-1",
    title: "Welcoming Reception & Waiting Lounge",
    category: "Reception",
    url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80",
    description: "Air-conditioned soothing waiting lounge with beverage station and educational dental displays."
  },
  {
    id: "ph-2",
    title: "Modern Ergonomic Dental Operatory 1",
    category: "Treatment",
    url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80",
    description: "Equipped with hydraulic chair, intraoral camera monitor, and shadowless LED operating lights."
  },
  {
    id: "ph-3",
    title: "High-Definition Digital RVG & X-Ray Station",
    category: "Machines",
    url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80",
    description: "Digital sensor system with 90% reduced radiation providing high resolution tooth imaging in 3 seconds."
  },
  {
    id: "ph-4",
    title: "Rotary Endodontic & Apex Locator Setup",
    category: "Machines",
    url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&auto=format&fit=crop&q=80",
    description: "Precision micro-motors allowing single sitting pain-free root canals."
  },
  {
    id: "ph-5",
    title: "Class-B Vacuum Autoclave & Sterilization Zone",
    category: "Sterilization",
    url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80",
    description: "Hospital grade 6-tier sterilization protocol with sealed indicator pouches."
  },
  {
    id: "ph-6",
    title: "Private Consultation & Smile Makeover Suite",
    category: "Treatment",
    url: "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&auto=format&fit=crop&q=80",
    description: "Quiet private suite for invisible aligner smile designing and implant discussions."
  }
];

export async function seedInitialClinicData() {
  try {
    // 1. Admin config
    const adminRef = doc(db, 'admin', 'config');
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        adminPhone: "7692808120",
        securityQuestion: "What was the first gift you remember receiving?",
        securityQuestionVersion: 1,
        autoLogoutMinutes: 30,
        updatedAt: new Date().toISOString()
      });
    } else {
      const d = adminSnap.data();
      if (!d.securityQuestion) {
        await updateDoc(adminRef, {
          securityQuestion: "What was the first gift you remember receiving?",
          securityQuestionVersion: 1
        }).catch(() => {});
      }
    }

    // 2. Allowed staff
    const staffCol = collection(db, 'allowed_staff');
    const staffSnap = await getDocs(staffCol);
    if (staffSnap.empty) {
      const defaultStaff = [
        { phone: "7692808120", name: "Dr. Anujay Sharma", role: "Chief Dental Surgeon", addedAt: new Date().toISOString() },
        { phone: "9898989898", name: "Priya Verma", role: "Senior Dental Hygienist", addedAt: new Date().toISOString() },
        { phone: "9123456789", name: "Rohan Patel", role: "Clinic Front Desk Manager", addedAt: new Date().toISOString() }
      ];
      for (const staff of defaultStaff) {
        await addDoc(staffCol, staff);
      }
    }

    // 3. Settings (Clinic Branding, Address, Phone, Map, Timings)
    const settingsRef = doc(db, 'content', 'settings');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        sectionKey: "settings",
        data: JSON.stringify(DEFAULT_SETTINGS),
        updatedAt: new Date().toISOString()
      });
    } else {
      try {
        const currentData = JSON.parse(settingsSnap.data()?.data || '{}');
        if (
          !currentData.address?.includes('Utsav Bhavan') ||
          !currentData.address?.includes('490026') ||
          currentData.address?.includes('Kohka') ||
          currentData.address?.includes('Gudhiyari') || 
          currentData.clinicName?.includes('Prime') ||
          !currentData.googleMapUrl?.includes('z2c6moS2vPQ87f1V8')
        ) {
          const updatedSettings = {
            ...currentData,
            clinicName: "AnuJay Dental Clinic",
            address: "Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026",
            googleMapUrl: "https://maps.app.goo.gl/z2c6moS2vPQ87f1V8",
            googleMapEmbedQuery: "AnuJay Dental Clinic, Shop no. 3, infront of Utsav Bhavan, Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026",
            cityState: "Supela, Sunder Nagar, Bhilai, Chhattisgarh 490026",
            openingHours: currentData.openingHours || "10:00 AM - 2:00 PM, 5:00 PM - 9:00 PM (Monday to Saturday)"
          };
          const serialized = JSON.stringify(updatedSettings);
          if (serialized.length < 800000) {
            await setDoc(settingsRef, {
              sectionKey: "settings",
              data: serialized,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn("Settings migration skipped:", err);
      }
    }

    // 4. Content: about, faq, highlights, services, gallery
    const aboutRef = doc(db, 'content', 'about');
    const aboutSnap = await getDoc(aboutRef);
    if (!aboutSnap.exists()) {
      await setDoc(aboutRef, {
        sectionKey: "about",
        data: JSON.stringify(DEFAULT_ABOUT),
        updatedAt: new Date().toISOString()
      });
    }

    const faqRef = doc(db, 'content', 'faq');
    const faqSnap = await getDoc(faqRef);
    if (!faqSnap.exists()) {
      await setDoc(faqRef, {
        sectionKey: "faq",
        data: JSON.stringify(DEFAULT_FAQS),
        updatedAt: new Date().toISOString()
      });
    }

    const highlightsRef = doc(db, 'content', 'highlights');
    const highlightsSnap = await getDoc(highlightsRef);
    if (!highlightsSnap.exists()) {
      await setDoc(highlightsRef, {
        sectionKey: "highlights",
        data: JSON.stringify(DEFAULT_HIGHLIGHTS),
        updatedAt: new Date().toISOString()
      });
    }

    const servicesRef = doc(db, 'content', 'services');
    const servicesSnap = await getDoc(servicesRef);
    if (!servicesSnap.exists()) {
      await setDoc(servicesRef, {
        sectionKey: "services",
        data: JSON.stringify(DEFAULT_SERVICES),
        updatedAt: new Date().toISOString()
      });
    }

    const galleryRef = doc(db, 'content', 'gallery');
    const gallerySnap = await getDoc(galleryRef);
    if (!gallerySnap.exists()) {
      await setDoc(galleryRef, {
        sectionKey: "gallery",
        data: JSON.stringify(DEFAULT_PHOTOS),
        updatedAt: new Date().toISOString()
      });
    }

    // 5. Inventory items
    const invCol = collection(db, 'inventory');
    const invSnap = await getDocs(invCol);
    if (invSnap.empty) {
      const defaultInventory = [
        { name: "Augmentin 625mg (Amox-Clav)", quantity: 45, unit: "strips", category: "Antibiotics", minThreshold: 15, updatedAt: new Date().toISOString() },
        { name: "Aceclofenac + Paracetamol 100/325", quantity: 80, unit: "strips", category: "Analgesic / Painkillers", minThreshold: 20, updatedAt: new Date().toISOString() },
        { name: "Lignocaine 2% + Adrenaline Vials", quantity: 50, unit: "vials", category: "Local Anesthesia", minThreshold: 15, updatedAt: new Date().toISOString() },
        { name: "Composite 3M Filtek Z350 Syringe", quantity: 12, unit: "syringes", category: "Restorative Materials", minThreshold: 4, updatedAt: new Date().toISOString() },
        { name: "Mani Rotary Endodontic NiTi Files", quantity: 24, unit: "packs", category: "Endodontics", minThreshold: 6, updatedAt: new Date().toISOString() },
        { name: "Alginate Impression Powder (450g)", quantity: 16, unit: "packs", category: "Prosthodontics", minThreshold: 5, updatedAt: new Date().toISOString() },
        { name: "Sterile Disposable Latex Gloves", quantity: 22, unit: "boxes", category: "Consumables", minThreshold: 8, updatedAt: new Date().toISOString() },
        { name: "Class-B Autoclave Sterilization Rolls", quantity: 9, unit: "rolls", category: "Sterilization", minThreshold: 3, updatedAt: new Date().toISOString() },
        { name: "Gutta Percha (GP) Points 4% Assorted", quantity: 35, unit: "boxes", category: "Endodontics", minThreshold: 10, updatedAt: new Date().toISOString() },
        { name: "Chlorhexidine 0.2% Mouthwash 150ml", quantity: 28, unit: "bottles", category: "Oral Care", minThreshold: 8, updatedAt: new Date().toISOString() }
      ];
      for (const item of defaultInventory) {
        await addDoc(invCol, item);
      }
    }

    // 6. Patients
    const patCol = collection(db, 'patients');
    const patSnap = await getDocs(patCol);
    if (patSnap.empty) {
      const defaultPatients = [
        { name: "Rajesh Kumar", phone: "9811223344", age: 38, gender: "Male", address: "Civil Lines, Block B", notes: "Mild hypertension, completed lower molar RCT", totalVisits: 2, lastVisit: "2026-10-02", createdAt: "2026-09-20" },
        { name: "Sunita Mehra", phone: "9877112233", age: 29, gender: "Female", address: "Sector 14, Housing Board", notes: "Composite restoration on upper premolar", totalVisits: 1, lastVisit: "2026-10-05", createdAt: "2026-10-05" },
        { name: "Vikram Malhotra", phone: "9822334455", age: 52, gender: "Male", address: "Model Town", notes: "Full mouth ultrasonic scaling, planned implant for 36", totalVisits: 3, lastVisit: "2026-10-07", createdAt: "2026-08-15" }
      ];
      for (const patient of defaultPatients) {
        await addDoc(patCol, patient);
      }
    }

    // 7. Prescriptions
    const prescCol = collection(db, 'prescriptions');
    const prescSnap = await getDocs(prescCol);
    if (prescSnap.empty) {
      const defaultPrescriptions = [
        {
          patientName: "Rajesh Kumar",
          patientPhone: "9811223344",
          age: 38,
          gender: "Male",
          ageSex: "38 / M",
          serviceTaken: "Root Canal Treatment (Tooth #46)",
          chiefComplaint: "Severe throbbing pain in lower right tooth since 3 days.",
          onExamination: "Deep disto-occlusal decay in #46, tender to vertical percussion (+).",
          pastMedicalHistory: "No known drug allergies, non-diabetic.",
          treatmentAdvised: "Single sitting RCT with CAD/CAM Zirconia Crown.",
          resultUpdate: "Canals biomechanically prepared and obturated cleanly with AH-Plus sealer. Temporary Cavit restoration placed. No post-op tenderness noted.",
          prescriptionText: "Tab. Augmentin 625mg (1 tab twice daily after food x 5 days)\nTab. Zerodol-SP (1 tab SOS / twice daily if pain x 3 days)\nTab. Pantocid 40mg (1 tab morning empty stomach x 5 days)\nWarm saline mouth rinses 3-4 times daily.",
          medicinesList: [
            { name: "Augmentin 625mg", dosage: "1 Tab", frequency: "1-0-1", duration: "5 Days", instructions: "After food" },
            { name: "Zerodol-SP", dosage: "1 Tab", frequency: "1-0-1", duration: "3 Days", instructions: "After food" },
            { name: "Pantocid 40mg", dosage: "1 Tab", frequency: "1-0-0", duration: "5 Days", instructions: "Empty stomach" }
          ],
          doctorName: "Dr. Anup Kumar Hota",
          doctorDegree: "DENTAL SURGEON (BDS)",
          doctorRegNo: "CGDC/G/26/4876",
          date: "2026-10-02",
          createdAt: new Date().toISOString()
        },
        {
          patientName: "Sunita Mehra",
          patientPhone: "9877112233",
          age: 29,
          gender: "Female",
          ageSex: "29 / F",
          serviceTaken: "Tooth Restoration / Aesthetic Filling (Tooth #24)",
          chiefComplaint: "Food lodgement and mild sensitivity to cold sweets.",
          onExamination: "Class II cavity in #24, no pulpal exposure, percussion negative.",
          pastMedicalHistory: "Healthy, non-hypertensive.",
          treatmentAdvised: "Composite Aesthetic Micro-hybrid Restoration.",
          resultUpdate: "Deep decay excavated under rubber dam isolation. Calcium hydroxide liner applied. Restored with 3M Z350 Universal Composite Shade A2. High bite checked and polished.",
          prescriptionText: "Tab. Ketorol-DT (Dispersible tablet in half glass water if mild sensitivity occurs)\nAvoid chewing hard nuts or sticky candy on left side for 24 hours.",
          medicinesList: [
            { name: "Ketorol-DT", dosage: "1 Tab", frequency: "SOS", duration: "2 Days", instructions: "Disperse in water" }
          ],
          doctorName: "Dr. Anup Kumar Hota",
          doctorDegree: "DENTAL SURGEON (BDS)",
          doctorRegNo: "CGDC/G/26/4876",
          date: "2026-10-05",
          createdAt: new Date().toISOString()
        }
      ];
      for (const presc of defaultPrescriptions) {
        await addDoc(prescCol, presc);
      }
    }

    // 8. Sample Bookings (including a 'New' one so notification badge triggers)
    const bookCol = collection(db, 'bookings');
    const bookSnap = await getDocs(bookCol);
    if (bookSnap.empty) {
      const defaultBookings = [
        {
          patientName: "Aman Gupta",
          phone: "9899112233",
          service: "Teeth Whitening & Laser Polishing",
          date: "2026-10-09",
          timeSlot: "11:30 AM",
          problemDescription: "Yellowish stains on front teeth, wanting brightening before a family wedding.",
          status: "New",
          paymentStatus: "Unpaid",
          fee: 1500,
          seenByStaff: false,
          createdAt: new Date().toISOString()
        },
        {
          patientName: "Kavita Rao",
          phone: "9833445566",
          service: "Single Sitting Root Canal (RCT)",
          date: "2026-10-09",
          timeSlot: "04:00 PM",
          problemDescription: "Severe pain in upper right tooth while drinking cold water.",
          status: "Confirmed",
          paymentStatus: "Unpaid",
          fee: 3000,
          seenByStaff: true,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          patientName: "Vikram Malhotra",
          phone: "9822334455",
          service: "Ultrasonic Scaling & Deep Cleaning",
          date: "2026-10-07",
          timeSlot: "10:00 AM",
          problemDescription: "Routine bi-annual tartar removal.",
          status: "Completed",
          paymentStatus: "Paid",
          fee: 1000,
          seenByStaff: true,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];
      for (const booking of defaultBookings) {
        await addDoc(bookCol, booking);
      }
    }

    // 9. Reviews
    const revCol = collection(db, 'reviews');
    const revSnap = await getDocs(revCol);
    if (revSnap.empty) {
      const defaultReviews = [
        {
          name: "Siddharth Chawla",
          rating: 5,
          reviewText: "I had extreme dental anxiety, but Dr. Anujay made my root canal completely painless! The clinic is spotless, ultra-modern, and the staff is very supportive. Highly recommended!",
          date: "2026-10-01",
          isApproved: true
        },
        {
          name: "Dr. Meenakshi Sundaram",
          rating: 5,
          reviewText: "Outstanding sterilization and hygiene standards. The digital RVG X-ray was done in seconds without any discomfort. Transparent pricing and no unnecessary procedures pushed.",
          date: "2026-09-28",
          isApproved: true
        },
        {
          name: "Pooja Singhania",
          rating: 5,
          reviewText: "Took my 7-year-old daughter for a tooth extraction. Dr. Anujay was so gentle and friendly that she didn't even shed a single tear! Truly the best dental clinic in the city.",
          date: "2026-09-22",
          isApproved: true
        },
        {
          name: "Rameshwar Dayal",
          rating: 5,
          reviewText: "Attended their Free Sunday Checkup and got my dental issue diagnosed with full explanation on the monitor. Got ultrasonic cleaning done at a very reasonable rate.",
          date: "2026-09-15",
          isApproved: true
        }
      ];
      for (const rev of defaultReviews) {
        await addDoc(revCol, rev);
      }
    }

    // 10. Expenses
    const expCol = collection(db, 'expenses');
    const expSnap = await getDocs(expCol);
    if (expSnap.empty) {
      const defaultExpenses = [
        { name: "3M Dental Composite & Bonding Depot Supply", amount: 6500, category: "Dental Materials", date: "2026-10-01", notes: "Shade A1, A2, A3 syringes + Scotchbond", createdAt: new Date().toISOString() },
        { name: "Class-B Autoclave Pouches & Chemical Indicators", amount: 1800, category: "Sterilization", date: "2026-10-03", notes: "5 rolls of 200mm sealing reels", createdAt: new Date().toISOString() },
        { name: "Clinic Electricity & High Power Backup", amount: 4200, category: "Utilities", date: "2026-10-04", notes: "Monthly power & inverter maintenance", createdAt: new Date().toISOString() },
        { name: "Biomedical Waste Disposal Protocol Fee", amount: 1200, category: "Biohazard Safety", date: "2026-10-05", notes: "Monthly government approved collection", createdAt: new Date().toISOString() }
      ];
      for (const exp of defaultExpenses) {
        await addDoc(expCol, exp);
      }
    }

    // 11. Direct Clinic Income
    const incCol = collection(db, 'income');
    const incSnap = await getDocs(incCol);
    if (incSnap.empty) {
      const defaultIncome = [
        { source: "Dr. Anujay Clinic Walk-in (Manish Jain)", service: "Single Sitting Root Canal (RCT)", amount: 3500, date: "2026-10-06", paymentMode: "Cash", notes: "Lower right molar treatment", createdAt: new Date().toISOString() },
        { source: "Walk-in Patient (Pooja Gupta)", service: "Teeth Whitening & Laser Polishing", amount: 1500, date: "2026-10-07", paymentMode: "UPI", notes: "Pre-wedding dental cleanup", createdAt: new Date().toISOString() },
        { source: "Direct Patient (Harish Chander)", service: "Ultrasonic Scaling & Deep Cleaning", amount: 1000, date: "2026-10-08", paymentMode: "Cash", notes: "Routine calculus removal", createdAt: new Date().toISOString() },
        { source: "Counter Pharmacy Sales", service: "Oral Hygiene Kit + Chlorhexidine Rinse", amount: 450, date: "2026-10-08", paymentMode: "Cash", notes: "2x Mouthwash bottles sold", createdAt: new Date().toISOString() }
      ];
      for (const inc of defaultIncome) {
        await addDoc(incCol, inc);
      }
    }

    // 12. Patient Documents (X-Rays, Lab Reports, Treatment Plans)
    const docCol = collection(db, 'documents');
    const docSnap = await getDocs(docCol);
    if (docSnap.empty) {
      // Find Rajesh Kumar & Sunita Mehra if they exist
      const patDocs = await getDocs(collection(db, 'patients'));
      const rajesh = patDocs.docs.find(d => (d.data().name || '').toLowerCase().includes('rajesh'));
      const sunita = patDocs.docs.find(d => (d.data().name || '').toLowerCase().includes('sunita'));
      const rajeshId = rajesh ? rajesh.id : 'pat-rajesh';
      const rajeshPhone = rajesh ? rajesh.data().phone : '9811223344';
      const sunitaId = sunita ? sunita.id : 'pat-sunita';
      const sunitaPhone = sunita ? sunita.data().phone : '9877112233';

      const sampleXraySvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450' width='600' height='450'><rect width='600' height='450' fill='%23050b14'/><rect x='20' y='20' width='560' height='410' fill='%230a1120' rx='8' stroke='%231e293b' stroke-width='2'/><g opacity='0.15' stroke='%2338bdf8' stroke-width='0.5'><line x1='50' y1='20' x2='50' y2='430'/><line x1='150' y1='20' x2='150' y2='430'/><line x1='250' y1='20' x2='250' y2='430'/><line x1='350' y1='20' x2='350' y2='430'/><line x1='450' y1='20' x2='450' y2='430'/><line x1='550' y1='20' x2='550' y2='430'/><line x1='20' y1='100' x2='580' y2='100'/><line x1='20' y1='200' x2='580' y2='200'/><line x1='20' y1='300' x2='580' y2='300'/></g><path d='M180,320 C180,180 230,120 300,120 C370,120 420,180 420,320 C400,340 370,300 350,240 C330,190 270,190 250,240 C230,300 200,340 180,320 Z' fill='%23cbd5e1' opacity='0.75' filter='blur(1px)'/><path d='M220,340 C230,260 250,170 300,160 C350,170 370,260 380,340 C370,360 340,310 330,260 C320,200 280,200 270,260 C260,310 230,360 220,340 Z' fill='%23f8fafc' opacity='0.85'/><path d='M290,190 Q300,180 310,190 Q310,240 305,310 Q300,330 295,310 Q290,240 290,190 Z' fill='%231e293b' opacity='0.9'/><path d='M350,190 Q358,230 365,300 Q360,320 355,300 Q348,230 342,190 Z' fill='%231e293b' opacity='0.9'/><path d='M240,190 Q245,230 248,300 Q242,320 238,300 Q235,230 232,190 Z' fill='%231e293b' opacity='0.9'/><text x='40' y='50' fill='%2338bdf8' font-family='monospace' font-size='12' font-weight='bold'>ANUJAY DENTAL CLINIC - DIGITAL RVG SENSOR</text><text x='40' y='70' fill='%2394a3b8' font-family='monospace' font-size='11'>PATIENT: RAJESH KUMAR | TOOTH: #46 (MANDIBULAR MOLAR)</text><text x='40' y='90' fill='%2364748b' font-family='monospace' font-size='10'>EXPOSURE: 0.12s | 65kV | PRE-OP DIAGNOSTIC BITEWING</text><text x='480' y='50' fill='%23f59e0b' font-family='monospace' font-size='11' font-weight='bold'>[CONFIDENTIAL]</text><rect x='440' y='360' width='120' height='40' fill='%23000' opacity='0.7' rx='4'/><text x='450' y='385' fill='%2338bdf8' font-family='sans-serif' font-size='11' font-weight='bold'>Scale: 1.0mm</text></svg>";
      const sampleLabReportSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 450' width='600' height='450'><rect width='600' height='450' fill='%23f8fafc'/><rect x='20' y='20' width='560' height='410' fill='white' rx='8' stroke='%23e2e8f0' stroke-width='2'/><rect x='20' y='20' width='560' height='60' fill='%230284c7' rx='6'/><text x='40' y='55' fill='white' font-family='sans-serif' font-size='18' font-weight='bold'>DENTAL LAB SHADE & RESTORATION REPORT</text><text x='40' y='110' fill='%230f172a' font-family='sans-serif' font-size='13' font-weight='bold'>Lab Partner: Precision CAD/CAM Dental Milling Center, Delhi</text><text x='40' y='135' fill='%23475569' font-family='sans-serif' font-size='12'>Doctor: Dr. Anujay Sharma (B.D.S., M.D.S.) | Clinic: Anujay Dental Clinic</text><text x='40' y='160' fill='%23475569' font-family='sans-serif' font-size='12'>Patient: Rajesh Kumar | Tooth Number: #46</text><line x1='40' y1='180' x2='560' y2='180' stroke='%23e2e8f0' stroke-width='1'/><text x='40' y='210' fill='%230284c7' font-family='sans-serif' font-size='13' font-weight='bold'>SPECIFICATIONS:</text><text x='40' y='235' fill='%23334155' font-family='sans-serif' font-size='12'>• Material: Multi-layered High Translucent Zirconia (Katana/Aidite)</text><text x='40' y='260' fill='%23334155' font-family='sans-serif' font-size='12'>• Shade Selected: VITA Classical Shade A2 (Gingival A3 gradient)</text><text x='40' y='285' fill='%23334155' font-family='sans-serif' font-size='12'>• Occlusal Clearance: 1.5mm anatomically sculpted with glazed fissure staining</text><text x='40' y='310' fill='%23334155' font-family='sans-serif' font-size='12'>• Margin Quality: Feather edge fit checked under 20x stereomicroscope (PASS)</text><rect x='40' y='340' width='520' height='60' fill='%23f0fdf4' stroke='%23bbf7d0' rx='6'/><text x='60' y='365' fill='%2315803d' font-family='sans-serif' font-size='13' font-weight='bold'>✓ QUALITY ASSURANCE STATUS: APPROVED FOR CEMENTATION</text><text x='60' y='385' fill='%23166534' font-family='sans-serif' font-size='11'>Digital Barcode: DLAB-99281-ZIR46 | Verified by: Senior Dental Ceramist</text></svg>";

      const sampleDocuments = [
        {
          patientId: rajeshId,
          patientName: "Rajesh Kumar",
          patientPhone: rajeshPhone,
          category: "X-Ray / Dental Imaging" as const,
          title: "Pre-RCT Digital RVG X-Ray (#46)",
          description: "Digital radiovisiography showing deep disto-occlusal caries extending to the pulp with normal periapical contour.",
          documentDate: "2026-10-02",
          fileUrl: sampleXraySvg,
          fileName: "Rajesh_Kumar_Tooth46_PreRCT_XRay.svg",
          fileType: "image/svg+xml",
          fileSize: 145000,
          uploaderName: "Dr. Anujay Sharma",
          uploaderRole: "admin" as const,
          isPublished: true,
          createdAt: "2026-10-02T10:30:00.000Z"
        },
        {
          patientId: rajeshId,
          patientName: "Rajesh Kumar",
          patientPhone: rajeshPhone,
          category: "Laboratory Report" as const,
          title: "CAD/CAM Zirconia Crown Shade Analysis (#46)",
          description: "Precision lab report confirming VITA Shade A2 match and marginal integrity pass for crown delivery.",
          documentDate: "2026-10-06",
          fileUrl: sampleLabReportSvg,
          fileName: "Lab_Zirconia_ShadeReport_Tooth46.svg",
          fileType: "image/svg+xml",
          fileSize: 98000,
          uploaderName: "Staff Receptionist",
          uploaderRole: "staff" as const,
          isPublished: true,
          createdAt: "2026-10-06T15:00:00.000Z"
        },
        {
          patientId: sunitaId,
          patientName: "Sunita Mehra",
          patientPhone: sunitaPhone,
          category: "Treatment Plan" as const,
          title: "Aesthetic Restoration & Polishing Plan",
          description: "Step-by-step composite restoration protocol for upper premolar with shade matching and dental hygiene instructions.",
          documentDate: "2026-10-05",
          fileUrl: sampleLabReportSvg,
          fileName: "Sunita_TreatmentPlan_Restoration.svg",
          fileType: "image/svg+xml",
          fileSize: 85000,
          uploaderName: "Dr. Anujay Sharma",
          uploaderRole: "admin" as const,
          isPublished: true,
          createdAt: "2026-10-05T11:15:00.000Z"
        }
      ];
      for (const docItem of sampleDocuments) {
        await addDoc(docCol, docItem);
      }
    }

    // 13. Invoices and Billing Ledgers
    const invoiceCol = collection(db, 'invoices');
    const invoiceSnap = await getDocs(invoiceCol);
    if (invoiceSnap.empty) {
      const patDocs = await getDocs(collection(db, 'patients'));
      const rajesh = patDocs.docs.find(d => (d.data().name || '').toLowerCase().includes('rajesh'));
      const sunita = patDocs.docs.find(d => (d.data().name || '').toLowerCase().includes('sunita'));
      const vikram = patDocs.docs.find(d => (d.data().name || '').toLowerCase().includes('vikram'));
      const rajeshId = rajesh ? rajesh.id : 'pat-rajesh';
      const rajeshPhone = rajesh ? rajesh.data().phone : '9811223344';
      const sunitaId = sunita ? sunita.id : 'pat-sunita';
      const sunitaPhone = sunita ? sunita.data().phone : '9877112233';
      const vikramId = vikram ? vikram.id : 'pat-vikram';
      const vikramPhone = vikram ? vikram.data().phone : '9822334455';

      // Invoice 1: Rajesh Kumar - Partially Paid
      const inv1 = await addDoc(invoiceCol, {
        invoiceNumber: "INV-2026-101",
        patientId: rajeshId,
        patientName: "Rajesh Kumar",
        patientPhone: rajeshPhone,
        invoiceDate: "2026-10-02",
        treatmentDescription: "Single Sitting RCT (#46) + CAD/CAM Zirconia Crown",
        totalCharges: 7500,
        discount: 500,
        finalAmount: 7000,
        amountPaid: 4000,
        outstandingBalance: 3000,
        paymentStatus: "Partially Paid",
        notes: "Advance paid on RCT completion. Balance due on crown delivery.",
        createdBy: "Dr. Anujay Sharma",
        createdAt: "2026-10-02T11:00:00.000Z"
      });

      // Record corresponding payment for Rajesh
      await addDoc(collection(db, 'patient_payments'), {
        invoiceId: inv1.id,
        invoiceNumber: "INV-2026-101",
        patientId: rajeshId,
        patientName: "Rajesh Kumar",
        amount: 4000,
        paymentDate: "2026-10-02",
        paymentMethod: "UPI",
        referenceNumber: "UPI-429184812",
        recordedBy: "Staff Receptionist",
        recordedByRole: "staff",
        notes: "Part payment received via GooglePay",
        createdAt: "2026-10-02T11:05:00.000Z"
      });

      // Invoice 2: Sunita Mehra - Fully Paid
      const inv2 = await addDoc(invoiceCol, {
        invoiceNumber: "INV-2026-102",
        patientId: sunitaId,
        patientName: "Sunita Mehra",
        patientPhone: sunitaPhone,
        invoiceDate: "2026-10-05",
        treatmentDescription: "3M Dental Composite Restoration (Premolar #24)",
        totalCharges: 1800,
        discount: 0,
        finalAmount: 1800,
        amountPaid: 1800,
        outstandingBalance: 0,
        paymentStatus: "Paid",
        notes: "Full payment received at counter.",
        createdBy: "Staff Receptionist",
        createdAt: "2026-10-05T12:00:00.000Z"
      });

      await addDoc(collection(db, 'patient_payments'), {
        invoiceId: inv2.id,
        invoiceNumber: "INV-2026-102",
        patientId: sunitaId,
        patientName: "Sunita Mehra",
        amount: 1800,
        paymentDate: "2026-10-05",
        paymentMethod: "Cash",
        referenceNumber: "RCPT-8821",
        recordedBy: "Staff Receptionist",
        recordedByRole: "staff",
        notes: "Cash payment received",
        createdAt: "2026-10-05T12:05:00.000Z"
      });

      // Invoice 3: Vikram Malhotra - Unpaid
      await addDoc(invoiceCol, {
        invoiceNumber: "INV-2026-103",
        patientId: vikramId,
        patientName: "Vikram Malhotra",
        patientPhone: vikramPhone,
        invoiceDate: "2026-10-07",
        treatmentDescription: "Full Mouth Ultrasonic Scaling & Deep Polish",
        totalCharges: 1200,
        discount: 200,
        finalAmount: 1000,
        amountPaid: 0,
        outstandingBalance: 1000,
        paymentStatus: "Unpaid",
        notes: "Patient requested payment link / pay next visit",
        createdBy: "Dr. Anujay Sharma",
        createdAt: "2026-10-07T16:00:00.000Z"
      });

      // Initial Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        patientId: rajeshId,
        patientName: "Rajesh Kumar",
        action: "INVOICE_CREATED",
        details: "Created Invoice #INV-2026-101 for ₹ 7,000",
        performedBy: "Dr. Anujay Sharma",
        performedByRole: "admin",
        timestamp: "2026-10-02T11:00:00.000Z"
      });

      await addDoc(collection(db, 'audit_logs'), {
        patientId: rajeshId,
        patientName: "Rajesh Kumar",
        action: "PAYMENT_RECORDED",
        details: "Recorded payment of ₹ 4,000 via UPI (Ref: UPI-429184812) for Inv #INV-2026-101",
        performedBy: "Staff Receptionist",
        performedByRole: "staff",
        timestamp: "2026-10-02T11:05:00.000Z"
      });
    }

    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach Cloud Firestore backend') || error.message.includes('offline'))) {
      console.warn("Seed data deferred while offline/connecting:", error.message);
    } else {
      console.warn("Seed data notice:", error);
    }
    return false;
  }
}
