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

  const [status, setStatus] = useState<'waiting' | 'granted' | 'timeout'>('waiting')
  const [dots, setDots] = useState('.')
  const [secondsWaited, setSecondsWaited] = useState(0)
  const MAX_WAIT = 180

  useEffect(() => {
    const i = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 500)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (status !== 'waiting') return
    let elapsed = 0
    const poll = setInterval(async () => {
      elapsed += 5
      setSecondsWaited(elapsed)
      if (elapsed >= MAX_WAIT) { clearInterval(poll); setStatus('timeout'); return }
      try {
        const res = await fetch(`/api/verify-access?phone=${encodeURIComponent(phone)}`)
        const data = await res.json().catch(() => ({}))
        if (data.hasAccess) { clearInterval(poll); setStatus('granted') }
      } catch { /* keep polling */ }
    }, 5000)
    return () => clearInterval(poll)
  }, [phone, status])

  useEffect(() => {
    if (status === 'granted') {
      const t = setTimeout(() => router.push('/dashboard'), 2000)
      return () => clearTimeout(t)
    }
  }, [status, router])

  return (
    <div className="min-h-screen py-12 sm:py-24 px-4 bg-[#0a0e17] aviator-grid-bg flex items-center justify-center">
      <div className="w-full max-w-md sm:max-w-2xl mx-auto text-center glass p-6 sm:p-12 rounded-3xl shadow-2xl border border-[#22c55e]/30">

        {/* WAITING */}
        {status === 'waiting' && (
          <>
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-xl animate-pulse">
              <span className="text-3xl sm:text-5xl">📱</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Check Your Phone!
            </h1>
            <p className="text-sm sm:text-xl text-gray-300 mb-6">
              An M-Pesa prompt was sent to{' '}
              <span className="text-[#22c55e] font-bold break-all">{phone}</span>.<br />
              Enter your PIN to complete payment.
            </p>
            <div className="glass p-4 sm:p-6 rounded-2xl border border-yellow-400/30 mb-6">
              <p className="text-lg sm:text-2xl font-bold text-yellow-400">Waiting for payment{dots}</p>
              <p className="text-gray-400 mt-1 text-xs sm:text-sm">
                {secondsWaited > 0 ? `${secondsWaited}s elapsed` : 'Checking in 5 seconds'}
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3 text-left text-gray-300 text-sm sm:text-lg mb-6">
              <p>📦 Package: <span className="font-bold text-white uppercase">{packageName}</span></p>
              <p>💰 Amount: <span className="font-bold text-white">KSH {amount}</span></p>
              {transactionId && (
                <p className="flex items-start gap-2 flex-wrap">
                  <span>🔖 Ref:</span>
                  <code className="bg-black/30 px-2 py-0.5 rounded text-[#22c55e] text-xs sm:text-sm break-all">{transactionId}</code>
                </p>
              )}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm">
              Didn&apos;t receive the prompt?{' '}
              <button onClick={() => router.push('/packages')} className="text-[#22c55e] underline hover:no-underline">
                Try again
              </button>
            </p>
          </>
        )}

        {/* GRANTED */}
        {status === 'granted' && (
          <>
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 sm:w-20 sm:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-[#22c55e] to-green-500 bg-clip-text text-transparent">
              Payment Confirmed!
            </h1>
            <p className="text-base sm:text-xl text-[#22c55e] font-bold">Redirecting to your signals dashboard...</p>
          </>
        )}

        {/* TIMEOUT */}
        {status === 'timeout' && (
          <>
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-r from-red-500 to-red-700 rounded-full mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-xl">
              <span className="text-3xl sm:text-5xl">⏰</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 text-red-400">Payment Timed Out</h1>
            <p className="text-sm sm:text-xl text-gray-300 mb-8">
              We didn&apos;t receive confirmation in time. If you paid, your access will activate shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto bg-gradient-to-r from-[#22c55e] to-green-600 text-black px-8 py-4 rounded-2xl font-black text-base sm:text-lg shadow-2xl transition-all hover:scale-105"
              >
                Check Dashboard
              </button>
              <button
                onClick={() => router.push('/packages')}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-black text-base sm:text-lg shadow-2xl transition-all hover:scale-105 border border-red-500/30"
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-base sm:text-xl text-white">
        Loading...
      </div>
    }>
      <ClientPaymentSuccess />
    </Suspense>
  )
}
