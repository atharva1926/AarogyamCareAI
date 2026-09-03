import type { HealthProfile, ReportAnalysis } from '../types'
import { apiGet, apiPut, apiUpload } from './api'

export async function uploadReport(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ id: string; name: string }> {
  const form = new FormData()
  form.append('file', file)
  return apiUpload('/api/reports/upload', form, onProgress)
}

export async function analyzeReport(file: File): Promise<ReportAnalysis> {
  const form = new FormData()
  form.append('file', file)
  return apiUpload<ReportAnalysis>('/api/reports/analyze', form)
}

export async function analyzeImage(file: File): Promise<ReportAnalysis> {
  const form = new FormData()
  form.append('file', file)
  return apiUpload<ReportAnalysis>('/api/images/analyze', form)
}

export async function fetchHealthProfile(): Promise<HealthProfile> {
  return apiGet<HealthProfile>('/api/health-profile')
}

export async function saveHealthProfile(profile: HealthProfile): Promise<HealthProfile> {
  return apiPut<HealthProfile>('/api/health-profile', profile)
}
