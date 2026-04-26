'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    success: 'from-[#22c55e] to-green-700 border-[#22c55e]',
    error: 'from-red-600 to-red-800 border-red-500',
    info: 'from-gray-700 to-gray-800 border-gray-500',
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <div className={`fixed top-6 right-6 z-50 animate-slide-in`}>
      <div className={`bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center gap-4 min-w-[320px]`}>
        <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
          {icons[type]}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-sm uppercase tracking-wider opacity-80">{type}</p>
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-white/70 hover:text-white text-xl font-bold transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}

