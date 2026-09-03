import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AppError } from '../services/api'
import { isEmail } from '../utils'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (!isEmail(email)) next.email = 'Please enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    if (next.email || next.password) return
    setLoading(true)
    try {
      await login(email, password, remember)
      navigate('/dashboard')
    } catch (error) {
      setErrors({
        form: error instanceof AppError ? error.message : 'Unable to sign in. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 lg:hidden">
        <Logo />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to continue to AarogyamCare AI.</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <Input label="Email" type="email" autoComplete="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <Input
            label="Password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-slate-500"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow((s) => !s)}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:underline">
            Forgot password
          </Link>
        </div>
        {errors.form && (
          <p className="text-sm text-rose-600" role="alert">
            {errors.form}
          </p>
        )}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Login
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
          Create Account
        </Link>
      </p>
    </div>
  )
}
