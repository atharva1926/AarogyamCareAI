import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export type AppointmentReminder = '15m' | '30m' | '1h' | '1d' | '2d'
export type SmsStatus = 'not_scheduled' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'skipped'

export interface StoredAppointment {
  id: string
  doctor: string
  date: string
  time: string
  reminder: AppointmentReminder
  reminderMessage: string
  patientPhone: string
  smsConsent: boolean
  createdAt: string
  updatedAt: string
  smsStatus: SmsStatus
  smsSentAt?: string
  smsLastAttemptAt?: string
  smsLastError?: string
  smsSid?: string
  smsProviderStatus?: string
}

export interface SmsDeliveryLog {
  appointmentId?: string
  createdAt: string
  event: 'sent' | 'failed' | 'skipped' | 'test_sent' | 'test_failed'
  sid?: string
  status?: string
  error?: string
}

const dataDirectory = join(process.cwd(), 'data')
const appointmentsFile = join(dataDirectory, 'appointments.json')
const smsLogFile = join(dataDirectory, 'sms-delivery-log.json')

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'ENOENT') return fallback
    console.error(`Could not read ${file}:`, error)
    return fallback
  }
}

async function writeJson(file: string, value: unknown) {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function readAppointments(): Promise<StoredAppointment[]> {
  const appointments = await readJson<unknown>(appointmentsFile, [])
  return Array.isArray(appointments) ? appointments as StoredAppointment[] : []
}

export async function saveAppointments(appointments: StoredAppointment[]) {
  await writeJson(appointmentsFile, appointments)
}

export async function appendSmsLog(entry: SmsDeliveryLog) {
  const current = await readJson<unknown>(smsLogFile, [])
  const logs = Array.isArray(current) ? current as SmsDeliveryLog[] : []
  // Keep the local project log useful without allowing it to grow indefinitely.
  await writeJson(smsLogFile, [...logs, entry].slice(-500))
}

export function isReminder(value: unknown): value is AppointmentReminder {
  return value === '15m' || value === '30m' || value === '1h' || value === '1d' || value === '2d'
}
