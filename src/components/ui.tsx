import { HeartPulse } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../utils'

export function Logo({ compact = false, to = '/' }: { compact?: boolean; to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-slate-900 dark:text-white" aria-label="AarogyamCare AI home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-medical-600 text-white shadow-sm">
        <HeartPulse className="h-5 w-5" aria-hidden />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-tight">AarogyamCare AI</span>
          <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Healthcare companion</span>
        </span>
      )}
    </Link>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'primary' &&
          'bg-gradient-to-r from-brand-600 to-medical-600 text-white shadow-sm hover:from-brand-700 hover:to-medical-700',
        variant === 'secondary' &&
          'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
        variant === 'ghost' && 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
        variant === 'outline' &&
          'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
        className,
      )}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}) {
  const inputId = id ?? props.name
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-white',
          error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700',
          className,
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-rose-600" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>}
      <textarea
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900',
          className,
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-rose-600" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone === 'neutral' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        tone === 'success' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        tone === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        tone === 'danger' && 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        tone === 'info' && 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-medical-600 font-semibold text-white',
        size === 'sm' && 'h-8 w-8 text-xs',
        size === 'md' && 'h-10 w-10 text-sm',
        size === 'lg' && 'h-12 w-12 text-base',
      )}
    >
      {initials || 'A'}
    </span>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function LoadingSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label}
    </div>
  )
}

export function LoadingDots({ label = 'AarogyamCare AI is thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden>
        <span className="dot-bounce h-2 w-2 rounded-full bg-brand-500" style={{ animationDelay: '0ms' }} />
        <span className="dot-bounce h-2 w-2 rounded-full bg-brand-500" style={{ animationDelay: '150ms' }} />
        <span className="dot-bounce h-2 w-2 rounded-full bg-brand-500" style={{ animationDelay: '300ms' }} />
      </span>
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message = 'Something went wrong while connecting to AarogyamCare AI. Please try again.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center dark:border-rose-900 dark:bg-rose-950/40" role="alert">
      <p className="font-semibold text-rose-800 dark:text-rose-200">We could not complete that request</p>
      <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{message}</p>
      {onRetry && (
        <Button className="mt-4" type="button" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs leading-relaxed text-slate-500 dark:text-slate-400', className)}>
      AarogyamCare AI provides general informational guidance and does not replace professional
      medical diagnosis or emergency medical care.
    </p>
  )
}
