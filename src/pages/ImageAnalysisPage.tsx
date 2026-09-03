import { useMemo, useState } from 'react'
import { FileUploader } from '../components/FileUploader'
import { Button, Card, Disclaimer, ErrorState, LoadingSpinner, PageHeader } from '../components/ui'
import { analyzeImage } from '../services/reportService'
import type { ReportAnalysis } from '../types'
import { AppError } from '../services/api'

export function ImageAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ReportAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  const analyze = async () => {
    if (!file) {
      setError('Please choose an image to analyze.')
      return
    }
    setLoading(true)
    setError('')
    try {
      setResult(await analyzeImage(file))
    } catch (err) {
      setError(
        err instanceof AppError
          ? err.message
          : 'Something went wrong while connecting to AarogyamCare AI. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Analysis"
        description="Upload a supported image for informational AI commentary. This is not a diagnostic tool."
      />
      <Card>
        <FileUploader
          accept="image/png,image/jpeg,.png,.jpg,.jpeg"
          onFile={setFile}
          fileName={file?.name}
          previewUrl={previewUrl}
          label="Upload a medical image"
        />
        <Button className="mt-4" onClick={() => void analyze()} disabled={loading}>
          Analyze
        </Button>
      </Card>
      {loading && <LoadingSpinner label="Reviewing your image" />}
      {error && <ErrorState message={error} onRetry={() => void analyze()} />}
      {result && (
        <Card>
          <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            AI-generated content. Not a confirmed medical diagnosis.
          </p>
          <h2 className="font-semibold dark:text-white">AI result</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.summary}</p>
        </Card>
      )}
      <Disclaimer />
    </div>
  )
}
