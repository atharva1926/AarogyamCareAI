export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  user: User
  token?: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  dateOfBirth: string
  gender: string
  phone?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatThread {
  id: string
  title: string
  preview: string
  updatedAt: string
  messages: Message[]
}

export interface HealthProfile {
  name: string
  dateOfBirth: string
  gender: string
  bloodGroup: string
  height: string
  weight: string
  allergies: string
  conditions: string
  medications: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export interface HealthReport {
  id: string
  name: string
  uploadedAt: string
  status: 'uploaded' | 'analyzing' | 'ready' | 'failed'
  type: string
}

export interface ReportAnalysis {
  summary: string
  keyFindings: string[]
  importantValues: { label: string; value: string }[]
  possibleConcerns: string[]
  questionsForDoctor: string[]
}

export interface DiseasePredictionRequest {
  symptoms: string[]
}

export interface DiseasePredictionResponse {
  prediction: string
  confidence: number
  message: string
}

export interface SymptomsResponse {
  symptoms: string[]
}

export type RiskGender = 'female' | 'male'
export type RiskCategory = 1 | 2 | 3

export interface RiskPredictionRequest {
  age: number
  gender: RiskGender
  height: number
  weight: number
  systolic_bp: number
  diastolic_bp: number
  cholesterol: RiskCategory
  glucose: RiskCategory
  smoking: boolean
  alcohol: boolean
  physical_activity: boolean
}

export interface RiskPredictionResponse {
  risk_level: 'Lower Risk' | 'Higher Risk'
  prediction: 0 | 1
  probability: number
  model: string
  message: string
}

export type AppointmentReminder = '15m' | '30m' | '1h' | '1d' | '2d'
export type AppointmentSmsStatus = 'not_scheduled' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'skipped'

export interface Appointment {
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
  smsStatus?: AppointmentSmsStatus
  smsSentAt?: string
  smsLastAttemptAt?: string
  smsLastError?: string
  smsSid?: string
  smsProviderStatus?: string
}

export type AppNotificationKind = 'report' | 'appointment' | 'system' | 'account'

export interface AppNotification {
  id: string
  title: string
  body: string
  kind: AppNotificationKind
  createdAt: string
  read: boolean
}

export type ThemePreference = 'light' | 'dark' | 'system'
