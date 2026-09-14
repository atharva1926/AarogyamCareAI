import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sendChatMessage } from '../services/chatService'
import type { ChatThread, Message } from '../types'
import { AppError } from '../services/api'
import { createId } from '../utils'

interface ChatState {
  chats: ChatThread[]
  activeChatId: string | null
  isSending: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  createNewChat: () => string
  loadChat: (id: string) => void
  deleteChat: (id: string) => void
  clearError: () => void
}

function titleFrom(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed || 'New conversation'
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      isSending: false,
      error: null,

      createNewChat: () => {
        const id = createId()
        const chat: ChatThread = {
          id,
          title: 'New conversation',
          preview: 'Start a conversation with AarogyamCare AI',
          updatedAt: new Date().toISOString(),
          messages: [],
        }
        set((state) => ({ chats: [chat, ...state.chats], activeChatId: id, error: null }))
        return id
      },

      loadChat: (id) => {
        set({ activeChatId: id, error: null })
      },

      deleteChat: (id) => {
        set((state) => {
          const chats = state.chats.filter((c) => c.id !== id)
          const activeChatId = state.activeChatId === id ? (chats[0]?.id ?? null) : state.activeChatId
          return { chats, activeChatId }
        })
      },

      clearError: () => set({ error: null }),

      sendMessage: async (content) => {
        const text = content.trim()
        if (!text) return
        let chatId = get().activeChatId
        if (!chatId) chatId = get().createNewChat()

        const userMessage: Message = {
          id: createId(),
          role: 'user',
          content: text,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          isSending: true,
          error: null,
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  title: c.messages.length === 0 ? titleFrom(text) : c.title,
                  preview: text,
                  updatedAt: userMessage.timestamp,
                  messages: [...c.messages, userMessage],
                }
              : c,
          ),
        }))

        try {
          const reply = await sendChatMessage(text, chatId)
          const assistantMessage: Message = {
            id: createId(),
            role: 'assistant',
            content: reply,
            timestamp: new Date().toISOString(),
          }
          set((state) => ({
            isSending: false,
            chats: state.chats.map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    preview: reply,
                    updatedAt: assistantMessage.timestamp,
                    messages: [...c.messages, assistantMessage],
                  }
                : c,
            ),
          }))
        } catch (error) {
          const message =
            error instanceof AppError
              ? error.message
              : 'Something went wrong while connecting to AarogyamCare AI. Please try again.'
          set({ isSending: false, error: message })
        }
      },
    }),
    { name: 'aarogyamcare.chats' },
  ),
)
