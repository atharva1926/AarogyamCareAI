import { Bot, UserRound } from 'lucide-react'
import type { Message } from '../types'
import { formatDateTime } from '../utils'
import { cn } from '../utils'

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <article
      className={cn('flex max-w-[85%] gap-3', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
      aria-label={isUser ? 'Your message' : 'AarogyamCare AI message'}
    >
      <span
        className={cn(
          'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-brand-600 text-white',
        )}
      >
        {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>
      <div
        className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-tr-md bg-gradient-to-r from-brand-600 to-medical-600 text-white'
            : 'rounded-tl-md bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn('mt-2 text-[11px]', isUser ? 'text-white/80' : 'text-slate-400')}>
          {formatDateTime(message.timestamp)}
        </p>
      </div>
    </article>
  )
}
