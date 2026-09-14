import 'dotenv/config'
// @ts-expect-error cors typings may not be installed in this project.
import cors from 'cors'
// @ts-expect-error Express typings may not be installed in this project.
import express from 'express'
import { GoogleGenAI } from '@google/genai'
import { appendSmsLog, isReminder, readAppointments, saveAppointments, type StoredAppointment } from './backend/appointmentStore.ts'
import { startReminderScheduler } from './backend/reminderScheduler.ts'
import { getSmsConfigurationStatus, isE164PhoneNumber, sendSms } from './backend/twilioSmsService.ts'

const app = express()
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024

function logGeminiError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown Gemini error'
  const cause = error && typeof error === 'object' && 'cause' in error ? error.cause : undefined
  const causeMessage = cause instanceof Error ? cause.message : ''
  const causeCode = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''

  // Development diagnostics deliberately exclude request content and API keys.
  console.error(`${context}: ${message}${causeCode ? ` [${causeCode}]` : ''}${causeMessage ? ` — ${causeMessage}` : ''}`)
}

const REPORT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    keyFindings: { type: 'array', items: { type: 'string' } },
    importantValues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['label', 'value'],
      },
    },
    possibleConcerns: { type: 'array', items: { type: 'string' } },
    questionsForDoctor: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'keyFindings', 'importantValues', 'possibleConcerns', 'questionsForDoctor'],
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 10)
    : []
}

function reportAnalysisFromModel(value: unknown) {
  const data = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const importantValues = Array.isArray(data.importantValues)
    ? data.importantValues
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          label: typeof item.label === 'string' ? item.label : '',
          value: typeof item.value === 'string' ? item.value : '',
        }))
        .filter((item) => item.label && item.value)
        .slice(0, 10)
    : []

  return {
    summary: typeof data.summary === 'string' ? data.summary.trim() : '',
    keyFindings: stringList(data.keyFindings),
    importantValues,
    possibleConcerns: stringList(data.possibleConcerns),
    questionsForDoctor: stringList(data.questionsForDoctor),
  }
}

function createAppointmentId() {
  return `appointment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function appointmentFromRequest(body: unknown, existing?: StoredAppointment): { appointment?: StoredAppointment; message?: string } {
  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const doctor = typeof data.doctor === 'string' ? data.doctor.trim() : ''
  const date = typeof data.date === 'string' ? data.date : ''
  const time = typeof data.time === 'string' ? data.time : ''
  const reminderMessage = typeof data.reminderMessage === 'string' ? data.reminderMessage.trim() : ''
  const patientPhone = typeof data.patientPhone === 'string' ? data.patientPhone.trim() : ''
  const smsConsent = data.smsConsent === true

  if (!doctor || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !isReminder(data.reminder)) {
    return { message: 'Doctor name, date, time, and a valid reminder choice are required.' }
  }

  if (patientPhone && !isE164PhoneNumber(patientPhone)) {
    return { message: 'Use an international patient phone number, for example +919876543210.' }
  }

  if (smsConsent && !patientPhone) {
    return { message: 'Add a patient phone number before enabling SMS reminders.' }
  }

  const now = new Date().toISOString()
  const schedulingChanged = !existing || existing.date !== date || existing.time !== time || existing.reminder !== data.reminder || existing.patientPhone !== patientPhone || existing.smsConsent !== smsConsent || existing.reminderMessage !== reminderMessage
  const status = !patientPhone || !smsConsent
    ? 'not_scheduled'
    : schedulingChanged
      ? 'scheduled'
      : existing.smsStatus

  return {
    appointment: {
      id: existing?.id ?? (typeof data.id === 'string' && data.id.trim() ? data.id.trim() : createAppointmentId()),
      doctor,
      date,
      time,
      reminder: data.reminder,
      reminderMessage,
      patientPhone,
      smsConsent,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      smsStatus: status,
      ...(schedulingChanged ? {} : {
        smsSentAt: existing.smsSentAt,
        smsLastAttemptAt: existing.smsLastAttemptAt,
        smsLastError: existing.smsLastError,
        smsSid: existing.smsSid,
        smsProviderStatus: existing.smsProviderStatus,
      }),
    },
  }
}

app.use(
  cors({
    origin: true,
  }),
)
app.use(express.json({ limit: '15mb' }))

app.get('/api/appointments', async (_req: any, res: any) => {
  try {
    return res.json({ appointments: await readAppointments() })
  } catch (error) {
    console.error('Could not load appointments:', error instanceof Error ? error.message : 'Unknown error')
    return res.status(500).json({ message: 'Unable to load appointments right now.' })
  }
})

app.post('/api/appointments', async (req: any, res: any) => {
  const result = appointmentFromRequest(req.body)
  if (!result.appointment) return res.status(400).json({ message: result.message })

  try {
    const appointments = await readAppointments()
    const index = appointments.findIndex((appointment) => appointment.id === result.appointment?.id)
    if (index >= 0) {
      // A repeated request from the browser updates the same appointment rather than creating a duplicate.
      const updated = appointmentFromRequest(req.body, appointments[index])
      if (!updated.appointment) return res.status(400).json({ message: updated.message })
      appointments[index] = updated.appointment
      await saveAppointments(appointments)
      return res.json({ appointment: updated.appointment })
    }
    appointments.unshift(result.appointment)
    await saveAppointments(appointments)
    return res.status(201).json({ appointment: result.appointment })
  } catch (error) {
    console.error('Could not save appointment:', error instanceof Error ? error.message : 'Unknown error')
    return res.status(500).json({ message: 'Unable to save the appointment right now.' })
  }
})

app.put('/api/appointments/:id', async (req: any, res: any) => {
  try {
    const appointments = await readAppointments()
    const index = appointments.findIndex((appointment) => appointment.id === req.params.id)
    if (index < 0) return res.status(404).json({ message: 'Appointment not found.' })

    const result = appointmentFromRequest(req.body, appointments[index])
    if (!result.appointment) return res.status(400).json({ message: result.message })
    appointments[index] = result.appointment
    await saveAppointments(appointments)
    return res.json({ appointment: result.appointment })
  } catch (error) {
    console.error('Could not update appointment:', error instanceof Error ? error.message : 'Unknown error')
    return res.status(500).json({ message: 'Unable to update the appointment right now.' })
  }
})

app.delete('/api/appointments/:id', async (req: any, res: any) => {
  try {
    const appointments = await readAppointments()
    const next = appointments.filter((appointment) => appointment.id !== req.params.id)
    if (next.length === appointments.length) return res.status(404).json({ message: 'Appointment not found.' })
    await saveAppointments(next)
    return res.json({ success: true })
  } catch (error) {
    console.error('Could not delete appointment:', error instanceof Error ? error.message : 'Unknown error')
    return res.status(500).json({ message: 'Unable to delete the appointment right now.' })
  }
})

app.get('/api/sms/status', (_req: any, res: any) => {
  return res.json(getSmsConfigurationStatus())
})

app.post('/api/sms/test', async (req: any, res: any) => {
  const to = typeof req.body.to === 'string' ? req.body.to.trim() : ''
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''
  if (!isE164PhoneNumber(to)) return res.status(400).json({ message: 'Use an international phone number, for example +919876543210.' })
  if (!message || message.length > 500) return res.status(400).json({ message: 'Enter an SMS message of up to 500 characters.' })

  const result = await sendSms(to, message)
  await appendSmsLog({
    createdAt: new Date().toISOString(),
    event: result.success ? 'test_sent' : 'test_failed',
    sid: result.sid,
    status: result.status,
    error: result.error,
  })
  if (!result.success) {
    return res.status(502).json({
      success: false,
      message: result.error,
      ...(process.env.NODE_ENV !== 'production' ? {
        code: result.errorCode,
        twilioStatus: result.errorStatus,
        moreInfo: result.moreInfo,
      } : {}),
    })
  }
  return res.json({
    success: true,
    sid: result.sid,
    status: result.status,
    usedTrialTemplate: result.usedTrialTemplate,
    message: result.usedTrialTemplate
      ? 'Test SMS accepted by Twilio using its trial appointment-reminder template.'
      : 'Test SMS accepted by Twilio.',
  })
})

app.post('/api/chat', async (req: any, res: any) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''

  if (!message) {
    return res.status(400).json({ message: 'A message is required.' })
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('Gemini is not configured: GEMINI_API_KEY is missing.')
    return res.status(503).json({ message: 'AI service is not configured.' })
  }

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction: `You are AarogyamCare AI, a warm and reliable health-information assistant.

Answer the user's latest question directly and completely. Do not write as if you are continuing a previous answer, do not say "as mentioned above", and never leave a response unfinished.

Write every response in polished Markdown that is easy to scan:
- Start with the answer or recommendation; do not repeat the question.
- Keep simple questions concise. For longer answers, use descriptive ## or ### headings, short paragraphs, and whitespace.
- Use **bold** for key conclusions, bullet lists for related points, and numbered lists for procedures.
- Use a Markdown table only when comparing options or specifications makes the answer clearer.
- For technical questions, put code in fenced blocks with the correct language and use inline code for commands, APIs, and filenames.
- Do not use a wall of text. Do not add unnecessary introductions, repetition, or a generic closing question.
- Use emojis only when they clearly improve a warning, tip, or recommendation.
- Match the user's language and tone. Never invent facts, sources, links, statistics, or citations.

Provide general health information only; do not diagnose or claim certainty about a condition. Encourage urgent medical care or local emergency services for severe, sudden, or life-threatening symptoms.`,
      },
    })

    const reply = response.text?.trim()

    if (!reply) {
      return res.status(502).json({ message: 'The AI returned no response.' })
    }

    return res.json({ reply })
  } catch (error) {
    logGeminiError('Gemini chat request failed', error)
    return res.status(502).json({ message: 'Unable to get an AI response right now.' })
  }
})

app.post('/api/reports/analyze', async (req: any, res: any) => {
  const mimeType = typeof req.body.mimeType === 'string' ? req.body.mimeType : ''
  const data = typeof req.body.data === 'string' ? req.body.data : ''
  const allowedMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg'])

  if (!allowedMimeTypes.has(mimeType) || !data) {
    return res.status(400).json({ message: 'Please upload a PDF, PNG, or JPG report.' })
  }

  if (Buffer.byteLength(data, 'base64') > MAX_REPORT_SIZE_BYTES) {
    return res.status(413).json({ message: 'Please choose a report smaller than 10 MB.' })
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('Gemini is not configured: GEMINI_API_KEY is missing.')
    return res.status(503).json({ message: 'AI service is not configured. Add GEMINI_API_KEY to .env, then restart the server.' })
  }

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Review this uploaded health report for educational purposes only. Extract only clearly visible information. Do not diagnose, prescribe treatment, or state that a condition is confirmed. If a value is unclear, say it is unclear rather than guessing. Return a concise JSON report with a neutral summary, key findings, important visible values, possible discussion points, and questions to ask a qualified healthcare professional.`,
            },
            { inlineData: { mimeType, data } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: REPORT_ANALYSIS_SCHEMA,
      },
    })

    const text = response.text?.trim()
    if (!text) {
      return res.status(502).json({ message: 'The AI returned no report analysis.' })
    }

    const analysis = reportAnalysisFromModel(JSON.parse(text))
    if (!analysis.summary) {
      return res.status(502).json({ message: 'The AI returned an incomplete report analysis.' })
    }
    return res.json(analysis)
  } catch (error) {
    logGeminiError('Gemini report-analysis request failed', error)
    return res.status(502).json({ message: 'Unable to analyze this report right now. Please try again.' })
  }
})

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Backend running at http://localhost:3000')
  startReminderScheduler()
})
