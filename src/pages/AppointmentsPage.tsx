import { Badge, Card, EmptyState, PageHeader } from '../components/ui'
import type { Appointment } from '../types'
import { formatDate } from '../utils'

const appointments: Appointment[] = [
  {
    id: '1',
    doctor: 'Dr. Meera Shah',
    specialization: 'Internal Medicine',
    date: '2026-09-08',
    time: '10:30 AM',
    status: 'upcoming',
  },
  {
    id: '2',
    doctor: 'Dr. Arjun Patel',
    specialization: 'Cardiology',
    date: '2026-09-18',
    time: '4:00 PM',
    status: 'upcoming',
  },
  {
    id: '3',
    doctor: 'Dr. Lila Raman',
    specialization: 'Dermatology',
    date: '2026-08-12',
    time: '11:15 AM',
    status: 'completed',
  },
]

function List({ items }: { items: Appointment[] }) {
  if (!items.length) {
    return <EmptyState title="Nothing here" description="Appointments will appear in this section." />
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold dark:text-white">{item.doctor}</p>
              <p className="text-sm text-slate-500">{item.specialization}</p>
            </div>
            <Badge tone={item.status === 'upcoming' ? 'info' : item.status === 'completed' ? 'success' : 'neutral'}>
              {item.status}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {formatDate(item.date)} · {item.time}
          </p>
        </Card>
      ))}
    </div>
  )
}

export function AppointmentsPage() {
  const upcoming = appointments.filter((a) => a.status === 'upcoming')
  const past = appointments.filter((a) => a.status !== 'upcoming')
  return (
    <div className="space-y-8">
      <PageHeader title="Appointments" description="Mock schedule for planning. Confirm times with your clinic." />
      <section>
        <h2 className="mb-3 font-semibold dark:text-white">Upcoming appointments</h2>
        <List items={upcoming} />
      </section>
      <section>
        <h2 className="mb-3 font-semibold dark:text-white">Past appointments</h2>
        <List items={past} />
      </section>
    </div>
  )
}
