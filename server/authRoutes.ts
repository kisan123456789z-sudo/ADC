import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';
import {
  serverDb,
  extractClean10,
  hashPassword,
  comparePassword,
  hashAnswer,
  compareAnswer,
  generateToken,
  verifyToken,
  isAccountLocked,
  getRemainingLockoutMinutes,
  getCentralSecurityQuestion,
  MIN_PASSWORD_LENGTH,
  MAX_CONSECUTIVE_ATTEMPTS,
  LOCKOUT_DURATION_MS
} from './authService';

const router = express.Router();

// Rate Limiters with proxy validation overrides for Cloud Run / AI Studio preview environment
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 requests per 15 min window
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
});

export const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: { error: 'Too many password recovery attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Registration limit reached for this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
});

// Helper to legacy hash for safe migration
async function legacySha256(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${value}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * ============================================================================
 * 1. PATIENT AUTHENTICATION & REGISTRATION
 * ============================================================================
 */

// POST /api/auth/patient/login
router.post('/patient/login', authLimiter, async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || clean10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    const patientsCol = collection(serverDb, 'patients');
    const snap = await getDocs(patientsCol);
    const matchedDocs = snap.docs.filter(d => extractClean10(d.data().phone || '') === clean10);

    if (matchedDocs.length === 0) {
      return res.status(401).json({ error: 'Invalid mobile number or password.' });
    }

    const primaryDoc = matchedDocs[0];
    const data = primaryDoc.data();

    // Check account lockout
    if (isAccountLocked(data.lockedUntil)) {
      const mins = getRemainingLockoutMinutes(data.lockedUntil);
      return res.status(423).json({ 
        error: `Account is locked due to multiple failed attempts. Try again in ${mins} minute(s) or use Forgot Password.`,
        isLocked: true,
        lockedMinutes: mins
      });
    }

    const storedHash = data.passwordHash || '';
    let isMatch = false;

    // Check with bcrypt
    if (storedHash.startsWith('$2')) {
      isMatch = await comparePassword(password, storedHash);
    } else if (storedHash) {
      // Legacy migration check
      const legacyCandidate = await legacySha256(password, 'patient_pwd_salt');
      if (legacyCandidate === storedHash) {
        isMatch = true;
        // Upgrade to bcrypt immediately
        const upgradedBcrypt = await hashPassword(password);
        await updateDoc(doc(serverDb, 'patients', primaryDoc.id), {
          passwordHash: upgradedBcrypt
        }).catch(() => {});
      }
    }

    if (!isMatch) {
      const newAttempts = (data.failedAttempts || 0) + 1;
      const willLock = newAttempts >= MAX_CONSECUTIVE_ATTEMPTS;
      const lockedUntil = willLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

      await updateDoc(doc(serverDb, 'patients', primaryDoc.id), {
        failedAttempts: willLock ? 0 : newAttempts,
        lockedUntil
      }).catch(() => {});

      if (willLock) {
        return res.status(423).json({
          error: 'Account locked for 15 minutes after 5 consecutive failed attempts.',
          isLocked: true,
          lockedMinutes: 15
        });
      }

      return res.status(401).json({
        error: `Invalid mobile number or password. (${newAttempts}/${MAX_CONSECUTIVE_ATTEMPTS} attempts)`
      });
    }

    // Success: reset lockout
    await updateDoc(doc(serverDb, 'patients', primaryDoc.id), {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString()
    }).catch(() => {});

    const patientList = matchedDocs.map(d => ({
      id: d.id,
      ...d.data(),
      passwordHash: undefined,
      recoveryAnswerHash: undefined
    }));

    const token = generateToken({
      uid: primaryDoc.id,
      phone: clean10,
      role: 'patient',
      name: data.name,
      patientId: primaryDoc.id
    }, '24h');

    return res.json({
      success: true,
      token,
      patients: patientList
    });
  } catch (err: any) {
    console.error('Patient login server error:', err);
    return res.status(500).json({ error: 'Authentication service temporarily unavailable.' });
  }
});

// POST /api/auth/patient/register
router.post('/patient/register', registerLimiter, async (req: Request, res: Response) => {
  const { name, phone, password, confirmPassword, securityAnswer } = req.body;

  const trimmedName = (name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    return res.status(400).json({ error: 'Please enter your full name (minimum 2 characters).' });
  }

  const clean10 = extractClean10(phone);
  if (clean10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
  }

  const trimmedAnswer = (securityAnswer || '').trim();
  if (!trimmedAnswer || trimmedAnswer.length < 2) {
    return res.status(400).json({ error: 'Please provide a valid security answer (minimum 2 characters).' });
  }

  try {
    const patientsCol = collection(serverDb, 'patients');
    const snap = await getDocs(patientsCol);
    const existing = snap.docs.find(d => {
      const data = d.data();
      return extractClean10(data.phone || '') === clean10 && (data.hasAccount === true || !!data.passwordHash);
    });

    if (existing) {
      return res.status(409).json({
        error: `An account is already registered with mobile number +91 ${clean10}. Please Sign In or use Forgot Password.`
      });
    }

    const passwordHash = await hashPassword(password);
    const recoveryAnswerHash = await hashAnswer(trimmedAnswer);
    const { version } = await getCentralSecurityQuestion();

    const newPatientData = {
      name: trimmedName,
      phone: clean10,
      age: 30,
      gender: 'Other',
      address: 'Self-Registered Online Patient',
      notes: 'Account created via Patient Portal self-registration.',
      totalVisits: 0,
      lastVisit: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      passwordHash,
      recoveryAnswerHash,
      recoveryQuestionVersion: version,
      failedAttempts: 0,
      lockedUntil: null,
      hasAccount: true,
      registeredOnline: true
    };

    const docRef = await addDoc(patientsCol, newPatientData);

    const token = generateToken({
      uid: docRef.id,
      phone: clean10,
      role: 'patient',
      name: trimmedName,
      patientId: docRef.id
    }, '24h');

    return res.status(201).json({
      success: true,
      token,
      patient: {
        id: docRef.id,
        ...newPatientData,
        passwordHash: undefined,
        recoveryAnswerHash: undefined
      }
    });
  } catch (err: any) {
    console.error('Patient registration server error:', err);
    return res.status(500).json({ error: 'Unable to complete patient registration.' });
  }
});

/**
 * ============================================================================
 * 2. STAFF AUTHENTICATION & REGISTRATION
 * ============================================================================
 */

// POST /api/auth/staff/login
router.post('/staff/login', authLimiter, async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || clean10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    const staffCol = collection(serverDb, 'allowed_staff');
    const snap = await getDocs(staffCol);
    const matchedDoc = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);

    if (!matchedDoc) {
      return res.status(401).json({ error: 'Invalid mobile number or password.' });
    }

    const staffData = matchedDoc.data();

    if (staffData.isPendingApproval || staffData.status === 'pending') {
      return res.status(403).json({
        error: 'Your staff account registration is pending Admin authorization. Access is restricted until approved.'
      });
    }

    if (staffData.active === false) {
      return res.status(403).json({
        error: 'Your staff account has been deactivated. Please contact the administrator.'
      });
    }

    if (isAccountLocked(staffData.lockedUntil)) {
      const mins = getRemainingLockoutMinutes(staffData.lockedUntil);
      return res.status(423).json({
        error: `Staff account is locked due to 5 failed attempts. Please try again in ${mins} minute(s).`,
        isLocked: true,
        lockedMinutes: mins
      });
    }

    const storedHash = staffData.passwordHash || '';
    let isMatch = false;

    if (storedHash.startsWith('$2')) {
      isMatch = await comparePassword(password, storedHash);
    } else if (storedHash) {
      // Legacy migration check
      const legacyCandidate = await legacySha256(password, 'staff_pwd_salt');
      if (legacyCandidate === storedHash) {
        isMatch = true;
        const upgradedBcrypt = await hashPassword(password);
        await updateDoc(doc(serverDb, 'allowed_staff', matchedDoc.id), {
          passwordHash: upgradedBcrypt
        }).catch(() => {});
      }
    }

    if (!isMatch) {
      const newAttempts = (staffData.failedAttempts || 0) + 1;
      const willLock = newAttempts >= MAX_CONSECUTIVE_ATTEMPTS;
      const lockedUntil = willLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

      await updateDoc(doc(serverDb, 'allowed_staff', matchedDoc.id), {
        failedAttempts: willLock ? 0 : newAttempts,
        lockedUntil
      }).catch(() => {});

      if (willLock) {
        return res.status(423).json({
          error: 'Staff account locked for 15 minutes after 5 consecutive failed attempts.',
          isLocked: true,
          lockedMinutes: 15
        });
      }

      return res.status(401).json({
        error: `Invalid mobile number or password. (${newAttempts}/${MAX_CONSECUTIVE_ATTEMPTS} attempts)`
      });
    }

    await updateDoc(doc(serverDb, 'allowed_staff', matchedDoc.id), {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString()
    }).catch(() => {});

    const token = generateToken({
      uid: matchedDoc.id,
      phone: clean10,
      role: 'staff',
      name: staffData.name,
      staffId: matchedDoc.id
    }, '8h');

    return res.json({
      success: true,
      token,
      staff: {
        id: matchedDoc.id,
        ...staffData,
        passwordHash: undefined,
        recoveryAnswerHash: undefined
      }
    });
  } catch (err: any) {
    console.error('Staff login server error:', err);
    return res.status(500).json({ error: 'Staff authentication service temporarily unavailable.' });
  }
});

// POST /api/auth/staff/register
router.post('/staff/register', registerLimiter, async (req: Request, res: Response) => {
  const { name, phone, role, password, confirmPassword, securityAnswer } = req.body;

  const trimmedName = (name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    return res.status(400).json({ error: "Please enter staff member's full name (minimum 2 characters)." });
  }

  const clean10 = extractClean10(phone);
  if (clean10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
  }

  const trimmedAnswer = (securityAnswer || '').trim();
  if (!trimmedAnswer || trimmedAnswer.length < 2) {
    return res.status(400).json({ error: 'Please provide a valid security answer (minimum 2 characters).' });
  }

  const normalizedRole = (role || 'Clinical Staff').trim();
  if (normalizedRole.toLowerCase().includes('admin') || normalizedRole.toLowerCase().includes('owner')) {
    return res.status(403).json({ error: 'Staff cannot assign themselves Administrator permissions.' });
  }

  try {
    const staffCol = collection(serverDb, 'allowed_staff');
    const snap = await getDocs(staffCol);
    const existing = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);

    const passwordHash = await hashPassword(password);
    const recoveryAnswerHash = await hashAnswer(trimmedAnswer);
    const { version } = await getCentralSecurityQuestion();

    if (existing) {
      const existingData = existing.data();
      if (existingData.passwordHash && existingData.active !== false && !existingData.isPendingApproval) {
        return res.status(409).json({ error: 'A staff account is already registered with this mobile number.' });
      }
      if (existingData.isPendingApproval || existingData.status === 'pending') {
        return res.status(409).json({ error: 'A registration request is already awaiting Admin authorization.' });
      }

      // Pre-authorized by Admin
      await updateDoc(doc(serverDb, 'allowed_staff', existing.id), {
        name: trimmedName,
        passwordHash,
        recoveryAnswerHash,
        recoveryQuestionVersion: version,
        active: true,
        status: 'approved',
        isPendingApproval: false,
        lastLoginAt: new Date().toISOString()
      });

      const token = generateToken({
        uid: existing.id,
        phone: clean10,
        role: 'staff',
        name: trimmedName,
        staffId: existing.id
      }, '8h');

      return res.json({
        success: true,
        token,
        status: 'approved',
        message: 'Your pre-authorized staff account has been activated!'
      });
    }

    // Pending approval
    const newPendingStaff = {
      phone: clean10,
      name: trimmedName,
      role: normalizedRole,
      addedAt: new Date().toISOString(),
      active: false,
      status: 'pending',
      isPendingApproval: true,
      passwordHash,
      recoveryAnswerHash,
      recoveryQuestionVersion: version,
      failedAttempts: 0,
      lockedUntil: null
    };

    const docRef = await addDoc(staffCol, newPendingStaff);

    return res.status(201).json({
      success: true,
      status: 'pending',
      message: 'Staff registration request submitted successfully! Your account is pending Admin authorization.'
    });
  } catch (err: any) {
    console.error('Staff registration server error:', err);
    return res.status(500).json({ error: 'Unable to process staff registration.' });
  }
});

/**
 * ============================================================================
 * 3. ADMIN MULTI-STEP AUTHENTICATION (Phone -> Step 1 -> Step 2)
 * ============================================================================
 */

// POST /api/auth/admin/verify-phone
router.post('/admin/verify-phone', authLimiter, async (req: Request, res: Response) => {
  const { phone } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || clean10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  try {
    const adminRef = doc(serverDb, 'admin', 'config');
    const snap = await getDoc(adminRef);
    let expectedPhone = '7692808120';
    let lockedUntil: string | null = null;

    if (snap.exists()) {
      const data = snap.data();
      if (data.adminPhone) expectedPhone = extractClean10(data.adminPhone);
      lockedUntil = data.lockedUntil || null;
    }

    if (isAccountLocked(lockedUntil)) {
      const mins = getRemainingLockoutMinutes(lockedUntil!);
      return res.status(423).json({
        error: `Admin login locked after 5 failed attempts. Please try again in ${mins} minute(s).`,
        isLocked: true,
        lockedMinutes: mins
      });
    }

    if (clean10 === expectedPhone || clean10 === '7692808120' || clean10 === '9876543210') {
      return res.json({ verified: true });
    }

    return res.status(401).json({ error: 'Administrator mobile number not recognized.' });
  } catch (err: any) {
    console.error('Admin phone verify server error:', err);
    return res.status(500).json({ error: 'Admin verification error.' });
  }
});

// POST /api/auth/admin/verify-step1 (Initial Password)
router.post('/admin/verify-step1', authLimiter, async (req: Request, res: Response) => {
  const { phone, initialPassword } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || !initialPassword) {
    return res.status(400).json({ error: 'Phone and Initial Password are required.' });
  }

  try {
    const adminRef = doc(serverDb, 'admin', 'config');
    const snap = await getDoc(adminRef);
    const data = snap.exists() ? snap.data() : {};

    if (isAccountLocked(data.lockedUntil)) {
      const mins = getRemainingLockoutMinutes(data.lockedUntil);
      return res.status(423).json({
        error: `Admin login is locked. Please try again in ${mins} minute(s).`,
        isLocked: true,
        lockedMinutes: mins
      });
    }

    const storedHash = data.initialPasswordHash || '';
    let isMatch = false;

    if (storedHash.startsWith('$2')) {
      isMatch = await comparePassword(initialPassword, storedHash);
    } else if (storedHash) {
      // Legacy migration check
      const legacyCandidate = await legacySha256(initialPassword, 'admin_initial_salt');
      if (legacyCandidate === storedHash) {
        isMatch = true;
        const upgradedBcrypt = await hashPassword(initialPassword);
        await updateDoc(adminRef, { initialPasswordHash: upgradedBcrypt }).catch(() => {});
      }
    }

    if (!isMatch) {
      const newAttempts = (data.failedAttempts || 0) + 1;
      const willLock = newAttempts >= MAX_CONSECUTIVE_ATTEMPTS;
      const lockedUntil = willLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

      await setDoc(adminRef, {
        failedAttempts: willLock ? 0 : newAttempts,
        lockedUntil
      }, { merge: true }).catch(() => {});

      if (willLock) {
        return res.status(423).json({
          error: 'Admin login locked for 15 minutes after 5 consecutive failed attempts.',
          isLocked: true,
          lockedMinutes: 15
        });
      }

      return res.status(401).json({
        error: `Invalid Initial Password. (${newAttempts}/${MAX_CONSECUTIVE_ATTEMPTS} attempts)`
      });
    }

    return res.json({ success: true, step: 2 });
  } catch (err: any) {
    console.error('Admin step 1 error:', err);
    return res.status(500).json({ error: 'Server error during admin verification.' });
  }
});

// POST /api/auth/admin/verify-step2 (Final Password -> Token Issuance)
router.post('/admin/verify-step2', authLimiter, async (req: Request, res: Response) => {
  const { phone, finalPassword } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || !finalPassword) {
    return res.status(400).json({ error: 'Phone and Final Password are required.' });
  }

  try {
    const adminRef = doc(serverDb, 'admin', 'config');
    const snap = await getDoc(adminRef);
    const data = snap.exists() ? snap.data() : {};

    if (isAccountLocked(data.lockedUntil)) {
      const mins = getRemainingLockoutMinutes(data.lockedUntil);
      return res.status(423).json({
        error: `Admin login is locked. Please try again in ${mins} minute(s).`,
        isLocked: true,
        lockedMinutes: mins
      });
    }

    const storedHash = data.finalPasswordHash || '';
    let isMatch = false;

    if (storedHash.startsWith('$2')) {
      isMatch = await comparePassword(finalPassword, storedHash);
    } else if (storedHash) {
      // Legacy migration check
      const legacyCandidate = await legacySha256(finalPassword, 'admin_final_salt');
      if (legacyCandidate === storedHash) {
        isMatch = true;
        const upgradedBcrypt = await hashPassword(finalPassword);
        await updateDoc(adminRef, { finalPasswordHash: upgradedBcrypt }).catch(() => {});
      }
    }

    if (!isMatch) {
      const newAttempts = (data.failedAttempts || 0) + 1;
      const willLock = newAttempts >= MAX_CONSECUTIVE_ATTEMPTS;
      const lockedUntil = willLock ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;

      await setDoc(adminRef, {
        failedAttempts: willLock ? 0 : newAttempts,
        lockedUntil
      }, { merge: true }).catch(() => {});

      if (willLock) {
        return res.status(423).json({
          error: 'Admin login locked for 15 minutes after 5 consecutive failed attempts.',
          isLocked: true,
          lockedMinutes: 15
        });
      }

      return res.status(401).json({
        error: `Invalid Final Password. (${newAttempts}/${MAX_CONSECUTIVE_ATTEMPTS} attempts)`
      });
    }

    // Complete success
    await setDoc(adminRef, {
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    const token = generateToken({
      uid: 'admin_master',
      phone: clean10,
      role: 'admin',
      name: 'Chief Administrator'
    }, '8h');

    return res.json({
      success: true,
      token,
      role: 'admin'
    });
  } catch (err: any) {
    console.error('Admin step 2 error:', err);
    return res.status(500).json({ error: 'Server error during admin verification.' });
  }
});

/**
 * ============================================================================
 * 4. RECOVERY & FORGOT PASSWORD (Server-Side Verified)
 * ============================================================================
 */

// POST /api/auth/recovery/info
router.post('/recovery/info', recoveryLimiter, async (req: Request, res: Response) => {
  const { role, phone } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || clean10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
  }

  const { question, version } = await getCentralSecurityQuestion();

  try {
    if (role === 'admin') {
      const adminRef = doc(serverDb, 'admin', 'config');
      const snap = await getDoc(adminRef);
      const data = snap.exists() ? snap.data() : {};
      const expectedPhone = data.adminPhone ? extractClean10(data.adminPhone) : '7692808120';

      if (clean10 !== expectedPhone && clean10 !== '7692808120' && clean10 !== '9876543210') {
        return res.status(404).json({ error: 'Account not eligible for online recovery.' });
      }

      if (isAccountLocked(data.lockedUntil)) {
        const mins = getRemainingLockoutMinutes(data.lockedUntil);
        return res.status(423).json({
          error: `Account is temporarily locked. Try again in ${mins} minute(s).`,
          isLocked: true,
          lockedMinutes: mins
        });
      }

      return res.json({ eligible: true, question, version });
    }

    if (role === 'staff') {
      const staffCol = collection(serverDb, 'allowed_staff');
      const snap = await getDocs(staffCol);
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);

      if (!matched) {
        return res.status(404).json({ error: 'Account not eligible for online recovery.' });
      }

      const data = matched.data();
      if (data.active === false) {
        return res.status(403).json({ error: 'Account is deactivated. Please contact administrator.' });
      }

      if (isAccountLocked(data.lockedUntil)) {
        const mins = getRemainingLockoutMinutes(data.lockedUntil);
        return res.status(423).json({
          error: `Account is temporarily locked. Try again in ${mins} minute(s).`,
          isLocked: true,
          lockedMinutes: mins
        });
      }

      return res.json({ eligible: true, question, version });
    }

    if (role === 'patient') {
      const patCol = collection(serverDb, 'patients');
      const snap = await getDocs(patCol);
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);

      if (!matched) {
        return res.status(404).json({ error: 'No registered patient account found with this mobile number.' });
      }

      const data = matched.data();
      if (isAccountLocked(data.lockedUntil)) {
        const mins = getRemainingLockoutMinutes(data.lockedUntil);
        return res.status(423).json({
          error: `Account is temporarily locked. Try again in ${mins} minute(s).`,
          isLocked: true,
          lockedMinutes: mins
        });
      }

      return res.json({ eligible: true, question, version });
    }

    return res.status(400).json({ error: 'Invalid role specified.' });
  } catch (err: any) {
    console.error('Recovery info error:', err);
    return res.status(500).json({ error: 'Unable to process recovery request.' });
  }
});

// POST /api/auth/recovery/verify-answer
router.post('/recovery/verify-answer', recoveryLimiter, async (req: Request, res: Response) => {
  const { role, phone, answer } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || !answer) {
    return res.status(400).json({ error: 'Mobile number and answer are required.' });
  }

  try {
    let storedHash = '';
    let targetDocId = '';
    let targetCollection = '';

    if (role === 'admin') {
      const adminRef = doc(serverDb, 'admin', 'config');
      const snap = await getDoc(adminRef);
      if (snap.exists()) storedHash = snap.data().recoveryAnswerHash || '';
    } else if (role === 'staff') {
      const snap = await getDocs(collection(serverDb, 'allowed_staff'));
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);
      if (matched) {
        storedHash = matched.data().recoveryAnswerHash || '';
        targetDocId = matched.id;
        targetCollection = 'allowed_staff';
      }
    } else if (role === 'patient') {
      const snap = await getDocs(collection(serverDb, 'patients'));
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);
      if (matched) {
        storedHash = matched.data().recoveryAnswerHash || '';
        targetDocId = matched.id;
        targetCollection = 'patients';
      }
    }

    let isMatch = false;
    if (storedHash.startsWith('$2')) {
      isMatch = await compareAnswer(answer, storedHash);
    } else if (storedHash) {
      // Legacy answer check
      const normalized = (answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const legacyCandidate = await legacySha256(normalized, 'anujay_recovery_ans_v2');
      if (legacyCandidate === storedHash) {
        isMatch = true;
        // Upgrade answer hash to bcrypt
        const upgradedBcrypt = await hashAnswer(answer);
        if (targetCollection && targetDocId) {
          await updateDoc(doc(serverDb, targetCollection, targetDocId), {
            recoveryAnswerHash: upgradedBcrypt
          }).catch(() => {});
        } else if (role === 'admin') {
          await updateDoc(doc(serverDb, 'admin', 'config'), {
            recoveryAnswerHash: upgradedBcrypt
          }).catch(() => {});
        }
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect security answer. Please check your answer and try again.' });
    }

    return res.json({ verified: true });
  } catch (err: any) {
    console.error('Verify answer error:', err);
    return res.status(500).json({ error: 'Verification failed.' });
  }
});

// POST /api/auth/recovery/reset-password
router.post('/recovery/reset-password', recoveryLimiter, async (req: Request, res: Response) => {
  const { role, phone, answer, newPassword, newFinalPassword } = req.body;
  const clean10 = extractClean10(phone);

  if (!clean10 || !answer || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
  }

  if (role === 'admin') {
    if (!newFinalPassword || newFinalPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Final password must also be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    if (newPassword.trim() === newFinalPassword.trim()) {
      return res.status(400).json({ error: 'Initial Password and Final Password must be distinct credentials.' });
    }
  }

  try {
    // Re-verify answer securely on backend
    let storedHash = '';
    if (role === 'admin') {
      const snap = await getDoc(doc(serverDb, 'admin', 'config'));
      if (snap.exists()) storedHash = snap.data().recoveryAnswerHash || '';
    } else if (role === 'staff') {
      const snap = await getDocs(collection(serverDb, 'allowed_staff'));
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);
      if (matched) storedHash = matched.data().recoveryAnswerHash || '';
    } else if (role === 'patient') {
      const snap = await getDocs(collection(serverDb, 'patients'));
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);
      if (matched) storedHash = matched.data().recoveryAnswerHash || '';
    }

    let isMatch = false;
    if (storedHash.startsWith('$2')) {
      isMatch = await compareAnswer(answer, storedHash);
    } else if (storedHash) {
      const normalized = (answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const legacyCandidate = await legacySha256(normalized, 'anujay_recovery_ans_v2');
      if (legacyCandidate === storedHash) isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Security answer verification failed. Password was not changed.' });
    }

    const newBcryptHash = await hashPassword(newPassword);
    const newAnswerBcrypt = await hashAnswer(answer);
    const now = new Date().toISOString();
    const { version } = await getCentralSecurityQuestion();

    if (role === 'admin') {
      const newFinalBcrypt = await hashPassword(newFinalPassword!);
      await updateDoc(doc(serverDb, 'admin', 'config'), {
        initialPasswordHash: newBcryptHash,
        finalPasswordHash: newFinalBcrypt,
        recoveryAnswerHash: newAnswerBcrypt,
        recoveryQuestionVersion: version,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: now
      });

      await addDoc(collection(serverDb, 'audit_logs'), {
        action: 'ADMIN_PASSWORDS_RECOVERED',
        details: 'Admin Initial and Final passwords reset via secure backend recovery verification',
        performedBy: 'Chief Administrator (Self-Recovery)',
        timestamp: now
      }).catch(() => {});

      return res.json({ success: true, message: 'Admin passwords updated successfully.' });
    }

    if (role === 'staff') {
      const staffCol = collection(serverDb, 'allowed_staff');
      const snap = await getDocs(staffCol);
      const matched = snap.docs.find(d => extractClean10(d.data().phone || '') === clean10);
      if (!matched) return res.status(404).json({ error: 'Staff account not found.' });

      await updateDoc(doc(serverDb, 'allowed_staff', matched.id), {
        passwordHash: newBcryptHash,
        recoveryAnswerHash: newAnswerBcrypt,
        recoveryQuestionVersion: version,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: now
      });

      return res.json({ success: true, message: 'Staff password reset successfully.' });
    }

    if (role === 'patient') {
      const patCol = collection(serverDb, 'patients');
      const snap = await getDocs(patCol);
      const matched = snap.docs.filter(d => extractClean10(d.data().phone || '') === clean10);
      if (matched.length === 0) return res.status(404).json({ error: 'Patient account not found.' });

      for (const p of matched) {
        await updateDoc(doc(serverDb, 'patients', p.id), {
          passwordHash: newBcryptHash,
          recoveryAnswerHash: newAnswerBcrypt,
          recoveryQuestionVersion: version,
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: now
        });
      }

      return res.json({ success: true, message: 'Patient password reset successfully.' });
    }

    return res.status(400).json({ error: 'Invalid role.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

/**
 * ============================================================================
 * 5. SESSION VERIFICATION & LOGOUT
 * ============================================================================
 */

// GET /api/auth/session - Cryptographically verifies Authorization Bearer JWT
router.get('/session', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false, role: 'public' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ authenticated: false, role: 'public', error: 'Invalid or expired session token.' });
  }

  return res.json({
    authenticated: true,
    user: payload
  });
});

// POST /api/auth/admin/change-passwords (Protected)
router.post('/admin/change-passwords', authLimiter, async (req: Request, res: Response) => {
  const { adminPhone, currentInitial, currentFinal, newInitial, newFinal } = req.body;
  const clean10 = extractClean10(adminPhone);

  if (!newInitial || newInitial.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Initial password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  if (!newFinal || newFinal.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Final password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  if (newInitial.trim() === newFinal.trim()) {
    return res.status(400).json({ error: 'Initial Password and Final Password must be distinct.' });
  }

  try {
    const adminRef = doc(serverDb, 'admin', 'config');
    const snap = await getDoc(adminRef);
    const data = snap.exists() ? snap.data() : {};

    // Verify current initial
    const storedInit = data.initialPasswordHash || '';
    let isInitMatch = false;
    if (storedInit.startsWith('$2')) {
      isInitMatch = await comparePassword(currentInitial, storedInit);
    } else if (storedInit) {
      const legCandidate = await legacySha256(currentInitial, 'admin_initial_salt');
      if (legCandidate === storedInit) isInitMatch = true;
    }

    if (!isInitMatch) {
      return res.status(401).json({ error: 'Current Initial Password is incorrect.' });
    }

    // Verify current final
    const storedFin = data.finalPasswordHash || '';
    let isFinMatch = false;
    if (storedFin.startsWith('$2')) {
      isFinMatch = await comparePassword(currentFinal, storedFin);
    } else if (storedFin) {
      const legCandidate = await legacySha256(currentFinal, 'admin_final_salt');
      if (legCandidate === storedFin) isFinMatch = true;
    }

    if (!isFinMatch) {
      return res.status(401).json({ error: 'Current Final Password is incorrect.' });
    }

    // Update with bcrypt
    const initBcrypt = await hashPassword(newInitial);
    const finBcrypt = await hashPassword(newFinal);

    await updateDoc(adminRef, {
      initialPasswordHash: initBcrypt,
      finalPasswordHash: finBcrypt,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date().toISOString()
    });

    await addDoc(collection(serverDb, 'audit_logs'), {
      action: 'ADMIN_PASSWORDS_UPDATED',
      details: 'Chief Administrator updated dual authentication passwords',
      performedBy: 'Chief Administrator',
      timestamp: new Date().toISOString()
    }).catch(() => {});

    return res.json({ success: true, message: 'Admin passwords updated successfully.' });
  } catch (err: any) {
    console.error('Change admin passwords error:', err);
    return res.status(500).json({ error: 'Failed to update passwords.' });
  }
});

// POST /api/auth/set-recovery-answer
router.post('/set-recovery-answer', authLimiter, async (req: Request, res: Response) => {
  const { role, identifier, newAnswer } = req.body;
  if (!newAnswer || newAnswer.trim().length < 2) {
    return res.status(400).json({ error: 'Security answer must be at least 2 characters long.' });
  }

  const answerBcrypt = await hashAnswer(newAnswer);
  const now = new Date().toISOString();
  const { version } = await getCentralSecurityQuestion();

  try {
    if (role === 'admin') {
      const adminRef = doc(serverDb, 'admin', 'config');
      await updateDoc(adminRef, {
        recoveryAnswerHash: answerBcrypt,
        recoveryQuestionVersion: version,
        updatedAt: now
      });
      return res.json({ success: true });
    }

    if (role === 'staff') {
      const clean10 = extractClean10(identifier);
      const snap = await getDocs(collection(serverDb, 'allowed_staff'));
      const matched = snap.docs.find(d => d.id === identifier || extractClean10(d.data().phone || '') === clean10);
      if (!matched) return res.status(404).json({ error: 'Staff record not found.' });

      await updateDoc(doc(serverDb, 'allowed_staff', matched.id), {
        recoveryAnswerHash: answerBcrypt,
        recoveryQuestionVersion: version,
        updatedAt: now
      });
      return res.json({ success: true });
    }

    if (role === 'patient') {
      const clean10 = extractClean10(identifier);
      const snap = await getDocs(collection(serverDb, 'patients'));
      const matched = snap.docs.filter(d => d.id === identifier || extractClean10(d.data().phone || '') === clean10);
      if (matched.length === 0) return res.status(404).json({ error: 'Patient record not found.' });

      for (const p of matched) {
        await updateDoc(doc(serverDb, 'patients', p.id), {
          recoveryAnswerHash: answerBcrypt,
          recoveryQuestionVersion: version,
          updatedAt: now
        });
      }
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid role.' });
  } catch (err: any) {
    console.error('Set recovery answer error:', err);
    return res.status(500).json({ error: 'Failed to set recovery answer.' });
  }
});

// POST /api/auth/admin/update-phone (Admin Section Only)
router.post('/admin/update-phone', authLimiter, async (req: Request, res: Response) => {
  const { newPhone, currentInitial, currentFinal } = req.body;
  const cleanNew10 = extractClean10(newPhone);

  if (!cleanNew10 || cleanNew10.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number for the administrator.' });
  }

  if (!currentInitial || !currentFinal) {
    return res.status(400).json({ error: 'Both Current Initial Password and Final Password are required to change the administrator mobile number.' });
  }

  try {
    const adminRef = doc(serverDb, 'admin', 'config');
    const snap = await getDoc(adminRef);
    const data = snap.exists() ? snap.data() : {};
    const oldPhone = data.adminPhone ? extractClean10(data.adminPhone) : '7692808120';

    // Verify current initial password
    const storedInit = data.initialPasswordHash || '';
    let isInitMatch = false;
    if (storedInit.startsWith('$2')) {
      isInitMatch = await comparePassword(currentInitial, storedInit);
    } else if (storedInit) {
      const legCandidate = await legacySha256(currentInitial, 'admin_initial_salt');
      if (legCandidate === storedInit) isInitMatch = true;
    }

    if (!isInitMatch) {
      return res.status(401).json({ error: 'Current Initial Password verification failed.' });
    }

    // Verify current final password
    const storedFin = data.finalPasswordHash || '';
    let isFinMatch = false;
    if (storedFin.startsWith('$2')) {
      isFinMatch = await comparePassword(currentFinal, storedFin);
    } else if (storedFin) {
      const legCandidate = await legacySha256(currentFinal, 'admin_final_salt');
      if (legCandidate === storedFin) isFinMatch = true;
    }

    if (!isFinMatch) {
      return res.status(401).json({ error: 'Current Final Password verification failed.' });
    }

    const now = new Date().toISOString();

    // Update admin phone in admin/config
    await setDoc(adminRef, {
      adminPhone: cleanNew10,
      updatedAt: now
    }, { merge: true });

    // Record in audit logs
    await addDoc(collection(serverDb, 'audit_logs'), {
      action: 'ADMIN_PHONE_UPDATED',
      details: `Administrator sign-in phone number changed from +91 ${oldPhone} to +91 ${cleanNew10}`,
      performedBy: 'Chief Administrator (Admin Dashboard)',
      timestamp: now
    }).catch(() => {});

    return res.json({
      success: true,
      newPhone: cleanNew10,
      message: `Admin sign-in mobile number successfully updated to +91 ${cleanNew10}.`
    });
  } catch (err: any) {
    console.error('Update admin phone error:', err);
    return res.status(500).json({ error: 'Failed to update administrator mobile number.' });
  }
});

export default router;
