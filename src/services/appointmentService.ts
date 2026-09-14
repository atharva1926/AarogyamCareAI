import { apiDelete, apiGet, apiPost, apiPut } from './api'
import type { Appointment } from '../types'

export function createServerAppointment(appointment: Appointment) {
  return apiPost<{ appointment: Appointment }>('/api/appointments', appointment)
}

export function updateServerAppointment(appointment: Appointment) {
  return apiPut<{ appointment: Appointment }>(`/api/appointments/${appointment.id}`, appointment)
}

export function deleteServerAppointment(id: string) {
  return apiDelete<{ success: true }>(`/api/appointments/${id}`)
}

export function getServerAppointments() {
  return apiGet<{ appointments: Appointment[] }>('/api/appointments')
}

export function sendTestSms(to: string, message: string) {
  return apiPost<{
    success: boolean
    sid?: string
    status?: string
    usedTrialTemplate?: boolean
    message: string
    code?: number | string
    twilioStatus?: number
    moreInfo?: string
  }>('/api/sms/test', { to, message })
}
