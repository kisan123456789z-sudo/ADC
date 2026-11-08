import { useState, useRef, useCallback, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface UseSaveFeedbackOptions {
  successDuration?: number; // default 2000ms
  errorDuration?: number;   // default 3000ms
  timeoutMs?: number;       // default 20000ms
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useSaveFeedback(options: UseSaveFeedbackOptions = {}) {
  const {
    successDuration = 2000,
    errorDuration = 3000,
    timeoutMs = 20000,
    onSuccess,
    onError
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const executeSave = useCallback(async <T,>(
    saveFn: () => Promise<T | boolean | { success: boolean; error?: string } | void>
  ): Promise<boolean> => {
    if (status === 'saving') {
      return false; // Prevent duplicate submissions while in-flight
    }

    clearTimer();
    setStatus('saving');
    setErrorMessage(null);

    try {
      // Race saveFn with network timeout to avoid hanging indefinitely
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out. Please check your connection.')), timeoutMs)
      );

      const result = await Promise.race([saveFn(), timeoutPromise]);

      // Check for explicit failure responses from backend/service functions
      if (result === false) {
        throw new Error('Save operation was not completed by the database.');
      }
      if (typeof result === 'object' && result !== null && 'success' in result && (result as any).success === false) {
        throw new Error((result as any).error || 'Database operation failed.');
      }

      setStatus('success');
      onSuccess?.();

      timerRef.current = setTimeout(() => {
        setStatus('idle');
      }, successDuration);

      return true;
    } catch (err: any) {
      console.error('[SaveFeedback] Operation failed:', err);
      const userMessage = err?.message || 'Save Failed. Please Try Again';
      setErrorMessage(userMessage);
      setStatus('error');
      onError?.(err);

      timerRef.current = setTimeout(() => {
        setStatus('idle');
      }, errorDuration);

      return false;
    }
  }, [status, clearTimer, timeoutMs, successDuration, errorDuration, onSuccess, onError]);

  const reset = useCallback(() => {
    clearTimer();
    setStatus('idle');
    setErrorMessage(null);
  }, [clearTimer]);

  return {
    status,
    setStatus,
    isLoading: status === 'saving',
    isSuccess: status === 'success',
    isError: status === 'error',
    errorMessage,
    executeSave,
    reset
  };
}
