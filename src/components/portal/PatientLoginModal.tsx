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
  Users, 
  HelpCircle, 
  KeyRound, 
  ArrowLeft,
  UserCheck,
  UserPlus,
  User
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { Patient } from '../../types/clinic';
import { 
  authenticatePatient, 
  getAccountRecoveryInfo, 
  verifyRecoveryAnswer, 
  resetPasswordWithRecovery,
  extractClean10,
  validatePassword,
  registerPatientAccount,
  getActiveSecurityQuestion,
  INITIAL_SECURITY_QUESTION
} from '../../services/securityAuthService';
import { COMMON_COUNTRY_CODES } from '../../services/FirebasePhoneAuthService';

interface PatientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (patient: Patient) => void;
  initialPhone?: string;
}

export const PatientLoginModal: React.FC<PatientLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialPhone
}) => {
  const { settings } = useClinic();

  // Mode: 'login' | 'signup' | 'forgot_password' | 'select_profile'
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot_password' | 'select_profile'>('login');

  // Login form state
  const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up form state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupSecurityAnswer, setSignupSecurityAnswer] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [centralSecurityQuestion, setCentralSecurityQuestion] = useState(INITIAL_SECURITY_QUESTION);

  // Recovery flow state (Step 1: phone, Step 2: answer, Step 3: new password)
  const [recoveryStep, setRecoveryStep] = useState<'phone' | 'answer' | 'reset'>('phone');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & messages
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matchingPatients, setMatchingPatients] = useState<Patient[]>([]);

  // Sync phone when initialPhone changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPhone) {
        setPhoneNumber(initialPhone.replace(/[^\d\s\-]/g, ''));
        setSignupPhone(initialPhone.replace(/[^\d\s\-]/g, ''));
        setRecoveryPhone(initialPhone.replace(/[^\d\s\-]/g, ''));
      }
      setViewMode('login');
      setPassword('');
      setSignupName('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupSecurityAnswer('');
      setErrorMessage('');
      setSuccessMessage('');
      setRecoveryStep('phone');
      setRecoveryAnswer('');
      setNewPassword('');
      setConfirmPassword('');

      // Fetch latest Admin-configured central security question
      getActiveSecurityQuestion()
        .then(res => {
          if (res?.question) {
            setCentralSecurityQuestion(res.question);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialPhone]);

  if (!isOpen) return null;

  // ==========================================
  // 1. PATIENT LOGIN HANDLER
  // ==========================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean10 = extractClean10(phoneNumber);
    if (clean10.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const authResult = await authenticatePatient(phoneNumber, password);

      if (!authResult.success) {
        setErrorMessage(authResult.error || 'Invalid mobile number or password.');
        setIsLoading(false);
        return;
      }

      const patientsList = authResult.patients || [];
      if (patientsList.length > 1) {
        // Multiple family accounts under the same number
        setMatchingPatients(patientsList);
        setViewMode('select_profile');
      } else if (patientsList.length === 1) {
        onLoginSuccess(patientsList[0]);
        onClose();
      } else {
        setErrorMessage('No patient record found. Please contact the clinic desk.');
      }
    } catch (err: any) {
      console.error('Patient login error:', err);
      setErrorMessage('Authentication failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 2. FORGOT PASSWORD: STEP 1 (SUBMIT PHONE)
  // ==========================================
  const handleRecoveryPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const clean10 = extractClean10(recoveryPhone);
    if (clean10.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const info = await getAccountRecoveryInfo('patient', recoveryPhone);
      if (!info.eligible) {
        setErrorMessage(info.error || 'Account not found or recovery is not available. Please contact clinic desk.');
        setIsLoading(false);
        return;
      }

      setRecoveryQuestion(info.question);
      setRecoveryStep('answer');
    } catch (err) {
      setErrorMessage('Failed to initiate password recovery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 3. FORGOT PASSWORD: STEP 2 (SUBMIT ANSWER)
  // ==========================================
  const handleRecoveryAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!recoveryAnswer.trim()) {
      setErrorMessage('Please enter your answer to the security question.');
      return;
    }

    setIsLoading(true);
    try {
      const verifyCheck = await verifyRecoveryAnswer('patient', recoveryPhone, recoveryAnswer);
      if (!verifyCheck.verified) {
        setErrorMessage(verifyCheck.error || 'Incorrect security answer. Please check and try again.');
        setIsLoading(false);
        return;
      }

      setRecoveryStep('reset');
    } catch (err) {
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 4. FORGOT PASSWORD: STEP 3 (SUBMIT NEW PASSWORD)
  // ==========================================
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const val = validatePassword(newPassword);
    if (!val.valid) {
      setErrorMessage(val.error || 'Password must be at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify and re-type.');
      return;
    }

    setIsLoading(true);
    try {
      const resetRes = await resetPasswordWithRecovery(
        'patient',
        recoveryPhone,
        recoveryAnswer,
        newPassword
      );

      if (!resetRes.success) {
        setErrorMessage(resetRes.error || 'Failed to update password.');
        setIsLoading(false);
        return;
      }

      // Success: return to login view
      setSuccessMessage('Password successfully updated! Please log in with your new password.');
      setPhoneNumber(recoveryPhone);
      setPassword('');
      setViewMode('login');
      setRecoveryStep('phone');
      setRecoveryAnswer('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMessage('Failed to complete password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 5. PATIENT SIGN UP / CREATE ACCOUNT HANDLER
  // ==========================================
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = signupName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const clean10 = extractClean10(signupPhone);
    if (clean10.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const pwdVal = validatePassword(signupPassword);
    if (!pwdVal.valid) {
      setErrorMessage(pwdVal.error || 'Password must be at least 12 characters.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Password and Confirm Password do not match. Please verify.');
      return;
    }

    if (!signupSecurityAnswer.trim() || signupSecurityAnswer.trim().length < 2) {
      setErrorMessage('Please provide an answer to the security recovery question (minimum 2 characters).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerPatientAccount({
        name: trimmedName,
        phone: clean10,
        password: signupPassword,
        confirmPassword: signupConfirmPassword,
        securityAnswer: signupSecurityAnswer.trim()
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Please check your details.');
        setIsLoading(false);
        return;
      }

      if (res.patient) {
        setSuccessMessage('Patient account created successfully! Accessing your portal...');
        setTimeout(() => {
          onLoginSuccess(res.patient!);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      console.error('Patient signup error:', err);
      setErrorMessage('Registration failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = (selected: Patient) => {
    onLoginSuccess(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#00205b] to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md">
            {viewMode === 'signup' ? <UserPlus className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {viewMode === 'forgot_password' 
              ? 'Reset Patient Password' 
              : viewMode === 'signup' 
                ? 'Create Patient Account' 
                : 'Patient Portal Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'forgot_password' 
              ? 'Security-question recovery process for your patient account.' 
              : viewMode === 'signup'
                ? 'Self-register to securely access your personal dental health records.'
                : 'Access your dental records, prescriptions, X-rays, and invoices.'}
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        {(viewMode === 'login' || viewMode === 'signup') && (
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
                if (!signupPhone && phoneNumber) {
                  setSignupPhone(phoneNumber);
                }
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Success Notice */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: NORMAL PATIENT LOGIN (PHONE + PASSWORD)                */}
        {/* ============================================================== */}
        {viewMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Phone Number Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registered Mobile Number
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

            {/* Password Field with Show/Hide toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Account Password
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password (min 12 characters)"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Minimum 12 characters. Account locks after 5 consecutive failed attempts.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim() || !password}
              className="w-full py-3 bg-gradient-to-r from-[#00205b] to-blue-700 hover:from-[#001740] hover:to-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Log In to Patient Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Sign Up */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                New patient at Dr. Anujay's Clinic?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                    if (!signupPhone && phoneNumber) {
                      setSignupPhone(phoneNumber);
                    }
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Create an Account
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 1B: PATIENT SIGN UP / CREATE ACCOUNT                      */}
        {/* ============================================================== */}
        {viewMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            {/* Field 1: Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Field 2: Registered Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Mobile Number <span className="text-rose-500">*</span>
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
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
                    placeholder="98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition tracking-wide"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Normalized to 10 digits. Used to prevent duplicate accounts.
              </span>
            </div>

            {/* Field 3: Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span> (min 12 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 12 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(p => !p)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 4: Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  required
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Re-enter same password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupConfirmPassword(p => !p)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 5: Central Security Question & User Answer */}
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Security Question (Admin Configured)
                  </span>
                  <p className="text-xs font-bold text-purple-950 mt-0.5">
                    "{centralSecurityQuestion}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Your Answer <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-purple-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={signupSecurityAnswer}
                    onChange={(e) => setSignupSecurityAnswer(e.target.value)}
                    placeholder="Enter your confidential answer"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                  />
                </div>
                <span className="text-[10px] text-purple-800/80 mt-1 block">
                  Stored as a secure cryptographic hash. Used to recover your account if you forget your password.
                </span>
              </div>
            </div>

            {/* Transparency Note */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-relaxed">
              • Access Isolation: You will only have access to your own records created with this account.
              <br />
              • Phone Verification: Since SMS OTP is not enabled, phone ownership is unverified initially; authentication is secured by your chosen password and recovery answer.
            </div>

            <button
              type="submit"
              disabled={isLoading || !signupName.trim() || !signupPhone.trim() || !signupPassword || !signupConfirmPassword || !signupSecurityAnswer.trim()}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-[#00205b] hover:from-sky-700 hover:to-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Patient Account</span>
                </>
              )}
            </button>

            {/* Switch to Sign In */}
            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Sign In to Patient Portal
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: FORGOT PASSWORD RECOVERY (SECURITY QUESTION)           */}
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
              <span>Back to Patient Login</span>
            </button>

            {/* STEP A: ENTER REGISTERED PHONE */}
            {recoveryStep === 'phone' && (
              <form onSubmit={handleRecoveryPhoneSubmit} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Account Recovery</span>
                    <p className="text-blue-950/80 text-[11px] mt-0.5">
                      Enter your registered 10-digit mobile number to verify your security question.
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
                  disabled={isLoading || !recoveryPhone.trim()}
                  className="w-full py-3 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking Account...</span>
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

            {/* STEP B: ANSWER CONFIGURED SECURITY QUESTION */}
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
                    Answer is case-insensitive and normalized securely.
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
                    disabled={isLoading || !recoveryAnswer.trim()}
                    className="flex-1 py-2.5 bg-[#00205b] hover:bg-[#001740] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
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

            {/* STEP C: ENTER NEW PASSWORD (MIN 12 CHARS) */}
            {recoveryStep === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Security answer verified! Enter your new password below.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 12 characters"
                      required
                      autoFocus
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(p => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must be at least 12 characters.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 12 || newPassword !== confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>Save New Password & Return to Login</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: MULTIPLE PROFILES SELECTION                            */}
        {/* ============================================================== */}
        {viewMode === 'select_profile' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2 text-xs text-blue-900">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Multiple patient profiles are registered with this phone number. Choose whose records to open:</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {matchingPatients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProfile(p)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm group-hover:bg-blue-600 group-hover:text-white transition">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500">
                        {p.age} Yrs • {p.gender} • {p.totalVisits} clinic {p.totalVisits === 1 ? 'visit' : 'visits'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1">
          <p>Protected by Secure Role-Based Authentication & Lockout Protection.</p>
          <p className="text-[10px]">
            Need help? Contact clinic reception at <strong className="text-slate-700">{settings.phone || '+91 98765 43210'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
