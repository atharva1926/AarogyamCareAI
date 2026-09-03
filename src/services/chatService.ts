import { AppError, apiPost } from './api'

interface ChatApiResponse {
  reply?: string
  message?: string
  content?: string
  data?: { reply?: string; message?: string }
}

export async function sendChatMessage(message: string, chatId?: string): Promise<string> {
  const payload = await apiPost<ChatApiResponse>('/api/chat', { message, chatId })
  const text =
    payload.reply ??
    payload.message ??
    payload.content ??
    payload.data?.reply ??
    payload.data?.message
  if (!text?.trim()) {
    throw new AppError('AarogyamCare AI did not return a response. Please try again.')
  }
  return text.trim()
}
