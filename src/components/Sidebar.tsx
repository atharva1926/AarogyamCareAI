import {
  Bell,
  CalendarDays,
  History,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldAlert,
  UserRound,
  FileText,
  MapPinned,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../utils'
import { Logo } from './ui'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { to: '/chat-history', label: 'Chat History', icon: History },
  { to: '/health-profile', label: 'Health Profile', icon: UserRound },
  { to: '/reports', label: 'Health Reports', icon: FileText },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/nearby-care', label: 'Find care nearby', icon: MapPinned },
  { to: '/emergency', label: 'Emergency', icon: ShieldAlert },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void
  onNavigate?: () => void
}) {
  return (
    <aside className="flex h-full w-[256px] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="px-5 py-5">
        <Logo to="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900',
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/40"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
