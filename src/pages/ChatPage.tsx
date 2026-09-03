import { useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatInput } from '../components/ChatInput'
import { ChatMessage } from '../components/ChatMessage'
import { Button, Card, Disclaimer, EmptyState, ErrorState, LoadingDots } from '../components/ui'
import { useChatStore } from '../store/chatStore'
import { cn, formatDate } from '../utils'

const prompts = [
  'Explain my symptoms',
  'What does my report mean?',
  'Give me healthy diet suggestions',
  'How can I improve my sleep?',
]

export function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const chats = useChatStore((s) => s.chats)
  const activeChatId = useChatStore((s) => s.activeChatId)
  const isSending = useChatStore((s) => s.isSending)
  const error = useChatStore((s) => s.error)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const createNewChat = useChatStore((s) => s.createNewChat)
  const loadChat = useChatStore((s) => s.loadChat)
  const clearChat = useChatStore((s) => s.clearChat)
  const clearError = useChatStore((s) => s.clearError)

  useEffect(() => {
    if (chatId) {
      loadChat(chatId)
      return
    }
    const existing = useChatStore.getState().activeChatId ?? useChatStore.getState().chats[0]?.id
    if (existing) {
      navigate(`/chat/${existing}`, { replace: true })
      return
    }
    const id = createNewChat()
    navigate(`/chat/${id}`, { replace: true })
  }, [chatId, createNewChat, loadChat, navigate])

  const active = chats.find((c) => c.id === activeChatId)

  const onNew = () => {
    const id = createNewChat()
    navigate(`/chat/${id}`)
  }

  return (
    <div className="-m-4 flex h-[calc(100svh-4rem)] min-h-[32rem] overflow-hidden sm:-m-6">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white p-4 md:block dark:border-slate-800 dark:bg-slate-950">
        <Button className="w-full" onClick={onNew}>
          <Plus className="h-4 w-4" /> New Chat
        </Button>
        <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent</p>
        <ul className="space-y-1 overflow-y-auto">
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => {
                  loadChat(chat.id)
                  navigate(`/chat/${chat.id}`)
                }}
                className={cn(
                  'w-full rounded-xl px-3 py-2 text-left text-sm',
                  chat.id === activeChatId
                    ? 'bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900',
                )}
              >
                <span className="block truncate font-medium">{chat.title}</span>
                <span className="block text-xs text-slate-400">{formatDate(chat.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <p className="font-semibold dark:text-white">AarogyamCare AI</p>
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="md:hidden" onClick={onNew}>
              New
            </Button>
            <Button variant="ghost" size="sm" onClick={clearChat} aria-label="Clear chat">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!active?.messages.length && !isSending && (
            <EmptyState
              title="How can I help today?"
              description="Ask a general health question. I am not a doctor and I do not provide diagnoses."
            />
          )}
          {active?.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isSending && (
            <Card className="max-w-sm">
              <LoadingDots />
            </Card>
          )}
          {error && <ErrorState message={error} onRetry={clearError} />}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                onClick={() => void sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <ChatInput onSend={(value) => void sendMessage(value)} disabled={isSending} />
          <Disclaimer />
        </div>
      </section>
    </div>
  )
}
