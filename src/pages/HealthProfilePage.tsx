import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, Input, PageHeader, Textarea } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { fetchHealthProfile, saveHealthProfile } from '../services/reportService'
import type { HealthProfile } from '../types'
import { useAuth } from '../context/AuthContext'

const PROFILE_KEY = 'aarogyamcare.profile'

const emptyProfile = (name: string): HealthProfile => ({
  name,
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  height: '',
  weight: '',
  allergies: '',
  conditions: '',
  medications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
})

export function HealthProfilePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<HealthProfile>(() => {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as HealthProfile
      } catch {
        /* ignore */
      }
    }
    return emptyProfile(user?.name ?? '')
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchHealthProfile()
      .then(setProfile)
      .catch(() => {
        /* keep local profile */
      })
  }, [])

  const set = (key: keyof HealthProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    try {
      await saveHealthProfile(profile)
      showToast('Health profile saved.', 'success')
    } catch {
      showToast('Saved on this device. Cloud sync is unavailable right now.', 'info')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader
        title="Health Profile"
        description="Store only what you need. Sensitive details stay on this device unless your backend is connected."
        actions={
          <Button type="submit" loading={saving} disabled={saving}>
            Save Changes
          </Button>
        }
      />
      <div className="grid gap-4">
        <Card>
          <h2 className="mb-4 font-semibold dark:text-white">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={profile.name} onChange={(e) => set('name', e.target.value)} />
            <Input label="Date of Birth" type="date" value={profile.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
            <Input label="Gender" value={profile.gender} onChange={(e) => set('gender', e.target.value)} />
            <Input label="Blood Group" value={profile.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} />
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold dark:text-white">Health Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Height" value={profile.height} onChange={(e) => set('height', e.target.value)} />
            <Input label="Weight" value={profile.weight} onChange={(e) => set('weight', e.target.value)} />
          </div>
          <div className="mt-4 space-y-4">
            <Textarea label="Allergies" value={profile.allergies} onChange={(e) => set('allergies', e.target.value)} />
            <Textarea label="Existing Conditions" value={profile.conditions} onChange={(e) => set('conditions', e.target.value)} />
            <Textarea label="Current Medications" value={profile.medications} onChange={(e) => set('medications', e.target.value)} />
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold dark:text-white">Emergency Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Emergency Contact" value={profile.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
            <Input label="Emergency Phone" type="tel" value={profile.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} />
          </div>
        </Card>
      </div>
    </form>
  )
}
