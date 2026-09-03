import { useMemo, useState } from 'react'
import { FileUploader } from '../components/FileUploader'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { uploadReport } from '../services/reportService'
import type { HealthReport } from '../types'
import { AppError } from '../services/api'
import { createId, formatDate } from '../utils'

const KEY = 'aarogyamcare.reports'

function readReports(): HealthReport[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as HealthReport[]) : []
  } catch {
    return []
  }
}

export function ReportsPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<HealthReport[]>(readReports)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const previewUrl = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file])

  const persist = (next: HealthReport[]) => {
    setReports(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const onUpload = async () => {
    if (!file || !file.size) {
      setError('Please choose a PDF, PNG, or JPG file.')
      return
    }
    setError('')
    setProgress(10)
    const local: HealthReport = {
      id: createId(),
      name: file.name,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      type: file.type,
    }
    try {
      await uploadReport(file, setProgress)
      persist([local, ...reports])
      showToast('Report uploaded.', 'success')
    } catch (err) {
      persist([local, ...reports])
      showToast(
        err instanceof AppError
          ? 'Saved locally. Cloud upload is unavailable right now.'
          : 'Saved locally. Cloud upload is unavailable right now.',
        'info',
      )
    } finally {
      setProgress(100)
      setFile(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Reports"
        description="Upload supported files. Keep originals with your clinician."
        actions={
          <div className="flex gap-2">
            <Link to="/report-analysis">
              <Button variant="outline">Report analysis</Button>
            </Link>
            <Link to="/image-analysis">
              <Button variant="outline">Image analysis</Button>
            </Link>
          </div>
        }
      />
      <Card>
        <FileUploader
          onFile={setFile}
          fileName={file?.name}
          previewUrl={previewUrl}
          progress={progress}
          error={error}
          label="Add a health report"
        />
        <Button className="mt-4" onClick={() => void onUpload()} disabled={!file}>
          Upload
        </Button>
      </Card>
      {reports.length === 0 ? (
        <EmptyState title="No reports yet" description="Uploaded files will appear here with date and status." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Upload date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium dark:text-white">{report.name}</td>
                  <td className="px-4 py-3">{formatDate(report.uploadedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone="success">{report.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <a href="/report-analysis" className="font-medium text-brand-700">
                      Analyze
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
