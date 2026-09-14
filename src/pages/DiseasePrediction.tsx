import { BrainCircuit, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, Disclaimer, ErrorState, LoadingSpinner, PageHeader } from '../components/ui'
import { fetchAvailableSymptoms, predictDisease } from '../services/diseasePredictionService'
import type { DiseasePredictionResponse } from '../types'
import { AppError } from '../services/api'

function displaySymptom(symptom: string): string {
  return symptom.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function DiseasePredictionPage() {
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [result, setResult] = useState<DiseasePredictionResponse | null>(null)
  const [loadingSymptoms, setLoadingSymptoms] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState('')

  const loadSymptoms = async () => {
    setLoadingSymptoms(true)
    setError('')
    try {
      setSymptoms(await fetchAvailableSymptoms())
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load the available symptoms.')
    } finally {
      setLoadingSymptoms(false)
    }
  }

  useEffect(() => {
    void loadSymptoms()
  }, [])

  const toggleSymptom = (symptom: string) => {
    setResult(null)
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    )
  }

  const predict = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom before predicting.')
      return
    }
    setPredicting(true)
    setError('')
    try {
      setResult(await predictDisease(selectedSymptoms))
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'The prediction could not be completed.')
    } finally {
      setPredicting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disease Prediction"
        description="Select symptoms to receive an educational machine-learning prediction. It is not a medical diagnosis."
      />

      <Card>
        <div className="flex items-start gap-3">
          <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
          <div>
            <h2 className="font-semibold dark:text-white">Select your symptoms</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose all symptoms that apply. The available choices come from the model&apos;s training data.
            </p>
          </div>
        </div>
        {loadingSymptoms ? (
          <LoadingSpinner label="Loading available symptoms" />
        ) : (
          <>
            <p className="mt-5 text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedSymptoms.length} symptom{selectedSymptoms.length === 1 ? '' : 's'} selected
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom)
                return (
                  <label
                    key={symptom}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSymptom(symptom)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-slate-700 dark:text-slate-200">{displaySymptom(symptom)}</span>
                  </label>
                )
              })}
            </div>
            <Button className="mt-5" onClick={() => void predict()} disabled={predicting || symptoms.length === 0} loading={predicting}>
              Predict possible condition
            </Button>
          </>
        )}
      </Card>

      {error && <ErrorState message={error} onRetry={symptoms.length === 0 ? () => void loadSymptoms() : () => void predict()} />}

      {result && (
        <Card className="border-brand-200 bg-gradient-to-br from-white to-brand-50 dark:border-brand-900 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Possible condition</p>
              <h2 className="mt-1 text-2xl font-bold dark:text-white">{result.prediction}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Model confidence: <strong>{Math.round(result.confidence * 100)}%</strong>
              </p>
            </div>
          </div>
          <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {result.message}
          </p>
        </Card>
      )}
      <Disclaimer />
    </div>
  )
}
