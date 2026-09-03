import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AppError } from '../services/api'
import { isEmail } from '../utils'

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to send reset instructions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 lg:hidden">
        <Logo />
      </div>
      <h1 className="text-2xl font-bold dark:text-white">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">We will email instructions if an account exists.</p>
      {sent ? (
        <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          If that email is registered, you will receive reset instructions shortly.
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input label="Email" type="email" value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand-700">
        Back to login
      </Link>
    </div>
  )
}
