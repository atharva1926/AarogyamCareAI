import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatInput } from '../components/ChatInput'
import { ChatMessage } from '../components/ChatMessage'
import { Card, Disclaimer, EmptyState, ErrorState, LoadingDots } from '../components/ui'
import { useChatStore } from '../store/chatStore'

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
  const clearError = useChatStore((s) => s.clearError)

  useEffect(() => {
    if (chatId) {
      loadChat(chatId)
      return
    }
    // Visiting /chat always starts a new conversation. Existing chats remain
    // available only from Chat History and their /chat/:chatId links.
    const id = createNewChat()
    navigate(`/chat/${id}`, { replace: true })
  }, [chatId, createNewChat, loadChat, navigate])

  const active = chats.find((c) => c.id === activeChatId)


  return (
    <div className="-m-4 flex h-[calc(100svh-4rem)] min-h-[32rem] overflow-hidden sm:-m-6">
      <section className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <p className="font-semibold dark:text-white">AarogyamCare AI</p>
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
            </p>
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
          <ChatInput onSend={(value) => void sendMessage(value)} disabled={isSending} />
          <Disclaimer />
        </div>
      </section>
    </div>
  )
}
