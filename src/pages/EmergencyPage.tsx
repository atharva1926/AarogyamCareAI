import { PhoneCall } from 'lucide-react'
import { Disclaimer, PageHeader } from '../components/ui'

export function EmergencyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Emergency Assistance" description="If you are in danger, contact local emergency services immediately." />
      <a
        href="tel:112"
        className="flex min-h-24 items-center justify-center rounded-3xl bg-rose-600 text-2xl font-extrabold text-white shadow-lg hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300"
      >
        <PhoneCall className="mr-3 h-8 w-8" />
        Call emergency services
      </a>
      <section className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/40">
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-100">Emergency Numbers</h2>
        <ul className="mt-2 space-y-1 text-rose-900 dark:text-rose-100">
          <li>India: 112 / 108</li>
          <li>Ambulance: 102</li>
          <li>Use your local number if you are outside India.</li>
        </ul>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h2 className="font-bold dark:text-white">Nearby Hospitals</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Open your maps app and search “hospital emergency”. Do not delay care waiting for this app.
        </p>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h2 className="font-bold dark:text-white">First Aid</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>If someone is unresponsive, call emergency services first.</li>
          <li>Keep the person safe and breathing if you are trained to help.</li>
          <li>Do not give medication unless instructed by a professional.</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
        <h2 className="font-bold text-amber-950 dark:text-amber-100">Important Safety Instructions</h2>
        <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
          AarogyamCare AI cannot dispatch help and is not emergency care. If symptoms are severe — chest pain, trouble breathing, stroke signs, heavy bleeding, or suicidal thoughts — call emergency services or go to the nearest emergency department now.
        </p>
      </section>
      <Disclaimer />
    </div>
  )
}
