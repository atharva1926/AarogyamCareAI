import { useMemo, useState } from 'react'
import { FileUploader } from '../components/FileUploader'
import { Button, Card, Disclaimer, ErrorState, LoadingSpinner, PageHeader } from '../components/ui'
import { analyzeReport } from '../services/reportService'
import type { ReportAnalysis } from '../types'
import { AppError } from '../services/api'

function ResultView({ result }: { result: ReportAnalysis }) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
        AI-generated content. This is not a medical diagnosis.
      </p>
      <Card>
        <h2 className="font-semibold dark:text-white">Summary</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{result.summary}</p>
      </Card>
      <Card>
        <h2 className="font-semibold dark:text-white">Key Findings</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          {result.keyFindings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold dark:text-white">Important Values</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {result.importantValues.map((item) => (
            <li key={item.label} className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
              <span>{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold dark:text-white">Possible Concerns</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          {result.possibleConcerns.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold dark:text-white">Questions to Ask a Doctor</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
          {result.questionsForDoctor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

export function ReportAnalysisPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ReportAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const previewUrl = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file])

  const analyze = async () => {
    if (!file) {
      setError('Please upload a report first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await analyzeReport(file)
      setResult(data)
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
        title="Report Analysis"
        description="Upload a supported document, preview it, then generate an informational AI summary."
      />
      <Card>
        <FileUploader onFile={setFile} fileName={file?.name} previewUrl={previewUrl} label="Upload report" />
        {file && file.type === 'application/pdf' && <p className="mt-3 text-sm text-slate-500">PDF selected. Preview is available after opening the original file.</p>}
        <Button className="mt-4" onClick={() => void analyze()} disabled={loading}>
          Analyze
        </Button>
      </Card>
      {loading && <LoadingSpinner label="Analyzing your report" />}
      {error && <ErrorState message={error} onRetry={() => void analyze()} />}
      {result && <ResultView result={result} />}
      <Disclaimer />
    </div>
  )
}
