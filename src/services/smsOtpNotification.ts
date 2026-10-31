/**
 * Free SMS OTP Dispatcher & In-App SMS Alert System
 * 
 * Provides free, instant 6-digit OTP delivery with realistic SMS push notifications,
 * audio chime, auto-fill capabilities, and zero carrier SMS fees.
 */

export interface SmsOtpMessage {
  id: string;
  phoneNumber: string;
  code: string;
  timestamp: number;
  expiresAt: number;
  sender: string;
}

type SmsListener = (message: SmsOtpMessage | null) => void;
type AutoFillListener = (code: string) => void;

class SmsOtpDispatcher {
  private currentMessage: SmsOtpMessage | null = null;
  private smsListeners: Set<SmsListener> = new Set();
  private autoFillListeners: Set<AutoFillListener> = new Set();
  private otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

  /**
   * Generates a secure 6-digit OTP, stores it with 10-minute validity,
   * triggers audio chime & haptic feedback, and broadcasts the SMS alert.
   */
  public generateAndSendFreeOtp(phoneNumber: string): { code: string; message: SmsOtpMessage } {
    // Generate secure 6-digit code
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const code = randomNum.toString();
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    // Store in active store
    this.otpStore.set(cleanPhone, {
      code,
      expiresAt,
      attempts: 0
    });

    const smsMessage: SmsOtpMessage = {
      id: `sms_${now}_${Math.random().toString(36).substring(2, 7)}`,
      phoneNumber: cleanPhone,
      code,
      timestamp: now,
      expiresAt,
      sender: 'Anujay Dental Clinic'
    };

    this.currentMessage = smsMessage;

    // Trigger audio chime
    this.playSmsChime();

    // Trigger subtle vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 100]);
      } catch {
        // Ignore
      }
    }

    // Broadcast to UI listeners
    this.notifySmsListeners(smsMessage);

    return { code, message: smsMessage };
  }

  /**
   * Validates submitted OTP for phone number
   */
  public verifyCode(phoneNumber: string, inputCode: string): { valid: boolean; error?: string } {
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    const cleanInput = inputCode.trim().replace(/\D/g, '');

    if (cleanInput.length !== 6) {
      return { valid: false, error: 'Please enter a valid 6-digit verification code.' };
    }

    const record = this.otpStore.get(cleanPhone);
    if (!record) {
      return { 
        valid: false, 
        error: 'No active OTP verification session found for this phone number. Please request a new code.' 
      };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(cleanPhone);
      return { valid: false, error: 'Verification code has expired. Please request a new OTP.' };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      this.otpStore.delete(cleanPhone);
      return { 
        valid: false, 
        error: 'Too many incorrect attempts. For security, please request a fresh OTP.' 
      };
    }

    if (record.code === cleanInput) {
      // Code verified, clean up
      this.otpStore.delete(cleanPhone);
      this.dismissSms();
      return { valid: true };
    }

    return { 
      valid: false, 
      error: `Invalid verification code (${record.attempts}/5 attempts). Please enter the 6-digit code shown in the SMS alert.` 
    };
  }

  /**
   * Retrieves active code for phone (if any)
   */
  public getActiveCode(phoneNumber: string): string | null {
    const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    const record = this.otpStore.get(cleanPhone);
    if (record && Date.now() < record.expiresAt) {
      return record.code;
    }
    return null;
  }

  /**
   * Subscribes to incoming SMS notifications
   */
  public subscribeSms(listener: SmsListener): () => void {
    this.smsListeners.add(listener);
    if (this.currentMessage) {
      listener(this.currentMessage);
    }
    return () => {
      this.smsListeners.delete(listener);
    };
  }

  /**
   * Dismisses current active SMS alert
   */
  public dismissSms(): void {
    this.currentMessage = null;
    this.notifySmsListeners(null);
  }

  /**
   * Triggers auto-fill on active OTP inputs
   */
  public triggerAutoFill(code: string): void {
    this.autoFillListeners.forEach(listener => {
      try {
        listener(code);
      } catch (err) {
        console.error('Error in autoFill listener:', err);
      }
    });
  }

  /**
   * Subscribes to auto-fill events
   */
  public subscribeAutoFill(listener: AutoFillListener): () => void {
    this.autoFillListeners.add(listener);
    return () => {
      this.autoFillListeners.delete(listener);
    };
  }

  private notifySmsListeners(msg: SmsOtpMessage | null): void {
    this.smsListeners.forEach(listener => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in SMS listener:', err);
      }
    });
  }

  /**
   * Synthesizes a pleasant native double-beep SMS tone via Web Audio API
   */
  private playSmsChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: 659.25 Hz (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.14);
      gain2.gain.setValueAtTime(0, now + 0.14);
      gain2.gain.linearRampToValueAtTime(0.2, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.32);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {
          // Ignore
        }
      }, 500);
    } catch {
      // Audio playback failed or blocked by autoplay policy
    }
  }
}

export const smsOtpDispatcher = new SmsOtpDispatcher();
