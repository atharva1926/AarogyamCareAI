import { useCallback, useState, type DragEvent } from 'react'
import { FileUp } from 'lucide-react'
import { cn } from '../utils'

const ACCEPT_DEFAULT = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'

export function FileUploader({
  accept = ACCEPT_DEFAULT,
  onFile,
  previewUrl,
  fileName,
  progress,
  error,
  label = 'Upload a file',
}: {
  accept?: string
  onFile: (file: File) => void
  previewUrl?: string | null
  fileName?: string
  progress?: number
  error?: string
  label?: string
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-2xl border-2 border-dashed p-8 text-center transition',
          dragOver
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
            : 'border-slate-300 dark:border-slate-700',
        )}
      >
        <FileUp className="mx-auto h-8 w-8 text-brand-600" aria-hidden />
        <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        <p className="mt-1 text-sm text-slate-500">PDF, PNG, or JPG. Drag and drop or browse.</p>
        <label className="mt-4 inline-block">
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <span className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
            Browse files
          </span>
        </label>
      </div>
      {fileName && <p className="text-sm text-slate-600 dark:text-slate-300">Selected: {fileName}</p>}
      {typeof progress === 'number' && progress > 0 && progress < 100 && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-valuenow={progress} role="progressbar">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {previewUrl && (
        <img src={previewUrl} alt="Selected file preview" className="max-h-64 rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
      )}
      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
