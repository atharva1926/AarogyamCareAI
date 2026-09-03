import { Activity, FileSearch, HeartPulse, MapPinned, MessageSquare, ShieldAlert, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThreeScene } from '../components/ThreeScene'
import { Badge, Button, Card, Disclaimer } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useChatStore } from '../store/chatStore'
import { formatDateTime, greetingForNow } from '../utils'

const actions = [
  { to: '/chat', title: 'Ask AI', desc: 'Start a new conversation', icon: MessageSquare },
  { to: '/report-analysis', title: 'Analyze Report', desc: 'Upload a supported document', icon: FileSearch },
  { to: '/chat', title: 'Check Symptoms', desc: 'Describe what you are feeling', icon: Activity },
  { to: '/health-profile', title: 'Health Profile', desc: 'Review your saved details', icon: UserRound },
  { to: '/emergency', title: 'Emergency Help', desc: 'Get urgent next steps', icon: ShieldAlert },
  { to: '/nearby-care', title: 'Find Care', desc: 'Hospitals and specialists nearby', icon: MapPinned },
]

export function DashboardPage() {
  const { user } = useAuth()
  const chats = useChatStore((s) => s.chats)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="bg-gradient-to-br from-white to-brand-50 dark:from-slate-900 dark:to-slate-800">
          <p className="text-sm font-medium text-brand-700">
            {greetingForNow()} 👋 {user?.name.split(' ')[0]}
          </p>
          <h1 className="mt-1 text-2xl font-bold dark:text-white">How can AarogyamCare AI help you today?</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Ask a question, review a report, or update your health profile. Guidance is informational only.
          </p>
          <Link to="/chat" className="mt-4 inline-block">
            <Button>Open AI Assistant</Button>
          </Link>
        </Card>
        <Card className="relative h-48 overflow-hidden p-0 sm:h-full">
          <ThreeScene variant="dashboard" />
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => (
          <Link key={action.title} to={action.to}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <action.icon className="h-5 w-5 text-brand-600" />
              <p className="mt-3 font-semibold dark:text-white">{action.title}</p>
              <p className="text-xs text-slate-500">{action.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">Recent conversations</h2>
            <Link to="/chat-history" className="text-sm font-medium text-brand-700">
              View all
            </Link>
          </div>
          {chats.length === 0 ? (
            <p className="text-sm text-slate-500">No conversations yet. Start with Ask AI.</p>
          ) : (
            <ul className="space-y-3">
              {chats.slice(0, 4).map((chat) => (
                <li key={chat.id}>
                  <Link to={`/chat/${chat.id}`} className="block rounded-xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                    <p className="font-medium dark:text-white">{chat.title}</p>
                    <p className="truncate text-sm text-slate-500">{chat.preview}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(chat.updatedAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-3">
          <Card>
            <HeartPulse className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm text-slate-500">Profile completeness</p>
            <p className="text-2xl font-bold dark:text-white">Keep it current</p>
            <Badge tone="info">Informational</Badge>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Reports on file</p>
            <p className="text-2xl font-bold dark:text-white">Manage securely</p>
            <Link to="/reports" className="text-sm font-medium text-brand-700">
              Open reports
            </Link>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  )
}
