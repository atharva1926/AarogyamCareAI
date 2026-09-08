import { Bot, UserRound } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
          'min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-tr-md bg-gradient-to-r from-brand-600 to-medical-600 text-white'
            : 'rounded-tl-md bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-bold first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>,
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-slate-950 dark:text-white">{children}</strong>,
              em: ({ children }) => <em>{children}</em>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" className="font-medium text-brand-600 underline underline-offset-2 dark:text-brand-300">
                  {children}
                </a>
              ),
              blockquote: ({ children }) => <blockquote className="my-3 border-l-4 border-brand-400 pl-3 italic text-slate-600 dark:text-slate-300">{children}</blockquote>,
              code: ({ children, className }) =>
                className ? (
                  <code className="block overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100">{children}</code>
                ) : (
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900 dark:bg-slate-700 dark:text-slate-100">{children}</code>
                ),
              pre: ({ children }) => <pre className="my-3 max-w-full overflow-x-auto whitespace-pre rounded-lg">{children}</pre>,
              table: ({ children }) => <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700"><table className="min-w-full border-collapse text-left text-xs">{children}</table></div>,
              thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-700">{children}</thead>,
              th: ({ children }) => <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold dark:border-slate-600">{children}</th>,
              td: ({ children }) => <td className="border-b border-slate-100 px-3 py-2 align-top dark:border-slate-700">{children}</td>,
              hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        <p className={cn('mt-2 text-[11px]', isUser ? 'text-white/80' : 'text-slate-400')}>
          {formatDateTime(message.timestamp)}
        </p>
      </div>
    </article>
  )
}
