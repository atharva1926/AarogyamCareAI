import { BellRing, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Textarea } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { createServerAppointment, deleteServerAppointment, getServerAppointments, sendTestSms, updateServerAppointment } from '../services/appointmentService'
import type { Appointment, AppointmentReminder } from '../types'
import { createId, formatDate } from '../utils'

const APPOINTMENTS_KEY = 'aarogyamcare.appointments'

const reminderOptions: { value: AppointmentReminder; label: string }[] = [
  { value: '15m', label: '15 minutes before' },
  { value: '30m', label: '30 minutes before' },
  { value: '1h', label: '1 hour before' },
  { value: '1d', label: '1 day before' },
  { value: '2d', label: '2 days before' },
]

type AppointmentDraft = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>

function emptyDraft(): AppointmentDraft {
  return {
    doctor: '',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    reminder: '30m',
    reminderMessage: '',
    patientPhone: '',
    smsConsent: false,
  }
}

function readAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? (parsed as Appointment[]).map((appointment) => ({
          ...appointment,
          patientPhone: appointment.patientPhone ?? '',
          smsConsent: appointment.smsConsent ?? false,
          smsStatus: appointment.smsStatus ?? 'not_scheduled',
        }))
      : []
  } catch {
    return []
  }
}

function appointmentDateTime(appointment: Appointment): Date {
  return new Date(`${appointment.date}T${appointment.time}`)
}

function reminderLabel(reminder: AppointmentReminder): string {
  return reminderOptions.find((option) => option.value === reminder)?.label ?? reminder
}

function AppointmentCard({
  appointment,
  past,
  onEdit,
  onDelete,
}: {
  appointment: Appointment
  past: boolean
  onEdit: (appointment: Appointment) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold dark:text-white">{appointment.doctor}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden />
            {formatDate(appointment.date)} · {appointment.time}
          </p>
        </div>
        <Badge tone={past ? 'neutral' : 'info'}>{past ? 'Past' : 'Upcoming'}</Badge>
      </div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
        <p className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
          <BellRing className="h-4 w-4 text-brand-600" aria-hidden />
          Reminder: {reminderLabel(appointment.reminder)}
        </p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {appointment.reminderMessage || 'No reminder message added.'}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          SMS: {appointment.smsStatus === 'sent' ? 'Accepted by Twilio' : appointment.smsStatus === 'failed' ? 'Not sent — check the reminder settings.' : appointment.smsStatus === 'scheduled' ? 'Scheduled' : 'Not scheduled'}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(appointment)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-rose-700 hover:bg-rose-50 hover:text-rose-700" onClick={() => onDelete(appointment.id)}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </Card>
  )
}

export function AppointmentsPage() {
  const { showToast } = useToast()
  const initialAppointmentsRef = useRef<Appointment[] | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const storedAppointments = readAppointments()
    initialAppointmentsRef.current = storedAppointments
    return storedAppointments
  })
  const [draft, setDraft] = useState<AppointmentDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('AarogyamCare test: your SMS reminders are connected.')
  const [isSendingTest, setIsSendingTest] = useState(false)

  const persist = (next: Appointment[]) => {
    setAppointments(next)
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next))
  }

  useEffect(() => {
    let active = true
    void getServerAppointments()
      .then(async ({ appointments: serverAppointments }) => {
        const serverIds = new Set(serverAppointments.map((appointment) => appointment.id))
        const browserOnlyAppointments = (initialAppointmentsRef.current ?? []).filter((appointment) => !serverIds.has(appointment.id))
        const copiedAppointments = await Promise.all(
          browserOnlyAppointments.map(async (appointment) => {
            try {
              return (await createServerAppointment(appointment)).appointment
            } catch {
              return appointment
            }
          }),
        )
        if (!active) return

        // Keep existing browser entries and server entries together during the one-time transition.
        const combined = new Map<string, Appointment>()
        for (const appointment of [...browserOnlyAppointments, ...copiedAppointments, ...serverAppointments]) {
          combined.set(appointment.id, appointment)
        }
        const mergedAppointments = [...combined.values()]
        setAppointments(mergedAppointments)
        localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(mergedAppointments))
      })
      .catch(() => {
        // The original browser copy remains usable if the optional server is offline.
      })
    return () => { active = false }
  }, [])

  const upcoming = useMemo(
    () =>
      appointments
        .filter((appointment) => appointmentDateTime(appointment).getTime() >= Date.now())
        .sort((a, b) => appointmentDateTime(a).getTime() - appointmentDateTime(b).getTime()),
    [appointments],
  )
  const past = useMemo(
    () =>
      appointments
        .filter((appointment) => appointmentDateTime(appointment).getTime() < Date.now())
        .sort((a, b) => appointmentDateTime(b).getTime() - appointmentDateTime(a).getTime()),
    [appointments],
  )

  const updateDraft = <Key extends keyof AppointmentDraft>(key: Key, value: AppointmentDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const resetForm = () => {
    setDraft(emptyDraft())
    setEditingId(null)
    setFormError('')
  }

  const saveAppointment = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.doctor.trim() || !draft.date || !draft.time) {
      setFormError('Doctor name, date, and time are required.')
      return
    }
    if (draft.patientPhone && !/^\+[1-9]\d{7,14}$/.test(draft.patientPhone.trim())) {
      setFormError('Use an international phone number, for example +919876543210.')
      return
    }
    if (draft.smsConsent && !draft.patientPhone.trim()) {
      setFormError('Add a patient phone number before enabling SMS reminders.')
      return
    }

    const now = new Date().toISOString()
    let savedAppointment: Appointment
    let localNext: Appointment[]
    if (editingId) {
      const current = appointments.find((appointment) => appointment.id === editingId)
      if (!current) return
      savedAppointment = { ...current, ...draft, doctor: draft.doctor.trim(), updatedAt: now }
      localNext = appointments.map((appointment) => appointment.id === editingId ? savedAppointment : appointment)
      persist(localNext)
    } else {
      savedAppointment = {
        id: createId(),
        ...draft,
        doctor: draft.doctor.trim(),
        createdAt: now,
        updatedAt: now,
        smsStatus: draft.smsConsent && draft.patientPhone ? 'scheduled' : 'not_scheduled',
      }
      localNext = [savedAppointment, ...appointments]
      persist(localNext)
    }
    const wasEditing = Boolean(editingId)
    resetForm()
    try {
      const response = wasEditing
        ? await updateServerAppointment(savedAppointment)
        : await createServerAppointment(savedAppointment)
      persist(localNext.map((appointment) => appointment.id === savedAppointment.id ? response.appointment : appointment))
      // The local copy was already saved above; this success message confirms scheduling is available too.
      showToast(wasEditing ? 'Appointment updated and SMS reminder scheduled.' : 'Appointment added and SMS reminder scheduled.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? `${error.message} Saved on this device only.` : 'Saved on this device only. Start the server to schedule SMS reminders.', 'info')
    }
  }

  const editAppointment = (appointment: Appointment) => {
    setDraft({
      doctor: appointment.doctor,
      date: appointment.date,
      time: appointment.time,
      reminder: appointment.reminder,
      reminderMessage: appointment.reminderMessage,
      patientPhone: appointment.patientPhone ?? '',
      smsConsent: appointment.smsConsent ?? false,
    })
    setEditingId(appointment.id)
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteAppointment = async (id: string) => {
    persist(appointments.filter((appointment) => appointment.id !== id))
    if (editingId === id) resetForm()
    try {
      await deleteServerAppointment(id)
      showToast('Appointment deleted.', 'info')
    } catch (error) {
      showToast(error instanceof Error ? `${error.message} Removed from this device only.` : 'Removed from this device only.', 'info')
    }
  }

  const sendSmsTest = async (event: FormEvent) => {
    event.preventDefault()
    setIsSendingTest(true)
    try {
      const response = await sendTestSms(testPhone, testMessage)
      showToast(response.message, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The test SMS could not be sent.', 'error')
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Appointments" description="Create and edit your appointment notes. Items automatically move to history after their scheduled time." />

      <Card>
        <form onSubmit={saveAppointment}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold dark:text-white">{editingId ? 'Edit appointment' : 'Add appointment'}</h2>
              <p className="mt-1 text-sm text-slate-500">Keep the doctor, time, reminder preference, and your own note together.</p>
            </div>
            {editingId && <Button type="button" variant="ghost" size="sm" onClick={resetForm}>Cancel edit</Button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Doctor's name" value={draft.doctor} onChange={(event) => updateDraft('doctor', event.target.value)} placeholder="e.g. Dr. Priya Sharma" error={formError} />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date</span>
              <input type="date" value={draft.date} onChange={(event) => updateDraft('date', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Time</span>
              <input type="time" value={draft.time} onChange={(event) => updateDraft('time', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Reminder time</span>
              <select value={draft.reminder} onChange={(event) => updateDraft('reminder', event.target.value as AppointmentReminder)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                {reminderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4">
            <Textarea label="Reminder message" value={draft.reminderMessage} onChange={(event) => updateDraft('reminderMessage', event.target.value)} placeholder="Example: Please leave early for the appointment." className="min-h-24" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Patient phone number" type="tel" value={draft.patientPhone} onChange={(event) => updateDraft('patientPhone', event.target.value)} placeholder="e.g. +919876543210" hint="Required only for SMS reminders." />
            <label className="mt-7 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={draft.smsConsent} onChange={(event) => updateDraft('smsConsent', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>I have permission to send appointment reminders by SMS to this number.</span>
            </label>
          </div>
          <Button className="mt-5" type="submit"><Plus className="h-4 w-4" /> {editingId ? 'Save changes' : 'Add appointment'}</Button>
        </form>
      </Card>

      <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
        <h2 className="font-semibold text-amber-950 dark:text-amber-100">SMS reminders need server setup</h2>
        <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">SMS delivery uses Twilio from the secure server. Add a phone number in international format and confirm consent. The reminder is only marked sent after Twilio accepts it.</p>
      </Card>

      <Card>
        <form onSubmit={sendSmsTest} className="space-y-4">
          <div>
            <h2 className="font-semibold dark:text-white">Test SMS connection</h2>
            <p className="mt-1 text-sm text-slate-500">Send one test to a number that has agreed to receive it before relying on scheduled reminders.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Test phone number" type="tel" value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="e.g. +919876543210" required />
            <Input label="Test message" value={testMessage} onChange={(event) => setTestMessage(event.target.value)} maxLength={500} required />
          </div>
          <Button type="submit" disabled={isSendingTest}>{isSendingTest ? 'Sending test SMS…' : 'Send test SMS'}</Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 font-semibold dark:text-white">Upcoming appointments</h2>
        {upcoming.length === 0 ? <EmptyState title="No upcoming appointments" description="Add an appointment note above to plan your next visit." /> : <div className="grid gap-3 md:grid-cols-2">{upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} past={false} onEdit={editAppointment} onDelete={deleteAppointment} />)}</div>}
      </section>

      <section>
        <h2 className="mb-3 font-semibold dark:text-white">Past appointment history</h2>
        {past.length === 0 ? <EmptyState title="No past appointments" description="Completed appointments will automatically appear here after their scheduled time." /> : <div className="grid gap-3 md:grid-cols-2">{past.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} past onEdit={editAppointment} onDelete={deleteAppointment} />)}</div>}
      </section>
    </div>
  )
}
