import React, { useEffect } from 'react';

interface SplashScreenProps {
  isLoading?: boolean;
  minDurationMs?: number;
  onFinished?: () => void;
}

/**
 * SplashScreen Controller
 * Coordinates with the canonical HTML splash screen (#app-preloader)
 * Prevents duplicate second splash screen mount and eliminates the double-bouncing animation.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading = false,
  minDurationMs = 2200,
  onFinished
}) => {
  useEffect(() => {
    // When data is loaded (or if not loading), signal the single canonical preloader to finish
    if (!isLoading) {
      if (typeof (window as any).__dismissPreloader === 'function') {
        (window as any).__dismissPreloader(minDurationMs, onFinished);
      } else {
        if (onFinished) onFinished();
      }
    }
  }, [isLoading, minDurationMs, onFinished]);

  // Renders null so there is exactly ONE splash screen in the application (no duplicate second overlay)
  return null;
};
