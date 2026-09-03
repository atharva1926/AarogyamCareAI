import { useToast } from '../context/ToastContext'
import { cn } from '../utils'

export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={cn(
            'pointer-events-auto rounded-xl px-4 py-3 text-left text-sm font-medium text-white shadow-lg',
            toast.tone === 'success' && 'bg-emerald-600',
            toast.tone === 'error' && 'bg-rose-600',
            toast.tone === 'info' && 'bg-slate-800',
          )}
          onClick={() => dismiss(toast.id)}
        >
          {toast.message}
        </button>
      ))}
    </div>
  )
}
