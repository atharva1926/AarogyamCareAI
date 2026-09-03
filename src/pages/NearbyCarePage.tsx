import { ExternalLink, LocateFixed, MapPinned, Navigation, Search, Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, PageHeader } from '../components/ui'

type CareSearch = { title: string; detail: string; query: string; icon: typeof Stethoscope }

const searches: CareSearch[] = [
  { title: 'Nearby hospitals', detail: 'General, urgent and emergency care', query: 'hospital near me', icon: MapPinned },
  { title: 'Specialist doctors', detail: 'Clinics and specialist hospitals nearby', query: 'specialist doctor near me', icon: Stethoscope },
  { title: 'Emergency department', detail: 'Open emergency departments', query: 'emergency hospital near me', icon: Navigation },
]

const googleSearchUrl = (query: string, location?: GeolocationCoordinates) => {
  const locationText = location ? `@${location.latitude},${location.longitude},14z` : ''
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/${locationText}`
}

export function NearbyCarePage() {
  const [location, setLocation] = useState<GeolocationCoordinates>()
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle')

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocationState('denied'); return }
    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => { setLocation(position.coords); setLocationState('granted') },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Find care nearby" description="Search Google Maps for hospitals, emergency departments, and specialists close to you." />
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 to-medical-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-slate-800"><MapPinned className="h-5 w-5" /></span>
            <div><h2 className="font-semibold dark:text-white">Use your location</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your location stays in your browser and is only used to make a Maps link more relevant.</p></div>
          </div>
          <Button variant="outline" onClick={useMyLocation} loading={locationState === 'loading'}><LocateFixed className="h-4 w-4" />{locationState === 'granted' ? 'Location ready' : 'Use my location'}</Button>
        </div>
        {locationState === 'denied' && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Location access was unavailable. Google Maps will still let you choose an area.</p>}
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {searches.map(({ title, detail, query, icon: Icon }) => (
          <Card key={title} className="flex flex-col">
            <Icon className="h-6 w-6 text-brand-600" /><h2 className="mt-3 font-semibold dark:text-white">{title}</h2><p className="mt-1 flex-1 text-sm text-slate-500">{detail}</p>
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300" href={googleSearchUrl(query, location)} target="_blank" rel="noreferrer"><Search className="h-4 w-4" />Search Google Maps <ExternalLink className="h-3.5 w-3.5" /></a>
          </Card>
        ))}
      </div>
      <Card><h2 className="font-semibold dark:text-white">Before booking</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Verify the provider, availability, fees, insurance coverage, and emergency capability directly with the clinic. AarogyamCare does not rank, endorse, or book providers.</p></Card>
    </div>
  )
}
