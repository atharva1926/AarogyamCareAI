import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Logo } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AppError } from '../services/api'
import { isEmail, passwordStrength } from '../utils'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strength = useMemo(() => passwordStrength(password), [password])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Full name is required.'
    if (!isEmail(email)) next.email = 'Enter a valid email address.'
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    if (!dateOfBirth) next.dateOfBirth = 'Date of birth is required.'
    if (!gender) next.gender = 'Please select a gender option.'
    if (!terms) next.terms = 'Please agree to the Terms and Privacy Policy.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await signup({
        name: name.trim(),
        email,
        password,
        dateOfBirth,
        gender,
        phone: phone || undefined,
      })
      navigate('/dashboard')
    } catch (error) {
      setErrors({
        form: error instanceof AppError ? error.message : 'Unable to create your account. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 lg:hidden">
        <Logo />
      </div>
      <h1 className="text-2xl font-bold dark:text-white">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Join AarogyamCare AI in a few details.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <Input label="Full Name" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" value={password} error={errors.password} onChange={(e) => setPassword(e.target.value)} />
        {password && (
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full ${strength === 'weak' ? 'w-1/3 bg-rose-500' : strength === 'medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-500'}`}
              />
            </div>
            <p className="mt-1 text-xs capitalize text-slate-500">Password strength: {strength}</p>
          </div>
        )}
        <Input label="Confirm Password" type="password" value={confirm} error={errors.confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Input label="Date of Birth" type="date" value={dateOfBirth} error={errors.dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Gender</span>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not">Prefer not to say</option>
          </select>
          {errors.gender && <span className="text-xs text-rose-600">{errors.gender}</span>}
        </label>
        <Input label="Phone Number (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" className="mt-1" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          I agree to the Terms and Privacy Policy.
        </label>
        {errors.terms && <p className="text-xs text-rose-600">{errors.terms}</p>}
        {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
        <Button type="submit" className="w-full" loading={loading} disabled={loading}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700">
          Login
        </Link>
      </p>
    </div>
  )
}
