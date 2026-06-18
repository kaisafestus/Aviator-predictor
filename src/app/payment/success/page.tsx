'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ClientPaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const transactionId = searchParams.get('transaction')
  const packageName = searchParams.get('package') || 'VIP'
  const amount = searchParams.get('amount') || '100'
  const phone = searchParams.get('phone') || '0710******'

  // Poll verify-access until paid (max 3 minutes)
  const [status, setStatus] = useState<'waiting' | 'granted' | 'timeout'>('waiting')
  const [dots, setDots] = useState('.')
  const [secondsWaited, setSecondsWaited] = useState(0)
  const MAX_WAIT = 180 // 3 minutes

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(dotsInterval)
  }, [])

  useEffect(() => {
    if (status !== 'waiting') return

    let elapsed = 0
    const poll = setInterval(async () => {
      elapsed += 5
      setSecondsWaited(elapsed)

      if (elapsed >= MAX_WAIT) {
        clearInterval(poll)
        setStatus('timeout')
        return
      }

      try {
        const res = await fetch(`/api/verify-access?phone=${encodeURIComponent(phone)}`)
        const data = await res.json().catch(() => ({}))
        if (data.hasAccess) {
          clearInterval(poll)
          setStatus('granted')
        }
      } catch {
        // network error – keep polling
      }
    }, 5000) // check every 5 seconds

    return () => clearInterval(poll)
  }, [phone, status])

  // Auto-redirect once access is granted
  useEffect(() => {
    if (status === 'granted') {
      const t = setTimeout(() => router.push('/dashboard'), 2000)
      return () => clearTimeout(t)
    }
  }, [status, router])

  return (
    <div className="min-h-screen py-24 px-4 bg-[#0a0e17] aviator-grid-bg flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center glass p-12 rounded-3xl shadow-2xl border border-[#22c55e]/30">

        {status === 'waiting' && (
          <>
            <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-xl animate-pulse">
              <span className="text-5xl">📱</span>
            </div>
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Check Your Phone!
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              An M-Pesa prompt has been sent to <span className="text-[#22c55e] font-bold">{phone}</span>.<br />
              Enter your PIN to complete payment.
            </p>
            <div className="glass p-6 rounded-2xl border border-yellow-400/30 mb-8">
              <p className="text-2xl font-bold text-yellow-400">Waiting for payment{dots}</p>
              <p className="text-gray-400 mt-2 text-sm">
                {secondsWaited > 0 ? `${secondsWaited}s elapsed` : 'Checking in 5 seconds'}
              </p>
            </div>
            <div className="space-y-3 text-left text-gray-300 text-lg mb-8">
              <p>📦 Package: <span className="font-bold text-white uppercase">{packageName}</span></p>
              <p>💰 Amount: <span className="font-bold text-white">KSH {amount}</span></p>
              {transactionId && (
                <p>🔖 Ref: <code className="bg-black/30 px-2 py-0.5 rounded text-[#22c55e] text-sm">{transactionId}</code></p>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              Didn&apos;t receive the prompt?{' '}
              <button
                onClick={() => router.push('/packages')}
                className="text-[#22c55e] underline hover:no-underline"
              >
                Try again
              </button>
            </p>
          </>
        )}

        {status === 'granted' && (
          <>
            <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-xl">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#22c55e] to-green-500 bg-clip-text text-transparent">
              Payment Confirmed!
            </h1>
            <p className="text-xl text-[#22c55e] font-bold mb-4">Redirecting to your signals dashboard...</p>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="w-32 h-32 bg-gradient-to-r from-red-500 to-red-700 rounded-full mx-auto mb-8 flex items-center justify-center shadow-xl">
              <span className="text-5xl">⏰</span>
            </div>
            <h1 className="text-5xl font-black mb-4 text-red-400">Payment Timed Out</h1>
            <p className="text-xl text-gray-300 mb-8">
              We didn&apos;t receive confirmation in time. If you paid, your access will activate shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-[#22c55e] to-green-600 text-black px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-105"
              >
                Check Dashboard
              </button>
              <button
                onClick={() => router.push('/packages')}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all hover:scale-105 border border-red-500/30"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xl text-white">Loading...</div>}>
      <ClientPaymentSuccess />
    </Suspense>
  )
}
