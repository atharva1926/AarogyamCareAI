import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Mic, Paperclip, Send } from 'lucide-react'
import { Button } from './ui'

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    const next = value.trim()
    if (!next || disabled) return
    onSend(next)
    setValue('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <label htmlFor="chat-input" className="sr-only">
        Message AarogyamCare AI
      </label>
      <textarea
        id="chat-input"
        rows={2}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask a health question…"
        className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none dark:text-white"
      />
      <div className="flex items-center justify-between gap-2 px-1 pb-1">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Attach a file"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.pdf,.png,.jpg,.jpeg'
              input.onchange = () => {
                const file = input.files?.[0]
                if (file) setValue((current) => `${current}\n[Attached file: ${file.name}]`.trim())
              }
              input.click()
            }}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" aria-label="Voice input" disabled>
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <Button type="submit" size="sm" disabled={disabled || !value.trim()} aria-label="Send message">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </form>
  )
}
