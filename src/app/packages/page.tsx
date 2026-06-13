'use client'

import { useEffect, useState } from 'react'
import Toast from '@/components/toast'

interface Notification {
  message: string
  type: 'success' | 'error' | 'info'
}

function PhoneInputBlock({
  onPhoneSaved,
}: {
  onPhoneSaved: (value: string) => void
}) {
  const [value, setValue] = useState('')
  const canSave = value.trim().length >= 6

  return (
    <div id="phone-capture-block" className="max-w-xl mx-auto mb-10">
      <div className="glass rounded-2xl border border-[#22c55e]/20 p-6">
        <div className="text-center mb-4">
          <div className="text-2xl font-black text-[#22c55e] mb-1">Phone number</div>
          <div className="text-gray-300">Enter your phone number to buy VIP signals.</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="tel"
            placeholder="e.g. 0712345678 or +254712345678"
            className="flex-1 bg-black/30 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none"
          />
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              const phone = value.trim()
              onPhoneSaved(phone)
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl text-lg font-black shadow-2xl border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
    Notification.requestPermission().then((permission) => {
      console.log('Notification permission:', permission)
    })
  }
}

export default function Packages() {
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const packages = [
    { id: 'basic', name: 'BASIC 30MIN', price: 100, duration: 30, popular: false },
    { id: 'pro', name: 'PRO 2HR', price: 500, duration: 120, popular: true },
    { id: 'vip', name: 'VIP 24HR', price: 2000, duration: 1440, popular: false },
  ]

  const handlePay = async (pkg: { id: string; price: number }) => {
    const phone = localStorage.getItem('aviator_phone') || ''

    if (!phone) {
      setNotification({ message: 'Enter your phone number first.', type: 'error' })
      const target = document.getElementById('phone-capture-block')
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          packageId: pkg.id,
          amount: pkg.price,
          Provider: pkg.id,
        }),
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
      setLoading(false)
    }
  }

  return (
    <>
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="min-h-screen py-24 px-4 bg-[#0a0e17] aviator-grid-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent drop-shadow-2xl">
              BUY AVIATOR SIGNALS
            </h1>
            <p className="text-2xl text-[#22c55e] mb-8 multiplier-glow">VIP signals via payment</p>
          </div>

          <PhoneInputBlock
            onPhoneSaved={(value) => {
              localStorage.setItem('aviator_phone', value)
              setNotification({ message: 'Phone saved. You can now buy.', type: 'success' })
            }}
          />

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={
                  'glass rounded-3xl shadow-2xl border-2 transition-all hover:scale-105 ' +
                  (pkg.popular
                    ? 'border-[#22c55e] ring-2 ring-[#22c55e]/30'
                    : 'border-gray-700/50')
                }
              >
                {pkg.popular && (
                  <div className="relative z-10 -mt-5 mx-auto w-fit bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl mb-2 border border-orange-400">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-10 pt-4">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-black mb-4 text-[#22c55e]">{pkg.name}</h2>
                    <div className="text-6xl font-black text-red-400 mb-2">KSH {pkg.price}</div>
                    <div className="text-xl opacity-80 mb-8 text-gray-400">
                      {pkg.id === 'basic'
                        ? '30 Minutes Access'
                        : pkg.id === 'pro'
                          ? '2 Hours Access'
                          : '24 Hours Access'}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-10 text-left">
                    <li className="flex items-center text-gray-300">
                      <span className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center mr-3 text-black font-bold text-sm">✓</span>
                      All Betting Site Signals
                    </li>
                    <li className="flex items-center text-gray-300">
                      <span className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center mr-3 text-black font-bold text-sm">✓</span>
                      Instant signals access
                    </li>
                    <li className="flex items-center text-gray-300">
                      <span className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center mr-3 text-black font-bold text-sm">✓</span>
                      Valid for {pkg.duration >= 1440 ? '24 Hours' : pkg.duration >= 120 ? '2 Hours' : '30 Minutes'}
                    </li>
                  </ul>

                  <button
                    onClick={() => handlePay(pkg)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-6 px-8 rounded-2xl text-xl font-black shadow-2xl hover:from-red-500 hover:to-red-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                  >
                    {loading ? 'PLEASE WAIT...' : 'BUY'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-24 p-12 glass rounded-3xl border-2 border-[#22c55e]/20">
            <h3 className="text-3xl font-black mb-6 text-[#22c55e]">Purchase Flow Enabled</h3>
            <ol className="text-xl space-y-4 max-w-2xl mx-auto text-gray-300">
              <li>1. Enter phone</li>
              <li>2. Select a package & pay</li>
              <li>3. Access after payment</li>
              <li>4. Take a screenshot of the signals and bet on your favorite betting site</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  )
}

