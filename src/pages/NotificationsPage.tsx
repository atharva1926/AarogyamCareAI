import { useState } from 'react'
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import type { AppNotification } from '../types'
import { formatDateTime } from '../utils'

const seed: AppNotification[] = [
  {
    id: 'n1',
    title: 'Report analyzed',
    body: 'Your latest upload is ready to review. Results are informational only.',
    kind: 'report',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'n2',
    title: 'Appointment reminder',
    body: 'You have an upcoming visit with Dr. Meera Shah.',
    kind: 'appointment',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    read: false,
  },
  {
    id: 'n3',
    title: 'System notification',
    body: 'AarogyamCare AI will briefly pause for maintenance this weekend.',
    kind: 'system',
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    read: true,
  },
  {
    id: 'n4',
    title: 'Account notification',
    body: 'Your profile was updated on this device.',
    kind: 'account',
    createdAt: new Date(Date.now() - 172800_000).toISOString(),
    read: true,
  },
]

const tone = {
  report: 'info',
  appointment: 'warning',
  system: 'neutral',
  account: 'success',
} as const

export function NotificationsPage() {
  const [items, setItems] = useState(seed)

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="outline" onClick={() => setItems([])}>
            Clear all
          </Button>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="You are all caught up" description="New alerts about reports, visits, and your account will appear here." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={item.read ? 'opacity-80' : ''}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold dark:text-white">{item.title}</p>
                    <Badge tone={tone[item.kind]}>{item.kind}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                </div>
                {!item.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
