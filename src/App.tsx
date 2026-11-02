import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { Header } from './components/public/Header';
import { HeroSection } from './components/public/HeroSection';
import { ServicesSection } from './components/public/ServicesSection';
import { OtherDetailsSection } from './components/public/OtherDetailsSection';
import { PhotosGallery } from './components/public/PhotosGallery';
import { LocationMapSection } from './components/public/LocationMapSection';
import { ReviewsSection } from './components/public/ReviewsSection';
import { AboutAndFaqSection } from './components/public/AboutAndFaqSection';
import { DoctorAboutSection } from './components/public/DoctorAboutSection';
import { BookingSection } from './components/public/BookingSection';
import { Footer } from './components/public/Footer';
import { LoginModal } from './components/auth/LoginModal';
import { PatientLoginModal } from './components/portal/PatientLoginModal';
import { PatientDashboard } from './components/portal/PatientDashboard';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MapModal } from './components/common/MapModal';
import { VideoModal } from './components/common/VideoModal';
import { PrescriptionEditorModal } from './components/prescription/PrescriptionEditorModal';
import { DentalService, Patient, Prescription, ClinicNotice } from './types/clinic';
import { AnnouncementStrip } from './components/public/AnnouncementStrip';
import { OffersAndNoticesSection } from './components/public/OffersAndNoticesSection';
import { NoticeDetailModal } from './components/common/NoticeDetailModal';
import { AndroidInstallModal } from './components/common/AndroidInstallModal';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { SplashScreen } from './components/common/SplashScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { 
  Eye, 
  LayoutDashboard, 
  MessageCircle, 
  UserCheck
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { role, staffUser, logout } = useAuth();
  const { settings, addPrescription, setActivePatientId, isLoading } = useClinic();

  // Navigation & View State
  const [activeView, setActiveView] = useState<'public' | 'staff' | 'admin' | 'patient'>('public');
  
  // Patient Portal session state
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'staff' | 'admin'>('staff');
  const [patientLoginModalOpen, setPatientLoginModalOpen] = useState(false);
  const [patientPhoneInitial, setPatientPhoneInitial] = useState('');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [videoModalService, setVideoModalService] = useState<DentalService | null>(null);
  const [preSelectedService, setPreSelectedService] = useState('');
  const [selectedAnnouncementNotice, setSelectedAnnouncementNotice] = useState<ClinicNotice | null>(null);

  // Patient portal tab sync state for mobile bottom nav
  const [activePatientTab, setActivePatientTab] = useState<'reports' | 'prescriptions' | 'xrays' | 'invoices' | 'payments' | 'updates'>('reports');
  const [openWhatsAppPrefSignal, setOpenWhatsAppPrefSignal] = useState(0);

  // Android APK / PWA install modal state
  const [androidModalOpen, setAndroidModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for native Android PWA install prompt
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Prescription modal state (for quick standalone generation)
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionToEdit, setPrescriptionToEdit] = useState<Partial<Prescription> | null>(null);

  // Sync role changes to activeView
  const prevRoleRef = React.useRef(role);
  React.useEffect(() => {
    if (prevRoleRef.current === 'public' && (role === 'admin' || role === 'staff')) {
      setActiveView(role);
    } else if (role === 'public' && (activeView === 'admin' || activeView === 'staff')) {
      setActiveView('public');
    }
    prevRoleRef.current = role;
  }, [role, activeView]);

  // Open Staff or Admin Login Modal
  const handleOpenLogin = (tab: 'staff' | 'admin' = 'staff') => {
    setLoginModalTab(tab);
    setLoginModalOpen(true);
  };

  // Open Patient Login Modal
  const handleOpenPatientLogin = (phone?: string) => {
    if (phone) {
      setPatientPhoneInitial(phone);
    }
    setPatientLoginModalOpen(true);
  };

  // Patient selects service to book
  const handleSelectService = (serviceName: string) => {
    setPreSelectedService(serviceName);
    const bookingEl = document.getElementById('book') || document.getElementById('booking');
    if (bookingEl) {
      bookingEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to booking
  const handleBookClick = () => {
    const bookingEl = document.getElementById('book') || document.getElementById('booking');
    if (bookingEl) {
      bookingEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Quick WhatsApp URL
  const cleanWhatsApp = (settings?.whatsappNumber || '917692808120').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello ${settings?.clinicName || 'Anujay Dental Clinic'}, I would like to inquire about dental treatment.`
  )}`;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Floating Admin/Staff Session Bar when logged in */}
      {role !== 'public' && (
        <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] text-xs flex flex-wrap items-center justify-between gap-2 shadow-md sticky top-0 z-50 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold truncate">
              {role === 'admin' ? 'Super Admin Mode Active' : `Staff Active (${staffUser?.name || 'Authorized'})`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeView === 'public' ? (
              <button
                type="button"
                onClick={() => setActiveView(role === 'admin' ? 'admin' : 'staff')}
                className="px-2.5 sm:px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Return to {role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}</span>
                <span className="sm:hidden">{role === 'admin' ? 'Admin' : 'Staff'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('public')}
                className="px-2.5 sm:px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview Public Website</span>
                <span className="sm:hidden">Website</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                logout();
                setActiveView('public');
              }}
              className="px-2 sm:px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition cursor-pointer text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Patient Portal Bar when patient is logged in */}
      {currentPatient && activeView === 'public' && role === 'public' && (
        <div className="bg-blue-900 text-white px-3 sm:px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] text-xs flex flex-wrap items-center justify-between gap-2 shadow-md sticky top-0 z-50 border-b border-blue-700">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Welcome, <strong>{currentPatient.name}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('patient')}
              className="px-2.5 sm:px-3 py-1 bg-white text-blue-900 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
            >
              <span className="hidden sm:inline">Open My Dental Records</span>
              <span className="sm:hidden">My Records</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentPatient(null);
                setActivePatientId(null);
              }}
              className="px-2 sm:px-2.5 py-1 bg-blue-800 hover:bg-blue-700 text-blue-200 rounded-lg font-medium transition cursor-pointer text-xs"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ================= VIEW ROUTING ================= */}
      {activeView === 'admin' && role === 'admin' ? (
        <AdminDashboard />
      ) : activeView === 'staff' && (role === 'staff' || role === 'admin') ? (
        <StaffDashboard />
      ) : activeView === 'patient' && currentPatient ? (
        <PatientDashboard 
          patient={currentPatient} 
          activeTabOverride={activePatientTab}
          onTabChange={(tab) => setActivePatientTab(tab)}
          openWhatsAppPrefSignal={openWhatsAppPrefSignal}
          onLogout={() => {
            setCurrentPatient(null);
            setActivePatientId(null);
            setActiveView('public');
          }} 
        />
      ) : (
        /* ================= PUBLIC WEBSITE ================= */
        <main className="relative w-full max-w-full overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Header 
            onOpenMap={() => setMapModalOpen(true)}
            onOpenLogin={(tab) => handleOpenLogin(tab || 'staff')}
            onBookClick={handleBookClick}
            onOpenPatientLogin={(phone) => handleOpenPatientLogin(phone)}
            onOpenAndroidApp={() => setAndroidModalOpen(true)}
          />

          {/* Slim Announcement & Offers Strip directly below Header */}
          <AnnouncementStrip 
            onOpenNotice={(notice) => setSelectedAnnouncementNotice(notice)}
            onBookClick={handleBookClick}
          />

          <HeroSection 
            onBookClick={handleBookClick}
            onOpenMap={() => setMapModalOpen(true)}
            onOpenPatientLogin={(phone) => handleOpenPatientLogin(phone)}
            onEditDoctorCard={() => {
              if (role === 'admin') setActiveView('admin');
              else if (role === 'staff') setActiveView('staff');
              else handleOpenLogin('admin');
            }}
          />

          {/* Prominent Featured Offers, Discounts & Notices Section immediately below Hero */}
          <OffersAndNoticesSection 
            onBookClick={(serviceName) => {
              if (serviceName) handleSelectService(serviceName);
              else handleBookClick();
            }}
          />

          <ServicesSection 
            onSelectService={handleSelectService}
            onOpenVideo={(service) => setVideoModalService(service)}
          />

          <OtherDetailsSection 
            onBookClick={handleBookClick}
          />

          <DoctorAboutSection 
            onBookClick={handleBookClick}
          />

          <PhotosGallery />

          <LocationMapSection 
            onBookClick={handleBookClick}
          />

          <ReviewsSection />

          {/* Clean FAQ section (Doctor card after reviews removed per user request) */}
          <AboutAndFaqSection />

          <BookingSection 
            preSelectedService={preSelectedService}
          />

          <Footer 
            onOpenLogin={(tab) => handleOpenLogin(tab || 'staff')}
            onOpenMap={() => setMapModalOpen(true)}
            onOpenPatientLogin={() => handleOpenPatientLogin()}
            onOpenAndroidApp={() => setAndroidModalOpen(true)}
          />

          {/* Floating WhatsApp Quick Action Button on public landing page */}
          <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] right-[max(1rem,calc(env(safe-area-inset-right,0px)+1rem))] z-30 flex flex-col gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="w-13 h-13 sm:w-14 sm:h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative cursor-pointer"
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              <span className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none">
                WhatsApp Us
              </span>
            </a>
          </div>
        </main>
      )}

      {/* ================= SHARED MOBILE BOTTOM NAVIGATION ================= */}
      {/* 
        Strict Rules:
        - Only render in Public Website and Patient Portal
        - NEVER render in Admin Dashboard or Staff Dashboard
        - NEVER render when Staff/Admin Login modal is active
        - Mobile screens only (md:hidden built into component)
      */}
      {(activeView === 'public' || activeView === 'patient') && !loginModalOpen && (
        <MobileBottomNav
          currentView={activeView === 'patient' ? 'patient' : 'public'}
          currentPatient={currentPatient}
          settings={settings}
          onNavigateHome={() => {
            if (activeView === 'patient') {
              setActivePatientTab('reports');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              const homeEl = document.getElementById('home');
              if (homeEl) homeEl.scrollIntoView({ behavior: 'smooth' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onNavigateServices={() => {
            if (activeView === 'patient') {
              setActiveView('public');
              setTimeout(() => {
                const servEl = document.getElementById('services');
                if (servEl) servEl.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            } else {
              const servEl = document.getElementById('services');
              if (servEl) servEl.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onNavigateBooking={() => {
            if (activeView === 'patient') {
              setActiveView('public');
              setTimeout(() => {
                handleBookClick();
              }, 80);
            } else {
              handleBookClick();
            }
          }}
          onNavigateReports={() => {
            if (activeView === 'patient') {
              setActivePatientTab('reports');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (currentPatient) {
              setActiveView('patient');
              setActivePatientTab('reports');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              handleOpenPatientLogin();
            }
          }}
          onNavigateProfile={() => {
            if (!currentPatient) {
              handleOpenPatientLogin();
            }
          }}
          onPatientLogout={() => {
            setCurrentPatient(null);
            setActivePatientId(null);
            setActiveView('public');
          }}
          onOpenWhatsAppPrefs={() => {
            if (activeView !== 'patient') {
              setActiveView('patient');
            }
            setOpenWhatsAppPrefSignal((s) => s + 1);
          }}
          activePatientTab={activePatientTab}
        />
      )}

      {/* ================= MODALS ================= */}
      {loginModalOpen && (
        <LoginModal 
          isOpen={loginModalOpen}
          initialTab={loginModalTab}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={(newRole) => {
            setActiveView(newRole);
            setLoginModalOpen(false);
          }}
        />
      )}

      {patientLoginModalOpen && (
        <PatientLoginModal 
          isOpen={patientLoginModalOpen}
          initialPhone={patientPhoneInitial}
          onClose={() => setPatientLoginModalOpen(false)}
          onLoginSuccess={(patient) => {
            setCurrentPatient(patient);
            setActivePatientId(patient.id || null);
            setPatientLoginModalOpen(false);
            setActiveView('patient');
          }}
        />
      )}

      {mapModalOpen && (
        <MapModal 
          isOpen={mapModalOpen}
          settings={settings}
          onClose={() => setMapModalOpen(false)}
        />
      )}

      {videoModalService && (
        <VideoModal 
          isOpen={!!videoModalService}
          service={videoModalService}
          onClose={() => setVideoModalService(null)}
        />
      )}

      {prescriptionModalOpen && (
        <PrescriptionEditorModal 
          isOpen={prescriptionModalOpen}
          initialPrescription={prescriptionToEdit}
          onClose={() => {
            setPrescriptionModalOpen(false);
            setPrescriptionToEdit(null);
          }}
          onSave={async (prescData) => {
            return await addPrescription(prescData);
          }}
        />
      )}

      {selectedAnnouncementNotice && (
        <NoticeDetailModal
          notice={selectedAnnouncementNotice}
          isOpen={!!selectedAnnouncementNotice}
          onClose={() => setSelectedAnnouncementNotice(null)}
          onBookAppointment={() => {
            if (selectedAnnouncementNotice.applicableServices) {
              handleSelectService(selectedAnnouncementNotice.applicableServices);
            } else {
              handleBookClick();
            }
          }}
        />
      )}

      {/* Android APK & PWA Installation Modal */}
      <AndroidInstallModal
        isOpen={androidModalOpen}
        onClose={() => setAndroidModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Branded Splash Screen Animation Overlay */}
      <SplashScreen isLoading={isLoading} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ClinicProvider>
          <MainApp />
        </ClinicProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
