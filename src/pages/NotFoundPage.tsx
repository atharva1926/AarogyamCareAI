import { Link } from 'react-router-dom'
import { ThreeScene } from '../components/ThreeScene'
import { Button } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="h-56 w-56">
        <ThreeScene variant="404" />
      </div>
      <h1 className="mt-4 text-3xl font-bold dark:text-white">Oops! Page not found.</h1>
      <p className="mt-2 text-sm text-slate-500">That address is not part of AarogyamCare AI.</p>
      <Link to="/dashboard" className="mt-6">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  )
}
