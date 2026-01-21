/**
 * Shared UI Components Library
 *
 * Reusable React components extracted from application-specific implementations.
 * Provides consistent styling, behavior, and accessibility across the application.
 */

import React from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Loading Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'text-[var(--electric-lime)]',
    secondary: 'text-[var(--text-secondary)]',
    muted: 'text-[var(--text-muted)]',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface LoadingTextProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingText({
  text = 'Loading...',
  size = 'md',
  className = ''
}: LoadingTextProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className={`flex items-center gap-3 text-[var(--text-muted)] ${className}`}>
      <LoadingSpinner size="sm" />
      <span className={sizeClasses[size]}>{text}</span>
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingPage({
  title = 'Loading...',
  description,
  className = ''
}: LoadingPageProps) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[var(--text-muted)] max-w-md">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'table-row';
}

export function LoadingSkeleton({
  className = '',
  lines = 3,
  variant = 'text'
}: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-[var(--surface-2)] rounded mb-3"></div>
        <div className="h-3 bg-[var(--surface-2)] rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-[var(--surface-2)] rounded w-1/2"></div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`animate-pulse flex gap-4 p-4 ${className}`}>
        <div className="h-4 bg-[var(--surface-2)] rounded flex-1"></div>
        <div className="h-4 bg-[var(--surface-2)] rounded w-24"></div>
        <div className="h-4 bg-[var(--surface-2)] rounded w-16"></div>
      </div>
    );
  }

  // Default text variant
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`h-4 bg-[var(--surface-2)] rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Status Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  children,
  size = 'md',
  className = ''
}: StatusBadgeProps) {
  const statusStyles = {
    success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
    error: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
    info: 'bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20',
    pending: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${statusStyles[status]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}

interface StatusIconProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIcon({
  status,
  size = 'md',
  className = ''
}: StatusIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconClass = `${sizeClasses[size]} ${className}`;

  switch (status) {
    case 'success':
      return (
        <svg className={`${iconClass} text-[var(--success)]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${iconClass} text-[var(--error)]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${iconClass} text-[var(--warning)]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'info':
      return (
        <svg className={`${iconClass} text-[var(--info)]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'loading':
      return <LoadingSpinner size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} className={className} />;
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Button Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-[var(--electric-lime)] text-[var(--void)] hover:brightness-110 focus:ring-[var(--electric-lime)]/50',
      secondary: 'bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)] focus:ring-[var(--text-primary)]/20',
      outline: 'border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus:ring-[var(--text-primary)]/20',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-1)] focus:ring-[var(--text-primary)]/20',
      danger: 'bg-[var(--error)] text-white hover:bg-[var(--error)]/90 focus:ring-[var(--error)]/50',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    };

    const buttonContent = (
      <>
        {loading && <LoadingSpinner size="sm" />}
        {icon && iconPosition === 'left' && !loading && icon}
        {children}
        {icon && iconPosition === 'right' && !loading && icon}
      </>
    );

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

/* ═══════════════════════════════════════════════════════════════════════════
   Modal Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = ''
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full mx-4 ${sizeClasses[size]} ${className}`}>
        <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border-subtle)] shadow-xl">
          {/* Header */}
          {(title || description) && (
            <div className="p-6 border-b border-[var(--border-subtle)]">
              {title && (
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalActions({ children, className = '' }: ModalActionsProps) {
  return (
    <div className={`flex gap-3 justify-end pt-6 border-t border-[var(--border-subtle)] ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Data Display Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl ${
        hover ? 'hover:border-[var(--border-primary)] transition-colors' : ''
      } ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Form Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  help,
  children,
  className = ''
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--text-secondary)]">
          {label}
          {required && <span className="text-[var(--error)] ml-1">*</span>}
        </label>
      )}
      {children}
      {help && (
        <p className="text-xs text-[var(--text-muted)]">{help}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20'
            : 'border-[var(--border-subtle)] focus:border-[var(--electric-lime)] focus:ring-[var(--electric-lime)]/20'
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  className?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 transition-colors resize-none ${
          error
            ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/20'
            : 'border-[var(--border-subtle)] focus:border-[var(--electric-lime)] focus:ring-[var(--electric-lime)]/20'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

/* ═══════════════════════════════════════════════════════════════════════════
   Layout Components
   ═══════════════════════════════════════════════════════════════════════════ */

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backAction?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  backAction,
  className = ''
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        {backAction}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  description,
  children,
  className = ''
}: SectionProps) {
  return (
    <section className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}