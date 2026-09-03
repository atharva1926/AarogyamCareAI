import { Outlet } from 'react-router-dom'
import { ThreeScene } from '../components/ThreeScene'
import { Logo } from '../components/ui'

export function AuthLayout() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-brand-900 to-medical-800 lg:block">
        <ThreeScene variant="auth" className="absolute inset-0" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <Logo />
          <div>
            <h2 className="max-w-md text-3xl font-bold">Care that listens, guidance that stays clear.</h2>
            <p className="mt-3 max-w-sm text-sm text-white/75">
              AarogyamCare AI helps you ask better health questions and understand your information — never as a substitute for a clinician.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="w-full max-w-md page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
