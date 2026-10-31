import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AdminConfig, AllowedStaff, Patient } from '../types/clinic';

export const INITIAL_SECURITY_QUESTION = "What was the first gift you remember receiving?";
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_CONSECUTIVE_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const AUTH_TOKEN_KEY = 'anujay_clinic_jwt_token';

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Normalizes phone number into clean 10-digit national number
 */
export function extractClean10(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

/**
 * Normalizes user security answer by trimming and lowercasing
 */
export function normalizeSecurityAnswer(answer: string): string {
  return (answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks if account is currently locked out
 */
export function isAccountLocked(lockedUntil?: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

/**
 * Returns remaining lockout time in minutes
 */
export function getRemainingLockoutMinutes(lockedUntil: string): number {
  const diffMs = new Date(lockedUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(diffMs / (60 * 1000)));
}

/**
 * Validates password rules (minimum 12 characters)
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    };
  }
  return { valid: true };
}

/**
 * ============================================================================
 * PATIENT AUTHENTICATION & RECOVERY (Server-Backed via /api/auth/*)
 * ============================================================================
 */

export interface PatientAuthResult {
  success: boolean;
  patients?: Patient[];
  error?: string;
  isLocked?: boolean;
  lockedMinutes?: number;
}

export async function authenticatePatient(phone: string, password: string): Promise<PatientAuthResult> {
  const clean10 = extractClean10(phone);
  if (clean10.length < 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  try {
    const res = await fetch('/api/auth/patient/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: clean10, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Invalid mobile number or password.",
        isLocked: data.isLocked,
        lockedMinutes: data.lockedMinutes
      };
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }

    return {
      success: true,
      patients: data.patients
    };
  } catch (err: any) {
    console.error("Patient auth error:", err);
    return { success: false, error: "Unable to connect to authentication server. Please try again." };
  }
}

export interface PatientRegistrationParams {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  securityAnswer: string;
}

export interface PatientRegistrationResult {
  success: boolean;
  patient?: Patient;
  error?: string;
}

export async function registerPatientAccount(params: PatientRegistrationParams): Promise<PatientRegistrationResult> {
  try {
    const res = await fetch('/api/auth/patient/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Registration failed." };
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }

    return {
      success: true,
      patient: data.patient
    };
  } catch (err: any) {
    console.error("Patient registration error:", err);
    return { success: false, error: "Unable to reach registration service. Please try again." };
  }
}

/**
 * ============================================================================
 * STAFF AUTHENTICATION & RECOVERY
 * ============================================================================
 */

export interface StaffRegistrationParams {
  name: string;
  phone: string;
  role?: string;
  password: string;
  confirmPassword: string;
  securityAnswer: string;
}

export interface StaffRegistrationResult {
  success: boolean;
  status?: 'approved' | 'pending';
  staff?: AllowedStaff;
  error?: string;
  message?: string;
}

export async function registerStaffAccount(params: StaffRegistrationParams): Promise<StaffRegistrationResult> {
  try {
    const res = await fetch('/api/auth/staff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Staff registration failed." };
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }

    return {
      success: true,
      status: data.status,
      message: data.message
    };
  } catch (err: any) {
    console.error("Staff registration error:", err);
    return { success: false, error: "Unable to process staff registration. Please try again." };
  }
}

export interface StaffAuthResult {
  success: boolean;
  staff?: AllowedStaff;
  error?: string;
  isLocked?: boolean;
  lockedMinutes?: number;
}

export async function authenticateStaff(phone: string, password: string): Promise<StaffAuthResult> {
  const clean10 = extractClean10(phone);
  if (clean10.length < 10) {
    return { success: false, error: "Please enter a valid 10-digit mobile number." };
  }

  try {
    const res = await fetch('/api/auth/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: clean10, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Invalid mobile number or password.",
        isLocked: data.isLocked,
        lockedMinutes: data.lockedMinutes
      };
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }

    return {
      success: true,
      staff: data.staff
    };
  } catch (err: any) {
    console.error("Staff auth error:", err);
    return { success: false, error: "Unable to connect to authentication server. Please try again." };
  }
}

/**
 * ============================================================================
 * ADMIN AUTHENTICATION (SEQUENTIAL: Phone -> Step 1 -> Step 2)
 * ============================================================================
 */

export interface AdminPhoneCheckResult {
  verified: boolean;
  error?: string;
  isLocked?: boolean;
  lockedMinutes?: number;
}

export async function verifyAdminPhone(phone: string): Promise<AdminPhoneCheckResult> {
  const clean10 = extractClean10(phone);
  if (clean10.length < 10) {
    return { verified: false, error: "Please enter a valid 10-digit mobile number." };
  }

  try {
    const res = await fetch('/api/auth/admin/verify-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: clean10 })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        verified: false,
        error: data.error || "Administrator mobile number not recognized.",
        isLocked: data.isLocked,
        lockedMinutes: data.lockedMinutes
      };
    }

    return { verified: true };
  } catch (err) {
    console.error("Admin phone verify error:", err);
    return { verified: false, error: "Failed to verify admin number. Please try again." };
  }
}

export async function authenticateAdminInitialPassword(
  phone: string, 
  initialPwd: string
): Promise<{ success: boolean; error?: string; isLocked?: boolean }> {
  try {
    const res = await fetch('/api/auth/admin/verify-step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, initialPassword: initialPwd })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Initial password verification failed.",
        isLocked: data.isLocked
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Admin initial pwd error:", err);
    return { success: false, error: "Verification server error. Please try again." };
  }
}

export async function authenticateAdminFinalPassword(
  phone: string, 
  finalPwd: string
): Promise<{ success: boolean; error?: string; isLocked?: boolean }> {
  try {
    const res = await fetch('/api/auth/admin/verify-step2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, finalPassword: finalPwd })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Final password verification failed.",
        isLocked: data.isLocked
      };
    }

    if (data.token) {
      setStoredAuthToken(data.token);
    }

    return { success: true };
  } catch (err) {
    console.error("Admin final pwd error:", err);
    return { success: false, error: "Verification server error. Please try again." };
  }
}

/**
 * ============================================================================
 * FORGOT PASSWORD & RECOVERY
 * ============================================================================
 */

export interface RecoveryQuestionInfo {
  eligible: boolean;
  question: string;
  version: number;
  error?: string;
  isLocked?: boolean;
}

export async function getActiveSecurityQuestion(): Promise<{ question: string; version: number }> {
  try {
    const adminRef = doc(db, 'admin', 'config');
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      const data = snap.data() as AdminConfig;
      return {
        question: data.securityQuestion || INITIAL_SECURITY_QUESTION,
        version: data.securityQuestionVersion || 1
      };
    }
  } catch (err) {
    console.warn("Could not fetch active security question:", err);
  }
  return { question: INITIAL_SECURITY_QUESTION, version: 1 };
}

export async function getAccountRecoveryInfo(
  role: 'patient' | 'staff' | 'admin',
  phone: string
): Promise<RecoveryQuestionInfo> {
  try {
    const res = await fetch('/api/auth/recovery/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, phone })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        eligible: false,
        question: '',
        version: 0,
        error: data.error || "Account not eligible for online recovery.",
        isLocked: data.isLocked
      };
    }

    return {
      eligible: true,
      question: data.question,
      version: data.version
    };
  } catch (err) {
    console.error("Recovery check error:", err);
    return { eligible: false, question: '', version: 0, error: "Unable to initiate recovery. Please contact clinic desk." };
  }
}

export async function verifyRecoveryAnswer(
  role: 'patient' | 'staff' | 'admin',
  phone: string,
  answer: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/recovery/verify-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, phone, answer })
    });

    const data = await res.json();
    if (!res.ok) {
      return { verified: false, error: data.error || "Incorrect security answer." };
    }

    return { verified: true };
  } catch (err) {
    console.error("Verify recovery answer error:", err);
    return { verified: false, error: "Failed to verify security answer." };
  }
}

export async function resetPasswordWithRecovery(
  role: 'patient' | 'staff' | 'admin',
  phone: string,
  answer: string,
  newPassword: string,
  newFinalPassword?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/recovery/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        phone,
        answer,
        newPassword,
        newFinalPassword
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to update password." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Password reset error:", err);
    return { success: false, error: "Failed to update password. Please try again." };
  }
}

/**
 * Admin Security Question Configuration Update
 */
export async function updateAdminSecurityQuestion(
  adminPhone: string,
  currentInitialPwd: string,
  currentFinalPwd: string,
  newQuestion: string
): Promise<{ success: boolean; error?: string; newVersion?: number }> {
  if (!newQuestion || newQuestion.trim().length < 10) {
    return { success: false, error: "Security question must be at least 10 characters long." };
  }

  // Re-verify both passwords on server
  const step1 = await authenticateAdminInitialPassword(adminPhone, currentInitialPwd);
  if (!step1.success) {
    return { success: false, error: "Current Initial Password verification failed." };
  }

  const step2 = await authenticateAdminFinalPassword(adminPhone, currentFinalPwd);
  if (!step2.success) {
    return { success: false, error: "Current Final Password verification failed." };
  }

  try {
    const { version } = await getActiveSecurityQuestion();
    const newVersion = version + 1;
    const adminRef = doc(db, 'admin', 'config');
    const { updateDoc: updateClientDoc } = await import('firebase/firestore');

    await updateClientDoc(adminRef, {
      securityQuestion: newQuestion.trim(),
      securityQuestionVersion: newVersion,
      updatedAt: new Date().toISOString()
    });

    return { success: true, newVersion };
  } catch (err: any) {
    console.error("Update security question error:", err);
    return { success: false, error: "Failed to update security question in database." };
  }
}

/**
 * Sets individual recovery answer securely on the backend
 */
export async function setIndividualRecoveryAnswer(
  role: 'patient' | 'staff' | 'admin',
  identifier: string,
  currentPassword?: string,
  newAnswer?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/set-recovery-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getStoredAuthToken() ? { 'Authorization': `Bearer ${getStoredAuthToken()}` } : {})
      },
      body: JSON.stringify({ role, identifier, newAnswer })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update recovery answer.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server connection error.' };
  }
}

/**
 * Admin direct password change while authenticated
 */
export async function updateAdminPasswordsDirect(
  adminPhone: string,
  currentInitial: string,
  currentFinal: string,
  newInitial: string,
  newFinal: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/admin/change-passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getStoredAuthToken() ? { 'Authorization': `Bearer ${getStoredAuthToken()}` } : {})
      },
      body: JSON.stringify({
        adminPhone,
        currentInitial,
        currentFinal,
        newInitial,
        newFinal
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update passwords.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server error updating passwords.' };
  }
}

/**
 * Admin change registered phone number (Admin Section Only)
 */
export async function updateAdminPhoneNumber(
  newPhone: string,
  currentInitial: string,
  currentFinal: string
): Promise<{ success: boolean; error?: string; newPhone?: string; message?: string }> {
  try {
    const res = await fetch('/api/auth/admin/update-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getStoredAuthToken() ? { 'Authorization': `Bearer ${getStoredAuthToken()}` } : {})
      },
      body: JSON.stringify({
        newPhone,
        currentInitial,
        currentFinal
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update administrator mobile number.' };
    }
    return { success: true, newPhone: data.newPhone, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Server connection error.' };
  }
}

