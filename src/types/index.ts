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

export interface Appointment {
  id: string
  doctor: string
  specialization: string
  date: string
  time: string
  status: 'upcoming' | 'completed' | 'cancelled'
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
