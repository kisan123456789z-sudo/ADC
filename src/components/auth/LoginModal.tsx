import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  Globe, 
  Stethoscope, 
  HelpCircle, 
  KeyRound, 
  ArrowLeft,
  UserCheck,
  UserPlus,
  User,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  verifyAdminPhone,
  authenticateAdminInitialPassword,
  authenticateAdminFinalPassword,
  getAccountRecoveryInfo,
  verifyRecoveryAnswer,
  resetPasswordWithRecovery,
  extractClean10,
  validatePassword,
  registerStaffAccount,
  getActiveSecurityQuestion,
  INITIAL_SECURITY_QUESTION
} from '../../services/securityAuthService';
import { COMMON_COUNTRY_CODES } from '../../services/FirebasePhoneAuthService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'staff' | 'admin';
  onLoginSuccess?: (role: 'staff' | 'admin') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'staff',
  onLoginSuccess
}) => {
  const { 
    loginStaffWithPassword, 
    loginAdminSuccess, 
    adminConfig 
  } = useAuth();

  // Tab: 'staff' | 'admin'
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>(initialTab);

  // Mode: 'login' | 'signup' | 'forgot_password'
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Country Code & Phone
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Staff Login State
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Staff Sign Up State (Admin-Controlled / Pending Authorization)
  const [staffSignupName, setStaffSignupName] = useState('');
  const [staffSignupPhone, setStaffSignupPhone] = useState('');
  const [staffSignupRole, setStaffSignupRole] = useState('Clinical Assistant');
  const [staffSignupPassword, setStaffSignupPassword] = useState('');
  const [staffSignupConfirmPassword, setStaffSignupConfirmPassword] = useState('');
  const [staffSignupSecurityAnswer, setStaffSignupSecurityAnswer] = useState('');
  const [showStaffSignupPassword, setShowStaffSignupPassword] = useState(false);
  const [showStaffSignupConfirmPassword, setShowStaffSignupConfirmPassword] = useState(false);
  const [centralSecurityQuestion, setCentralSecurityQuestion] = useState(INITIAL_SECURITY_QUESTION);

  // Admin Sequential Login State (Step 1: phone, Step 2: initial password, Step 3: final password)
  const [adminLoginStep, setAdminLoginStep] = useState<1 | 2 | 3>(1);
  const [adminInitialPassword, setAdminInitialPassword] = useState('');
  const [showAdminInitialPassword, setShowAdminInitialPassword] = useState(false);
  const [adminFinalPassword, setAdminFinalPassword] = useState('');
  const [showAdminFinalPassword, setShowAdminFinalPassword] = useState(false);

  // Forgot Password / Recovery Flow State
  const [recoveryStep, setRecoveryStep] = useState<'phone' | 'answer' | 'reset'>('phone');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');

  // Staff Password Reset
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [confirmStaffPassword, setConfirmStaffPassword] = useState('');
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);

  // Admin Dual-Password Reset
  const [newAdminInitial, setNewAdminInitial] = useState('');
  const [confirmAdminInitial, setConfirmAdminInitial] = useState('');
  const [newAdminFinal, setNewAdminFinal] = useState('');
  const [confirmAdminFinal, setConfirmAdminFinal] = useState('');
  const [showNewAdminPasswords, setShowNewAdminPasswords] = useState(false);

  // Status & Messages
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset state on open or tab switch
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setViewMode('login');
      setAdminLoginStep(1);
      setStaffPassword('');
      setStaffSignupName('');
      setStaffSignupPassword('');
      setStaffSignupConfirmPassword('');
      setStaffSignupSecurityAnswer('');
      setAdminInitialPassword('');
      setAdminFinalPassword('');
      setErrorMessage('');
      setSuccessMessage('');
      setRecoveryStep('phone');
      setRecoveryAnswer('');

      // Fetch central security question
      getActiveSecurityQuestion()
        .then(res => {
          if (res?.question) {
            setCentralSecurityQuestion(res.question);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Switch role tabs
  const handleTabSwitch = (tab: 'staff' | 'admin') => {
    setActiveTab(tab);
    setViewMode('login');
    setAdminLoginStep(1);
    setStaffPassword('');
    setAdminInitialPassword('');
    setAdminFinalPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setRecoveryStep('phone');
  };

  // ==============================================================
  // 1. STAFF LOGIN HANDLER (Phone + Password)
  // ==============================================================
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean10 = extractClean10(phoneNumber);
    if (clean10.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!staffPassword) {
      setErrorMessage('Please enter your staff account password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginStaffWithPassword(phoneNumber, staffPassword);
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess('staff');
        } else {
          onClose();
        }
      } else {
        setErrorMessage(res.error || 'Invalid staff mobile number or password.');
      }
    } catch (err: any) {
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // 1B. STAFF SIGN UP HANDLER (Admin-Controlled / Pending Flow)
  // ==============================================================
  const handleStaffSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = staffSignupName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter staff member's full name (minimum 2 characters).");
      return;
    }

    const clean10 = extractClean10(staffSignupPhone);
    if (clean10.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const val = validatePassword(staffSignupPassword);
    if (!val.valid) {
      setErrorMessage(val.error || 'Password must be at least 12 characters.');
      return;
    }

    if (staffSignupPassword !== staffSignupConfirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    if (!staffSignupSecurityAnswer.trim() || staffSignupSecurityAnswer.trim().length < 2) {
      setErrorMessage('Please answer the central security question (minimum 2 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerStaffAccount({
        name: trimmedName,
        phone: clean10,
        role: staffSignupRole,
        password: staffSignupPassword,
        confirmPassword: staffSignupConfirmPassword,
        securityAnswer: staffSignupSecurityAnswer.trim()
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Staff registration request failed.');
        setIsSubmitting(false);
        return;
      }

      if (res.status === 'approved') {
        setSuccessMessage('Your pre-authorized staff account has been activated! Please log in with your credentials.');
      } else {
        setSuccessMessage('Staff registration request submitted! Your account is pending Admin approval. The clinic administrator has been notified to authorize your access.');
      }

      setPhoneNumber(clean10);
      setViewMode('login');
    } catch (err: any) {
      console.error('Staff signup error:', err);
      setErrorMessage('Failed to submit staff registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // 2. ADMIN SEQUENTIAL LOGIN HANDLERS (Step 1 -> Step 2 -> Step 3)
  // ==============================================================

  // Step 1: Verify Registered Admin Phone
  const handleAdminPhoneStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean10 = extractClean10(phoneNumber);
    if (clean10.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const check = await verifyAdminPhone(phoneNumber);
      if (!check.verified) {
        setErrorMessage(check.error || 'Administrator mobile number not recognized.');
        setIsSubmitting(false);
        return;
      }

      // Step 1 Passed -> Proceed to Step 2 (Initial Password)
      setAdminLoginStep(2);
    } catch (err) {
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Admin Initial Password
  const handleAdminInitialStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adminInitialPassword) {
      setErrorMessage('Please enter the Administrator Initial Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const check = await authenticateAdminInitialPassword(phoneNumber, adminInitialPassword);
      if (!check.success) {
        setErrorMessage(check.error || 'Invalid Initial Password.');
        setIsSubmitting(false);
        return;
      }

      // Step 2 Passed -> Proceed to Step 3 (Final Password)
      setAdminLoginStep(3);
    } catch (err) {
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Verify Admin Final Password & Enter Dashboard
  const handleAdminFinalStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adminFinalPassword) {
      setErrorMessage('Please enter the Administrator Final Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const check = await authenticateAdminFinalPassword(phoneNumber, adminFinalPassword);
      if (!check.success) {
        setErrorMessage(check.error || 'Invalid Final Password.');
        setIsSubmitting(false);
        return;
      }

      // Complete Success -> Grant Admin Role and open dashboard
      loginAdminSuccess();
      if (onLoginSuccess) {
        onLoginSuccess('admin');
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================================================
  // 3. FORGOT PASSWORD RECOVERY HANDLERS (Staff & Admin)
  // ==============================================================

  // Step A: Submit Phone Number
  const handleRecoveryPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean10 = extractClean10(recoveryPhone);
    if (clean10.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const info = await getAccountRecoveryInfo(activeTab, recoveryPhone);
      if (!info.eligible) {
        setErrorMessage(info.error || 'Account not eligible for online recovery.');
        setIsSubmitting(false);
        return;
      }

      setRecoveryQuestion(info.question);
      setRecoveryStep('answer');
    } catch (err) {
      setErrorMessage('Failed to initiate recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step B: Submit Security Answer
  const handleRecoveryAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!recoveryAnswer.trim()) {
      setErrorMessage('Please enter your security answer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const verifyCheck = await verifyRecoveryAnswer(activeTab, recoveryPhone, recoveryAnswer);
      if (!verifyCheck.verified) {
        setErrorMessage(verifyCheck.error || 'Incorrect security answer.');
        setIsSubmitting(false);
        return;
      }

      setRecoveryStep('reset');
    } catch (err) {
      setErrorMessage('Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step C: Reset Password (Staff single pwd, Admin dual pwd)
  const handleRecoveryResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'staff') {
      const val = validatePassword(newStaffPassword);
      if (!val.valid) {
        setErrorMessage(val.error || 'Password must be at least 12 characters.');
        return;
      }
      if (newStaffPassword !== confirmStaffPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await resetPasswordWithRecovery('staff', recoveryPhone, recoveryAnswer, newStaffPassword);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to reset password.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage('Staff password reset successfully! Please log in with your new password.');
        setPhoneNumber(recoveryPhone);
        setStaffPassword('');
        setViewMode('login');
        setRecoveryStep('phone');
      } catch (err) {
        setErrorMessage('Failed to reset password.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Admin: Initial and Final passwords
      const valInitial = validatePassword(newAdminInitial);
      if (!valInitial.valid) {
        setErrorMessage(`Initial ${valInitial.error}`);
        return;
      }
      if (newAdminInitial !== confirmAdminInitial) {
        setErrorMessage('Initial password confirmation does not match.');
        return;
      }

      const valFinal = validatePassword(newAdminFinal);
      if (!valFinal.valid) {
        setErrorMessage(`Final ${valFinal.error}`);
        return;
      }
      if (newAdminFinal !== confirmAdminFinal) {
        setErrorMessage('Final password confirmation does not match.');
        return;
      }

      if (newAdminInitial.trim() === newAdminFinal.trim()) {
        setErrorMessage('Initial Password and Final Password cannot be identical. They must be two distinct credentials.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await resetPasswordWithRecovery(
          'admin',
          recoveryPhone,
          recoveryAnswer,
          newAdminInitial,
          newAdminFinal
        );

        if (!res.success) {
          setErrorMessage(res.error || 'Failed to reset admin passwords.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage('Admin credentials successfully updated! Please log in using the sequential verification.');
        setPhoneNumber(recoveryPhone);
        setAdminLoginStep(1);
        setAdminInitialPassword('');
        setAdminFinalPassword('');
        setViewMode('login');
        setRecoveryStep('phone');
      } catch (err) {
        setErrorMessage('Failed to reset credentials.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-br from-[#00205b] via-[#002e80] to-blue-900 text-white text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            {activeTab === 'admin' ? (
              <ShieldCheck className="w-7 h-7 text-sky-300" />
            ) : viewMode === 'signup' ? (
              <UserPlus className="w-7 h-7 text-sky-300" />
            ) : (
              <Stethoscope className="w-7 h-7 text-sky-300" />
            )}
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {viewMode === 'forgot_password' 
              ? (activeTab === 'admin' ? 'Recover Admin Credentials' : 'Reset Staff Password')
              : activeTab === 'admin' 
                ? 'Clinic Administrator Portal' 
                : (viewMode === 'signup' ? 'Staff Registration Request' : 'Clinic Staff Login')}
          </h2>
          <p className="text-xs text-sky-200/80 mt-1">
            {activeTab === 'admin' 
              ? 'Sequential 3-factor authentication: Phone → Initial Password → Final Password' 
              : viewMode === 'signup'
                ? 'Submit pending registration for Super Admin authorization'
                : 'Registered mobile number & password authentication'}
          </p>

          {/* Role Switcher Tabs */}
          {viewMode !== 'forgot_password' && (
            <div className="flex bg-black/25 p-1 rounded-xl mt-4 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => handleTabSwitch('staff')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                Staff Portal
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('admin')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                Super Admin
              </button>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">

          {/* Mode Sub-Toggle for Staff (Sign In vs Sign Up) */}
          {activeTab === 'staff' && viewMode !== 'forgot_password' && (
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Staff Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                  if (!staffSignupPhone && phoneNumber) {
                    setStaffSignupPhone(phoneNumber);
                  }
                }}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                  viewMode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Request Staff Account</span>
              </button>
            </div>
          )}

          {/* Super Admin No Public Sign Up Pill */}
          {activeTab === 'admin' && viewMode !== 'forgot_password' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Administrator Security Policy</span>
                <p className="text-amber-800 text-[10px] mt-0.5">
                  Public Super Admin sign up is strictly restricted. Only provisioned administrator accounts with sequential verification (Phone → Initial Password → Final Password) may log in.
                </p>
              </div>
            </div>
          )}
          
          {/* Success Notice */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {successMessage}
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: STAFF PORTAL LOGIN (Phone + Password)                   */}
          {/* ============================================================== */}
          {viewMode === 'login' && activeTab === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Staff Mobile Number
                </label>
                
                <div className="flex gap-2">
                  <div className="relative w-28 shrink-0">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="w-full py-2.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      {COMMON_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                  </div>

                  <div className="relative flex-1">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                      placeholder="98765 43210"
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-wide"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Staff Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot_password');
                      setRecoveryPhone(phoneNumber);
                      setRecoveryStep('phone');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter staff password (min 12 chars)"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimum 12 characters. Locks for 15 minutes after 5 failed attempts.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !phoneNumber.trim() || !staffPassword}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Staff Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to Staff Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  New staff member at Dr. Anujay Clinic?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('signup');
                      setErrorMessage('');
                      setSuccessMessage('');
                      if (!staffSignupPhone && phoneNumber) {
                        setStaffSignupPhone(phoneNumber);
                      }
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Request Staff Registration
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 1B: STAFF SIGN UP / REGISTRATION (Admin-Controlled)       */}
          {/* ============================================================== */}
          {viewMode === 'signup' && activeTab === 'staff' && (
            <form onSubmit={handleStaffSignup} className="space-y-3.5">
              {/* Staff Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={staffSignupName}
                    onChange={(e) => setStaffSignupName(e.target.value)}
                    placeholder="e.g. Dr. Priya Singh or Nurse Anjali"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Staff Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative w-28 shrink-0">
                    <select
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="w-full py-2.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      {COMMON_COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.dialCode}>
                          {c.flag} {c.dialCode}
                        </option>
                      ))}
                    </select>
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                  </div>

                  <div className="relative flex-1">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={staffSignupPhone}
                      onChange={(e) => setStaffSignupPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
                      placeholder="98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-wide"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Normalized to 10 digits. Used for Admin approval and identification.
                </span>
              </div>

              {/* Role / Designation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Clinical Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={staffSignupRole}
                    onChange={(e) => setStaffSignupRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer appearance-none"
                  >
                    <option value="Clinical Assistant">Clinical Assistant</option>
                    <option value="Associate Dentist">Associate Dentist</option>
                    <option value="Dental Hygienist">Dental Hygienist</option>
                    <option value="Front Desk / Receptionist">Front Desk / Receptionist</option>
                    <option value="Lab Technician">Dental Lab Technician</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Staff cannot assign themselves Administrator permissions.
                </span>
              </div>

              {/* Staff Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span> (min 12 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showStaffSignupPassword ? 'text' : 'password'}
                    required
                    value={staffSignupPassword}
                    onChange={(e) => setStaffSignupPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffSignupPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showStaffSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showStaffSignupConfirmPassword ? 'text' : 'password'}
                    required
                    value={staffSignupConfirmPassword}
                    onChange={(e) => setStaffSignupConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffSignupConfirmPassword(p => !p)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    {showStaffSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Central Security Question & Staff Answer */}
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                      Central Recovery Question (Configured by Admin)
                    </span>
                    <p className="text-xs font-bold text-purple-950 mt-0.5">
                      "{centralSecurityQuestion}"
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Your Recovery Answer <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-purple-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={staffSignupSecurityAnswer}
                      onChange={(e) => setStaffSignupSecurityAnswer(e.target.value)}
                      placeholder="Enter memorable security answer"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                    />
                  </div>
                  <span className="text-[10px] text-purple-800/80 mt-1 block">
                    Cryptographically hashed with salt. Stored securely for staff password recovery.
                  </span>
                </div>
              </div>

              {/* Controlled Authorization Notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-relaxed">
                <span className="font-bold block">Admin Authorization Required:</span>
                Staff registration does NOT grant immediate access. If your mobile number was not already pre-approved by the Admin, your account will be created as <strong>Pending</strong>. You will only be able to sign in once the Clinic Super Admin authorizes and activates your account.
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !staffSignupName.trim() || !staffSignupPhone.trim() || !staffSignupPassword || !staffSignupConfirmPassword || !staffSignupSecurityAnswer.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Staff Registration...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Staff Registration Request</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Already have an authorized staff account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Staff Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: ADMIN SEQUENTIAL LOGIN (Phone -> Initial -> Final)      */}
          {/* ============================================================== */}
          {viewMode === 'login' && activeTab === 'admin' && (
            <div className="space-y-4">
              
              {/* Step Tracker Indicator */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold">
                <div className={`flex items-center gap-1.5 ${adminLoginStep >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${adminLoginStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                  <span>Phone</span>
                </div>
                <span className="text-slate-300">→</span>
                <div className={`flex items-center gap-1.5 ${adminLoginStep >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${adminLoginStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                  <span>Initial Pwd</span>
                </div>
                <span className="text-slate-300">→</span>
                <div className={`flex items-center gap-1.5 ${adminLoginStep >= 3 ? 'text-blue-700' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${adminLoginStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                  <span>Final Pwd</span>
                </div>
              </div>

              {/* STEP 1: PHONE NUMBER */}
              {adminLoginStep === 1 && (
                <form onSubmit={handleAdminPhoneStep} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Administrator Mobile Number
                    </label>

                    <div className="flex gap-2">
                      <div className="relative w-28 shrink-0">
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => setSelectedCountryCode(e.target.value)}
                          className="w-full py-2.5 pl-2 pr-6 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                        >
                          {COMMON_COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.dialCode}>
                              {c.flag} {c.dialCode}
                            </option>
                          ))}
                        </select>
                        <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3.5 pointer-events-none" />
                      </div>

                      <div className="relative flex-1">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ''))}
                          placeholder="98765 43210"
                          required
                          autoFocus
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-wide"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot_password');
                        setRecoveryPhone(phoneNumber || '7692808120');
                        setRecoveryStep('phone');
                        setErrorMessage('');
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Forgot Admin Passwords?
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !phoneNumber.trim()}
                      className="py-2.5 px-5 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Phone Number</span>}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: INITIAL PASSWORD */}
              {adminLoginStep === 2 && (
                <form onSubmit={handleAdminInitialStep} className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Admin Mobile</span>
                      <strong className="text-slate-900 font-mono">+91 {extractClean10(phoneNumber)}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminLoginStep(1)}
                      className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Change Phone
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Enter Initial Password (Credential 1 of 2)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showAdminInitialPassword ? 'text' : 'password'}
                        value={adminInitialPassword}
                        onChange={(e) => setAdminInitialPassword(e.target.value)}
                        placeholder="Enter Initial Password (min 12 chars)"
                        required
                        autoFocus
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminInitialPassword(p => !p)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        {showAdminInitialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      First gate credential. The Final Password field will be shown after this passes.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot_password');
                        setRecoveryPhone(phoneNumber);
                        setRecoveryStep('phone');
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Forgot Passwords?
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !adminInitialPassword}
                      className="py-2.5 px-5 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Initial Password</span>}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: FINAL PASSWORD */}
              {adminLoginStep === 3 && (
                <form onSubmit={handleAdminFinalStep} className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Initial Password Verified. Enter Final Password below.</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Enter Final Password (Credential 2 of 2)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showAdminFinalPassword ? 'text' : 'password'}
                        value={adminFinalPassword}
                        onChange={(e) => setAdminFinalPassword(e.target.value)}
                        placeholder="Enter Final Password (min 12 chars)"
                        required
                        autoFocus
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminFinalPassword(p => !p)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        {showAdminFinalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Second gate credential. Must differ from Initial Password.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setAdminLoginStep(2)}
                      className="text-xs font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      ← Back to Initial Password
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || !adminFinalPassword}
                      className="py-3 px-6 bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-sky-200" />
                          <span>Unlock Admin Dashboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: FORGOT PASSWORD RECOVERY (STAFF & ADMIN)                 */}
          {/* ============================================================== */}
          {viewMode === 'forgot_password' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage('');
                  setRecoveryStep('phone');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {activeTab === 'admin' ? 'Admin' : 'Staff'} Login</span>
              </button>

              {/* RECOVERY STEP 1: PHONE */}
              {recoveryStep === 'phone' && (
                <form onSubmit={handleRecoveryPhoneSubmit} className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{activeTab === 'admin' ? 'Admin Security Recovery' : 'Staff Account Recovery'}</span>
                      <p className="text-blue-950/80 text-[11px] mt-0.5">
                        Enter your registered 10-digit mobile number to verify against the clinic recovery configuration.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={recoveryPhone}
                        onChange={(e) => setRecoveryPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
                        placeholder="98765 43210"
                        required
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !recoveryPhone.trim()}
                    className="w-full py-3 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking Account Eligibility...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Security Question</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* RECOVERY STEP 2: ANSWER SECURITY QUESTION */}
              {recoveryStep === 'answer' && (
                <form onSubmit={handleRecoveryAnswerSubmit} className="space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Security Question
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-snug">
                      "{recoveryQuestion}"
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Secret Answer
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={recoveryAnswer}
                        onChange={(e) => setRecoveryAnswer(e.target.value)}
                        placeholder="Enter your security answer"
                        required
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Answers are normalized and verified via secure hash.
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecoveryStep('phone')}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !recoveryAnswer.trim()}
                      className="flex-1 py-2.5 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Answer...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Security Answer</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* RECOVERY STEP 3: RESET CREDENTIALS */}
              {recoveryStep === 'reset' && (
                <form onSubmit={handleRecoveryResetSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Security answer verified! Enter your new credentials below.</span>
                  </div>

                  {activeTab === 'staff' ? (
                    /* Staff New Password */
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          New Staff Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type={showNewStaffPassword ? 'text' : 'password'}
                            value={newStaffPassword}
                            onChange={(e) => setNewStaffPassword(e.target.value)}
                            placeholder="Min 12 characters"
                            required
                            autoFocus
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewStaffPassword(p => !p)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                          >
                            {showNewStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">Minimum 12 characters.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type={showNewStaffPassword ? 'text' : 'password'}
                            value={confirmStaffPassword}
                            onChange={(e) => setConfirmStaffPassword(e.target.value)}
                            placeholder="Confirm password"
                            required
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Admin Dual Passwords Reset (Initial & Final must be distinct) */
                    <div className="space-y-3">
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                        Admin recovery requires setting both the <strong>Initial Password</strong> and <strong>Final Password</strong>. They cannot be identical.
                      </div>

                      {/* Initial Password Fields */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          New Initial Password (Min 12 chars)
                        </label>
                        <input
                          type={showNewAdminPasswords ? 'text' : 'password'}
                          value={newAdminInitial}
                          onChange={(e) => setNewAdminInitial(e.target.value)}
                          placeholder="New Initial Password"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirm Initial Password
                        </label>
                        <input
                          type={showNewAdminPasswords ? 'text' : 'password'}
                          value={confirmAdminInitial}
                          onChange={(e) => setConfirmAdminInitial(e.target.value)}
                          placeholder="Re-type Initial Password"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                        />
                      </div>

                      {/* Final Password Fields */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          New Final Password (Must differ from Initial)
                        </label>
                        <input
                          type={showNewAdminPasswords ? 'text' : 'password'}
                          value={newAdminFinal}
                          onChange={(e) => setNewAdminFinal(e.target.value)}
                          placeholder="New Final Password"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirm Final Password
                        </label>
                        <input
                          type={showNewAdminPasswords ? 'text' : 'password'}
                          value={confirmAdminFinal}
                          onChange={(e) => setConfirmAdminFinal(e.target.value)}
                          placeholder="Re-type Final Password"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowNewAdminPasswords(p => !p)}
                        className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        {showNewAdminPasswords ? 'Hide passwords' : 'Show passwords'}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>Save New Credentials & Return to Login</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
