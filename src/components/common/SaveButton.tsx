import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { SaveStatus, useSaveFeedback } from '../../hooks/useSaveFeedback';

export interface SaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Async save action. When provided, the button manages its own saving/success/error state,
   * waits for database confirmation, and prevents duplicate submissions.
   */
  onSave?: () => Promise<boolean | any | void>;

  /**
   * Controlled status from parent hook (e.g. useSaveFeedback).
   */
  status?: SaveStatus;

  /**
   * Display text when idle. Defaults to children or 'Save'.
   */
  defaultText?: string;

  /**
   * Text shown while database operation is processing. Defaults to 'Saving...'.
   */
  savingText?: string;

  /**
   * Text shown when database save succeeds. Defaults to 'Saved Successfully'.
   */
  successText?: string;

  /**
   * Text shown when database save fails. Defaults to 'Save Failed. Please Try Again'.
   */
  errorText?: string;

  /**
   * Custom icon to display in idle state. Defaults to Lucide <Save /> icon.
   */
  icon?: React.ReactNode;

  /**
   * Optional custom classes for specific states.
   */
  savingClassName?: string;
  successClassName?: string;
  errorClassName?: string;

  /**
   * Whether to take 100% of parent width.
   */
  fullWidth?: boolean;

  /**
   * Visual variant: 'primary' (default) or 'secondary' (subtle slate background).
   */
  variant?: 'primary' | 'secondary';

  /**
   * Callback fired after successful save animation completes.
   */
  onSuccessComplete?: () => void;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  onSave,
  status: controlledStatus,
  defaultText,
  savingText = 'Saving...',
  successText = 'Saved Successfully',
  errorText = 'Save Failed. Please Try Again',
  icon,
  className = '',
  savingClassName = '',
  successClassName = '',
  errorClassName = '',
  fullWidth = false,
  variant = 'primary',
  disabled = false,
  type = 'button',
  onClick,
  children,
  onSuccessComplete,
  ...rest
}) => {
  // Self-managed state if controlledStatus is not passed
  const internalFeedback = useSaveFeedback({
    onSuccess: onSuccessComplete
  });

  const effectiveStatus = controlledStatus !== undefined ? controlledStatus : internalFeedback.status;
  const isSaving = effectiveStatus === 'saving';
  const isSuccess = effectiveStatus === 'success';
  const isError = effectiveStatus === 'error';

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isSaving || isSuccess) {
      e.preventDefault();
      return;
    }

    if (onSave) {
      e.preventDefault();
      await internalFeedback.executeSave(onSave);
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  // State-specific styling
  let stateClasses = '';
  if (isSaving) {
    stateClasses = savingClassName || 'bg-blue-600 hover:bg-blue-600 text-white border-blue-500 shadow-md cursor-wait opacity-95 transition-all duration-300';
  } else if (isSuccess) {
    stateClasses = successClassName || 'bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-save-bounce transition-all duration-300';
  } else if (isError) {
    stateClasses = errorClassName || 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-md animate-save-shake transition-all duration-200';
  } else if (variant === 'secondary' && !className.includes('bg-')) {
    stateClasses = 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs';
  }

  const baseWidthClass = fullWidth ? 'w-full' : '';
  const mergedClassName = `relative overflow-hidden inline-flex items-center justify-center gap-2 font-bold text-xs rounded-xl transition-all duration-200 select-none ${baseWidthClass} ${stateClasses || className} ${disabled && !isSaving && !isSuccess ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`;

  // Content determination
  const renderContent = () => {
    if (isSaving) {
      return (
        <span className="relative z-10 flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
          <span className="tracking-wide">{savingText}</span>
          <span className="inline-flex gap-0.5 ml-0.5">
            <span className="w-1 h-1 rounded-full bg-white/80 animate-ping" />
          </span>
        </span>
      );
    }

    if (isSuccess) {
      return (
        <>
          {/* Shimmer light sweep across the button */}
          <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-save-shimmer pointer-events-none" />

          {/* Popping checkmark with expanding ripple ring and sparkle */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="relative flex items-center justify-center">
              <span className="absolute w-6 h-6 rounded-full bg-white/45 animate-save-ripple pointer-events-none" />
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 animate-save-pop" />
              <span className="absolute -top-1.5 -right-2 text-[10px] text-amber-200 pointer-events-none animate-save-sparkle">
                ✦
              </span>
            </span>
            <span className="font-extrabold tracking-wide text-white drop-shadow-xs">{successText}</span>
          </span>
        </>
      );
    }

    if (isError) {
      return (
        <span className="relative z-10 flex items-center justify-center gap-2 animate-in zoom-in-95 fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-white shrink-0 animate-save-shake" />
          <span>{errorText}</span>
        </span>
      );
    }

    // Idle state
    if (children) {
      return children;
    }

    return (
      <>
        {icon !== undefined ? icon : <Save className="w-4 h-4 shrink-0" />}
        <span>{defaultText || 'Save'}</span>
      </>
    );
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || isSaving || isSuccess}
      className={mergedClassName}
      aria-live="polite"
      aria-busy={isSaving}
      {...rest}
    >
      {renderContent()}
    </button>
  );
};

/**
 * Inline or floating status pill to accompany forms or custom layouts
 */
export const SaveFeedbackBadge: React.FC<{
  status: SaveStatus;
  customSuccessText?: string;
  customErrorText?: string;
  className?: string;
}> = ({
  status,
  customSuccessText = 'Saved Successfully',
  customErrorText = 'Save Failed. Please Try Again',
  className = ''
}) => {
  if (status === 'idle') return null;

  if (status === 'saving') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold animate-in fade-in duration-200 shadow-xs ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
        <span>Saving...</span>
      </span>
    );
  }

  if (status === 'success') {
    return (
      <span className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold shadow-sm animate-save-bounce ${className}`}>
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-save-shimmer pointer-events-none" />
        <span className="relative flex items-center justify-center">
          <span className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-save-ripple pointer-events-none" />
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-save-pop" />
          <span className="absolute -top-1 -right-1 text-[8px] text-amber-500 animate-save-sparkle">✦</span>
        </span>
        <span className="relative z-10">{customSuccessText}</span>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold animate-save-shake ${className}`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>{customErrorText}</span>
      </span>
    );
  }

  return null;
};
