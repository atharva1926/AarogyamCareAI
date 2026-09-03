import { Activity, FileSearch, HeartPulse, ShieldAlert, Stethoscope, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { ThreeScene } from '../components/ThreeScene'
import { Button, Card, Disclaimer } from '../components/ui'

const features = [
  { icon: Stethoscope, title: 'AI Health Assistant', body: 'Ask general health questions and receive clear, cautious guidance.' },
  { icon: FileSearch, title: 'Health Reports', body: 'Upload supported documents and keep them organized in one place.' },
  { icon: Activity, title: 'Symptom Guidance', body: 'Describe how you feel and get questions that help you prepare for care.' },
  { icon: FileSearch, title: 'Document Analysis', body: 'Get AI-generated summaries of reports — never a diagnosis.' },
  { icon: UserRound, title: 'Health Profile', body: 'Store the basics your assistant needs to keep conversations relevant.' },
  { icon: ShieldAlert, title: 'Emergency Support', body: 'Quick access to emergency numbers, hospitals, and first-aid reminders.' },
]

export function LandingPage() {
  return (
    <div className="min-h-svh bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(37,99,235,0.16),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="page-enter">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">AarogyamCare AI</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Your Intelligent Healthcare Companion
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Ask health-related questions, understand your symptoms, analyze supported medical documents, and receive AI-powered general health guidance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Try AI Assistant
                </Button>
              </Link>
            </div>
            <Disclaimer className="mt-6 max-w-lg" />
          </div>
          <div className="relative h-[360px] overflow-hidden rounded-3xl border border-white/40 bg-slate-900 shadow-xl sm:h-[440px]">
            <ThreeScene variant="landing" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Built for clarity and trust</h2>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          A modern healthcare workspace — not a clinic portal — designed around questions, context, and next steps.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="transition hover:-translate-y-0.5 hover:shadow-md">
              <feature.icon className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { step: '01', title: 'Create your space', body: 'Sign up and add only the health context you are comfortable sharing.' },
              { step: '02', title: 'Ask or upload', body: 'Chat with the assistant or add a supported report or image for review.' },
              { step: '03', title: 'Review with care', body: 'Read AI summaries as conversation starters for a licensed clinician.' },
            ].map((item) => (
              <Card key={item.step}>
                <p className="text-sm font-bold text-brand-600">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold dark:text-white">About AarogyamCare AI</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              We combine a calm clinical aesthetic with modern AI so people can prepare better questions before they see a professional. The product is informational by design.
            </p>
          </div>
          <Card>
            <HeartPulse className="h-8 w-8 text-brand-600" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Responses are generated through your own backend and Google Gemini. The Gemini API key never lives in this frontend.
            </p>
          </Card>
        </div>
      </section>

      <section id="contact" className="bg-gradient-to-r from-brand-700 to-medical-700 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">Ready when you are</h2>
          <p className="mt-2 text-white/80">Create an account and start a conversation with AarogyamCare AI.</p>
          <Link to="/signup" className="mt-6 inline-block">
            <Button variant="secondary">Get Started</Button>
          </Link>
          <p className="mt-8 text-sm text-white/70">Contact:  support@aarogyamcare.ai</p>
        </div>
      </section>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        <Disclaimer className="mx-auto max-w-3xl px-4" />
      </footer>
    </div>
  )
}
