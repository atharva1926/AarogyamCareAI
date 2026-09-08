import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  LocateFixed,
  MapPinned,
  Navigation,
  Search,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Badge, Button, Card, Input, PageHeader } from '../components/ui'

type Coordinates = { lat: number; lng: number }
type LocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'error'

type CareSearch = {
  title: string
  detail: string
  locatedQuery: string
  fallbackQuery: string
  icon: LucideIcon
}

const searches: CareSearch[] = [
  {
    title: 'Nearby hospitals',
    detail: 'General, urgent and emergency care',
    locatedQuery: 'hospitals+near+me',
    fallbackQuery: 'hospitals+near+me',
    icon: MapPinned,
  },
  {
    title: 'Specialist doctors',
    detail: 'Clinics and specialist hospitals nearby',
    locatedQuery: 'specialist+doctors+clinics',
    fallbackQuery: 'specialist+doctors+clinics+near+me',
    icon: Stethoscope,
  },
  {
    title: 'Emergency department',
    detail: 'Open emergency departments and 24-hour hospitals',
    locatedQuery: 'emergency+room+hospital',
    fallbackQuery: '24+hour+hospital+emergency+department+near+me',
    icon: Navigation,
  },
]

function mapsSearchUrl(locatedQuery: string, fallbackQuery: string, coords: Coordinates | null) {
  if (coords) {
    return `https://www.google.com/maps/search/${locatedQuery}/@${coords.lat},${coords.lng},14z`
  }
  return `https://www.google.com/maps/search/${fallbackQuery}/`
}

function coordinateLabel({ lat, lng }: Coordinates) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export function NearbyCarePage() {
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [locationName, setLocationName] = useState<string | null>(null)
  const [specialtyQuery, setSpecialtyQuery] = useState('')
  const [showMap, setShowMap] = useState(false)

  const hospitalEmbedUrl = useMemo(() => {
    if (!userCoords) return null
    return `https://maps.google.com/maps?q=hospitals+near+${userCoords.lat},${userCoords.lng}&t=&z=13&ie=UTF8&iwloc=&output=embed`
  }, [userCoords])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationName(null)
      return
    }

    setLocationStatus('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextCoords = { lat: coords.latitude, lng: coords.longitude }
        setUserCoords(nextCoords)
        setLocationName(coordinateLabel(nextCoords))
        setLocationStatus('granted')
      },
      (error) => {
        setUserCoords(null)
        setLocationName(null)
        setShowMap(false)
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  }

  const submitSpecialtySearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = specialtyQuery.trim()
    if (!query) return

    const encodedQuery = encodeURIComponent(`${query} near me`)
    const locationPart = userCoords ? `/@${userCoords.lat},${userCoords.lng},14z` : ''
    
    // CHANGED: Navigates within the same tab using window.location.assign (or window.open with '_self')
    window.location.assign(`https://www.google.com/maps/search/${encodedQuery}${locationPart}`)
  }

  const locationNotice =
    locationStatus === 'granted'
      ? `Location acquired${locationName ? ` (${locationName})` : ''}: accurate nearby results enabled.`
      : locationStatus === 'denied'
        ? 'Location access denied. Searches will use your default area in Google Maps.'
        : locationStatus === 'error'
          ? 'We could not determine your location. Searches will use your default area in Google Maps.'
          : 'Your location stays in your browser and is only used to make Google Maps links more relevant.'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find care nearby"
        description="Search Google Maps for hospitals, emergency departments, and specialists close to you."
      />

      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 to-medical-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm dark:bg-slate-800">
              <MapPinned className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold dark:text-white">Use your location</h2>
                {locationStatus === 'granted' && <Badge tone="success"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Location ready</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">{locationNotice}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={useMyLocation}
            disabled={locationStatus === 'locating'}
            aria-label="Use my current location to improve nearby care results"
          >
            <LocateFixed className="h-4 w-4" aria-hidden />
            {locationStatus === 'locating' ? 'Detecting location...' : locationStatus === 'granted' ? 'Update location' : 'Use my location'}
          </Button>
        </div>
      </Card>

      <Card>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submitSpecialtySearch}>
          <div className="flex-1">
            <Input
              label="Search for a clinic or specialty"
              placeholder="e.g. Cardiologist, pediatrician, dentist"
              value={specialtyQuery}
              onChange={(event) => setSpecialtyQuery(event.target.value)}
              aria-label="Search for a specialty in Google Maps"
              hint={userCoords ? 'Google Maps will use your current location.' : 'Use your location for more accurate results, or Google Maps will let you choose an area.'}
            />
          </div>
          <Button type="submit" disabled={!specialtyQuery.trim()} aria-label="Search Google Maps for this specialty">
            <Search className="h-4 w-4" aria-hidden />
            Search Maps
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {searches.map(({ title, detail, locatedQuery, fallbackQuery, icon: Icon }) => {
          const href = mapsSearchUrl(locatedQuery, fallbackQuery, userCoords)
          return (
            <Card key={title} className="flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
              <Icon className="h-6 w-6 text-brand-600" aria-hidden />
              <h2 className="mt-3 font-semibold dark:text-white">{title}</h2>
              <p className="mt-1 flex-1 text-sm text-slate-500">{detail}</p>
              {/* CHANGED: target="_self" opens link in the current tab instead of target="_blank" */}
              <a
                className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-brand-500 dark:text-brand-300"
                href={href}
                target="_self"
                aria-label={`Search Google Maps for ${title}`}
              >
                <Search className="h-4 w-4" aria-hidden />
                Search Google Maps
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Card>
          )
        })}
      </div>

      {hospitalEmbedUrl && (
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="font-semibold dark:text-white">Hospital map preview</h2>
              <p className="mt-1 text-sm text-slate-500">Preview hospitals around your detected location without leaving AarogyamCare.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowMap((visible) => !visible)} aria-expanded={showMap} aria-controls="nearby-hospital-map">
              {showMap ? 'Hide map' : 'Show map'}
              <ChevronDown className={`h-4 w-4 transition ${showMap ? 'rotate-180' : ''}`} aria-hidden />
            </Button>
          </div>
          {showMap && (
            <iframe
              id="nearby-hospital-map"
              title="Nearby hospitals in Google Maps"
              src={hospitalEmbedUrl}
              className="h-[360px] w-full border-0 sm:h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold dark:text-white">Before booking</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Verify the provider, availability, fees, insurance coverage, and emergency capability directly with the clinic. AarogyamCare does not rank, endorse, or book providers.
        </p>
      </Card>
    </div>
  )
}