import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Button, Card, Input, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import type { ThemePreference } from '../types'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const { preference, setPreference } = useTheme()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Account, appearance, and privacy controls." />
      <Card>
        <h2 className="mb-4 font-semibold dark:text-white">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={user?.name ?? ''} readOnly />
          <Input label="Email" value={user?.email ?? ''} readOnly />
        </div>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold dark:text-white">Preferences</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Dark mode</span>
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value as ThemePreference)}
            className="h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
          Notifications
        </label>
        <label className="mt-4 block space-y-1.5 text-sm">
          <span className="font-medium">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-11 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
      </Card>
      <Card>
        <h2 className="mb-2 font-semibold dark:text-white">Privacy</h2>
        <p className="text-sm text-slate-500">
          Chat history and profile notes can be stored on this device. Do not share records you are not comfortable storing locally.
        </p>
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold dark:text-white">Security</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        </div>
      </Card>
      <Modal open={confirmDelete} title="Delete account?" onClose={() => setConfirmDelete(false)}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This removes the local session on this device. Cloud deletion depends on your backend.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              localStorage.clear()
              showToast('Local account data cleared.', 'info')
              onLogout()
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
