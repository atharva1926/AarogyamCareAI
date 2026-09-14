import { appendSmsLog, readAppointments, saveAppointments, type StoredAppointment } from './appointmentStore.ts'
import { isE164PhoneNumber, sendSms } from './twilioSmsService.ts'

const reminderOffsets: Record<StoredAppointment['reminder'], number> = {
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '2d': 2 * 24 * 60 * 60 * 1000,
}

let checkInProgress = false

function appointmentTime(appointment: StoredAppointment): number {
  return new Date(`${appointment.date}T${appointment.time}`).getTime()
}

function reminderText(appointment: StoredAppointment): string {
  const customMessage = appointment.reminderMessage.trim()
  return customMessage || `AarogyamCare reminder: appointment with ${appointment.doctor} on ${appointment.date} at ${appointment.time}.`
}

/** Checks persisted appointments. Each due reminder is sent at most once. */
export async function checkDueReminders() {
  if (checkInProgress) return
  checkInProgress = true

  try {
    const appointments = await readAppointments()
    let changed = false
    const now = Date.now()

    for (const appointment of appointments) {
      const scheduledAt = appointmentTime(appointment)
      const reminderAt = scheduledAt - reminderOffsets[appointment.reminder]
      const canStillRemind = Number.isFinite(scheduledAt) && now >= reminderAt && now < scheduledAt

      if (!canStillRemind || ['sent', 'sending', 'failed', 'skipped'].includes(appointment.smsStatus)) continue

      if (!appointment.smsConsent || !isE164PhoneNumber(appointment.patientPhone)) {
        appointment.smsStatus = 'skipped'
        appointment.smsLastError = 'No consent or a valid patient phone number was saved.'
        await appendSmsLog({ appointmentId: appointment.id, createdAt: new Date().toISOString(), event: 'skipped', error: appointment.smsLastError })
        changed = true
        continue
      }

      appointment.smsStatus = 'sending'
      appointment.smsLastAttemptAt = new Date().toISOString()
      changed = true
      await saveAppointments(appointments)

      const result = await sendSms(appointment.patientPhone, reminderText(appointment))
      if (result.success) {
        appointment.smsStatus = 'sent'
        appointment.smsSentAt = new Date().toISOString()
        appointment.smsSid = result.sid
        appointment.smsProviderStatus = result.status
        appointment.smsLastError = undefined
        await appendSmsLog({ appointmentId: appointment.id, createdAt: appointment.smsSentAt, event: 'sent', sid: result.sid, status: result.status })
      } else {
        appointment.smsStatus = 'failed'
        appointment.smsLastError = result.error
        await appendSmsLog({ appointmentId: appointment.id, createdAt: new Date().toISOString(), event: 'failed', error: result.error })
      }
    }

    if (changed) await saveAppointments(appointments)
  } catch (error) {
    console.error('Appointment reminder check failed:', error instanceof Error ? error.message : 'Unknown scheduler error')
  } finally {
    checkInProgress = false
  }
}

export function startReminderScheduler() {
  void checkDueReminders()
  setInterval(() => void checkDueReminders(), 30_000)
}
