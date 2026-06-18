'use client'

import { useEffect, useState } from 'react'
import Toast from '@/components/toast'

interface Notification {
  message: string
  type: 'success' | 'error' | 'info'
}

function PhoneInputBlock({ onPhoneSaved }: { onPhoneSaved: (value: string) => void }) {
  const [value, setValue] = useState('')
  const canSave = value.trim().length >= 6

  return (
    <div id="phone-capture-block" className="max-w-xl mx-auto mb-10 px-2">
      <div className="glass rounded-2xl border border-[#22c55e]/20 p-5 sm:p-6">
        <div className="text-center mb-4">
          <div className="text-xl sm:text-2xl font-black text-[#22c55e] mb-1">Phone number</div>
          <div className="text-sm sm:text-base text-gray-300">Enter your M-Pesa number to buy VIP signals.</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="tel"
            placeholder="e.g. 0712345678 or +254712345678"
            className="flex-1 bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none text-base"
          />
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onPhoneSaved(value.trim())}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl text-base font-black shadow-2xl border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    Notification.requestPermission().catch(() => {})
  }
}

export default function Packages() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => { requestNotificationPermission() }, [])

  const packages = [
    { id: 'basic', name: 'BASIC 30MIN', price: 100,  duration: 30,   popular: false },
    { id: 'pro',   name: 'PRO 2HR',     price: 500,  duration: 120,  popular: true  },
    { id: 'vip',   name: 'VIP 24HR',    price: 2000, duration: 1440, popular: false },
  ]

  const handlePay = async (pkg: { id: string; price: number }) => {
    const phone = localStorage.getItem('aviator_phone') || ''
    if (!phone) {
      setNotification({ message: 'Enter your phone number first.', type: 'error' })
      document.getElementById('phone-capture-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (loadingId) return
    setLoadingId(pkg.id)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, packageId: pkg.id, amount: pkg.price }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setNotification({ message: data?.error || 'Payment creation failed', type: 'error' })
        return
      }
      const params = new URLSearchParams({
        transaction: data.checkoutId || '',
        package: pkg.id,
        amount: String(pkg.price),
        phone,
      })
      window.location.href = `/payment/success?${params.toString()}`
    } finally {
      setLoadingId(null)
    }
  }

  const durationLabel = (id: string) =>
    id === 'basic' ? '30 Minutes Access' : id === 'pro' ? '2 Hours Access' : '24 Hours Access'

  return (
    <>
      {notification && (
        <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <div className="min-h-screen py-12 sm:py-20 px-4 bg-[#0a0e17] aviator-grid-bg">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent drop-shadow-2xl px-2">
              BUY AVIATOR SIGNALS
            </h1>
            <p className="text-lg sm:text-2xl text-[#22c55e] multiplier-glow">VIP signals via M-Pesa payment</p>
          </div>

          {/* Phone input */}
          <PhoneInputBlock
            onPhoneSaved={(value) => {
              localStorage.setItem('aviator_phone', value)
              setNotification({ message: 'Phone saved. You can now buy.', type: 'success' })
            }}
          />

          {/* Package cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`glass rounded-3xl shadow-2xl border-2 transition-all hover:scale-[1.02] flex flex-col ${
                  pkg.popular ? 'border-[#22c55e] ring-2 ring-[#22c55e]/30' : 'border-gray-700/50'
                }`}
              >
                {pkg.popular && (
                  <div className="relative z-10 -mt-4 mx-auto w-fit bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white px-5 py-1.5 rounded-full font-bold text-sm sm:text-base shadow-xl border border-orange-400">
                    MOST POPULAR
                  </div>
                )}

                <div className={`p-6 sm:p-8 flex flex-col flex-1 ${pkg.popular ? 'pt-4' : ''}`}>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-black mb-3 text-[#22c55e]">{pkg.name}</h2>
                    <div className="text-4xl sm:text-5xl font-black text-red-400 mb-1">KSH {pkg.price}</div>
                    <div className="text-base sm:text-lg opacity-80 text-gray-400">{durationLabel(pkg.id)}</div>
                  </div>

                  <ul className="space-y-3 mb-6 text-left flex-1">
                    {['All Betting Site Signals', 'Instant signals access', `Valid for ${durationLabel(pkg.id)}`].map((feat) => (
                      <li key={feat} className="flex items-center text-gray-300 text-sm sm:text-base">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 bg-[#22c55e] rounded-full flex items-center justify-center mr-3 text-black font-bold text-xs shrink-0">✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePay(pkg)}
                    disabled={loadingId !== null}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 sm:py-5 px-6 rounded-2xl text-lg sm:text-xl font-black shadow-2xl hover:from-red-500 hover:to-red-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                  >
                    {loadingId === pkg.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        PLEASE WAIT...
                      </span>
                    ) : 'BUY NOW'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="text-center mt-16 sm:mt-20 p-6 sm:p-10 glass rounded-3xl border-2 border-[#22c55e]/20">
            <h3 className="text-2xl sm:text-3xl font-black mb-5 text-[#22c55e]">How It Works</h3>
            <ol className="text-base sm:text-lg space-y-3 max-w-xl mx-auto text-gray-300 text-left">
              <li className="flex items-start gap-3"><span className="text-[#22c55e] font-black shrink-0">1.</span> Enter your M-Pesa phone number above</li>
              <li className="flex items-start gap-3"><span className="text-[#22c55e] font-black shrink-0">2.</span> Select a package and tap Buy Now</li>
              <li className="flex items-start gap-3"><span className="text-[#22c55e] font-black shrink-0">3.</span> Enter your M-Pesa PIN on your phone</li>
              <li className="flex items-start gap-3"><span className="text-[#22c55e] font-black shrink-0">4.</span> Get instant access to live signals dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  )
}
