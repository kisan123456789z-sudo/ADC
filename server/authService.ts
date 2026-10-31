import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase App for Server-Side Auth Operations
const serverApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const serverDb = initializeFirestore(
  serverApp,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

const JWT_SECRET = process.env.JWT_SECRET || 'anujay_clinic_secure_jwt_secret_2026_prod_key';
const TOKEN_EXPIRY_STAFF = '8h';
const TOKEN_EXPIRY_PATIENT = '24h';

export const INITIAL_SECURITY_QUESTION = "What was the first gift you remember receiving?";
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_CONSECUTIVE_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AuthSessionPayload {
  uid: string;
  phone: string;
  role: 'admin' | 'staff' | 'patient';
  name?: string;
  patientId?: string;
  staffId?: string;
}

export function generateToken(payload: AuthSessionPayload, expiresIn: string = TOKEN_EXPIRY_STAFF): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): AuthSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSessionPayload;
  } catch (err) {
    return null;
  }
}

export function extractClean10(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

export function normalizeSecurityAnswer(answer: string): string {
  return (answer || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  // If it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash);
  }
  return false;
}

export async function hashAnswer(answer: string): Promise<string> {
  const normalized = normalizeSecurityAnswer(answer);
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(normalized, salt);
}

export async function compareAnswer(answer: string, hash: string): Promise<boolean> {
  if (!answer || !hash) return false;
  const normalized = normalizeSecurityAnswer(answer);
  if (hash.startsWith('$2')) {
    return bcrypt.compare(normalized, hash);
  }
  return false;
}

export function isAccountLocked(lockedUntil?: string | null): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > Date.now();
}

export function getRemainingLockoutMinutes(lockedUntil: string): number {
  const diffMs = new Date(lockedUntil).getTime() - Date.now();
  return Math.max(1, Math.ceil(diffMs / (60 * 1000)));
}

export async function getCentralSecurityQuestion(): Promise<{ question: string; version: number }> {
  try {
    const adminRef = doc(serverDb, 'admin', 'config');
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        question: data.securityQuestion || INITIAL_SECURITY_QUESTION,
        version: data.securityQuestionVersion || 1
      };
    }
  } catch (err) {
    console.warn('Could not read admin security question:', err);
  }
  return { question: INITIAL_SECURITY_QUESTION, version: 1 };
}
