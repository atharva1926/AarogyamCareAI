import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, EmptyState, Input, PageHeader } from '../components/ui'
import { useChatStore } from '../store/chatStore'
import { formatDateTime } from '../utils'

export function ChatHistoryPage() {
  const chats = useChatStore((s) => s.chats)
  const loadChat = useChatStore((s) => s.loadChat)
  const deleteChat = useChatStore((s) => s.deleteChat)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      chats.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.preview.toLowerCase().includes(query.toLowerCase()),
      ),
    [chats, query],
  )

  return (
    <div>
      <PageHeader title="Chat History" description="Search, reopen, or remove past conversations." />
      <div className="mb-5 max-w-md">
        <Input placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search conversations" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No conversations found" description="Start a chat from the AI Assistant to see history here." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((chat) => (
            <Card key={chat.id}>
              <p className="font-semibold dark:text-white">{chat.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{chat.preview}</p>
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(chat.updatedAt)}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    loadChat(chat.id)
                    navigate(`/chat/${chat.id}`)
                  }}
                >
                  Open
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteChat(chat.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
