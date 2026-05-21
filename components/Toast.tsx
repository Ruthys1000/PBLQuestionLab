'use client'

import { useEffect } from 'react'
import { CheckCircle, Info } from 'lucide-react'

interface Props {
  message: string
  type?: 'success' | 'info'
  onDismiss: () => void
}

export default function Toast({ message, type = 'success', onDismiss }: Props) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 3500)
    return () => clearTimeout(id)
  }, [onDismiss])

  const isSuccess = type === 'success'

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ' +
        'flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl ' +
        'text-sm font-medium border animate-in fade-in slide-in-from-bottom-2 duration-200 ' +
        (isSuccess
          ? 'bg-emerald-900/90 border-emerald-700/60 text-emerald-200'
          : 'bg-blue-900/90 border-blue-700/60 text-blue-200')
      }
    >
      {isSuccess
        ? <CheckCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        : <Info className="w-4 h-4 shrink-0" strokeWidth={1.5} />
      }
      {message}
    </div>
  )
}
