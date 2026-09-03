import { Bell, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Avatar, Button } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-svh bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:block">
        <Sidebar onLogout={onLogout} />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[256px]">
            <Sidebar onLogout={onLogout} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <label className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search conversations, reports…"
                className="h-10 w-72 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
                aria-label="Search"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" aria-label="Notifications">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/settings" className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              <Avatar name={user?.name ?? 'User'} size="sm" />
              <span className="hidden text-sm font-medium text-slate-700 sm:block dark:text-slate-200">{user?.name}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="page-enter mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
