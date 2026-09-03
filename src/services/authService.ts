import type { AuthResponse, SignupPayload, User } from '../types'
import { AppError, apiPost } from './api'

const USERS_KEY = 'aarogyamcare.users'

interface StoredUser extends User {
  password: string
}

interface AuthApiPayload {
  user?: User
  token?: string
  data?: AuthResponse
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function normalizeAuth(payload: AuthApiPayload, fallback: User): AuthResponse {
  const user = payload.user ?? payload.data?.user ?? fallback
  const token = payload.token ?? payload.data?.token
  if (!user?.id || !user.email) {
    throw new AppError('Something went wrong while connecting to AarogyamCare AI. Please try again.')
  }
  return { user, token }
}

function localLogin(email: string, password: string): AuthResponse {
  const users = readUsers()
  const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
  if (!match) {
    throw new AppError('Incorrect email or password. Please try again.')
  }
  const { password: _pw, ...user } = match
  void _pw
  return { user, token: `local.${user.id}` }
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  try {
    const payload = await apiPost<AuthApiPayload>('/api/auth/login', { email, password })
    return normalizeAuth(payload, { id: email, name: email.split('@')[0] ?? 'Member', email })
  } catch (error) {
    if (error instanceof AppError && error.status) {
      throw new AppError('Incorrect email or password. Please try again.', error.status)
    }
    try {
      return localLogin(email, password)
    } catch (localError) {
      if (localError instanceof AppError && localError.message.includes('Incorrect')) {
        throw localError
      }
      throw error
    }
  }
}

export async function signupRequest(input: SignupPayload): Promise<AuthResponse> {
  try {
    const payload = await apiPost<AuthApiPayload>('/api/auth/register', {
      name: input.name,
      email: input.email,
      password: input.password,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      phone: input.phone,
    })
    return normalizeAuth(payload, {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
    })
  } catch (error) {
    if (error instanceof AppError && error.status && error.status < 500) {
      throw new AppError('Unable to create your account with the provided details. Please review and try again.')
    }
    const users = readUsers()
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new AppError('An account with this email already exists. Please sign in.')
    }
    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      password: input.password,
    }
    writeUsers([...users, user])
    const { password: _pw, ...safe } = user
    void _pw
    return { user: safe, token: `local.${safe.id}` }
  }
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  try {
    await apiPost('/api/auth/forgot-password', { email })
  } catch (error) {
    if (error instanceof AppError && !error.status) {
      return
    }
    throw error
  }
}
