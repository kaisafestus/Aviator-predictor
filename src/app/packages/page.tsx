'use client'

import { useState, useEffect } from 'react'
import Toast from '@/components/toast'

interface Notification {
  message: string
  type: 'success' | 'error' | 'info'
}

/** Request browser notification permission */
function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    Notification.requestPermission().then((permission) => {
      console.log('Notification permission:', permission)
    })
  }
}

/** Show native browser push notification */
function showPushNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.svg',
      badge: '/logo.svg',
      tag: 'aviator-payment',
      requireInteraction: false,
    })
  }
}

export default function Packages() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)

  // Ask for notification permission on first load
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const packages = [
    {
      id: 'basic',
      name: 'BASIC 30MIN',
      price: 100,
      duration: 30,
      features: ['Up to 1000x Returns', 'All Betting Site Signals', 'BETIKA, PEPETA, ODIBET, MELBET', 'Valid for 30 Minutes'],
    },
    {
      id: 'pro',
      name: 'PRO 2HR',
      price: 500,
      duration: 120,
      features: ['Up to 1000x Returns', 'All Betting Site Signals', 'BETIKA, PEPETA, ODIBET, MELBET', 'Valid for 2 Hours'],
      popular: true,
    },
    {
      id: 'vip',
      name: 'VIP 24HR',
      price: 2000,
      duration: 1440,
      features: ['Up to 1000x Returns', 'All Betting Site Signals', 'BETIKA, PEPETA, ODIBET, MELBET', 'Valid for 24 Hours'],
    },
  ]

  const handleBuy = async (pkgId: string) => {
    if (!phone || phone.length < 10) {
      setNotification({ message: 'Enter valid phone (2547xxxxxxxx)', type: 'error' })
      return
    }

    setLoading(pkgId)
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, packageId: pkgId }),
      })

      const data = await res.json()

if (data.success) {
        localStorage.setItem('aviator_phone', phone)
        const msg = `STK Push sent to ${phone}! Enter PIN. ID: ${data.checkoutId}`
        setNotification({ message: msg, type: 'success' })
        showPushNotification('🚀 Aviator Signals — STK Sent', msg)
      } else {
        // Show detailed error from PayHero
        const errorMsg = data.hint ? `${data.error} (${data.hint})` : data.error
        const detailsMsg = data.details ? `\n\nDetails: ${JSON.stringify(data.details)}` : ''
        setNotification({ message: errorMsg + detailsMsg, type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error. Please check connection.', type: 'error' })
    }
    setLoading(null)
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
            <p className="text-2xl text-[#22c55e] mb-8 multiplier-glow">Enter Phone for Secure MPESA STK Push</p>
          </div>

          <div className="mb-16 text-center max-w-2xl mx-auto">
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="2547xxxxxxxx (No +)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="glass w-full p-8 text-2xl rounded-3xl text-center font-mono border-2 border-[#22c55e]/30 focus:border-red-500 transition-all shadow-2xl text-white bg-[#111827]/50 placeholder-gray-500"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div key={pkg.id} className={'glass rounded-3xl shadow-2xl border-2 transition-all hover:scale-105 ' + (pkg.popular ? 'border-[#22c55e] ring-2 ring-[#22c55e]/30' : 'border-gray-700/50')}>
                {pkg.popular && (
                  <div className="relative z-10 -mt-5 mx-auto w-fit bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl mb-2 border border-orange-400">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-10 pt-4">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-black mb-4 text-[#22c55e]">
                      {pkg.name}
                    </h2>
                    <div className="text-6xl font-black text-red-400 mb-2">KSH {pkg.price}</div>
                    <div className="text-xl opacity-80 mb-8 text-gray-400">
                      {pkg.id === 'basic' ? '30 Minutes Access' : pkg.id === 'pro' ? '2 Hours Access' : '24 Hours Access'}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-10 text-left">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-300">
                        <span className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center mr-3 text-black font-bold text-sm">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleBuy(pkg.id)}
                    disabled={loading === pkg.id}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-6 px-8 rounded-2xl text-xl font-black shadow-2xl hover:from-red-500 hover:to-red-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                  >
                    {loading === pkg.id ? 'SENDING STK...' : pkg.id === 'basic' ? 'BUY 30 MIN ACCESS' : pkg.id === 'pro' ? 'BUY 2 HR ACCESS' : 'BUY 24 HR ACCESS'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-24 p-12 glass rounded-3xl border-2 border-[#22c55e]/20">
            <h3 className="text-3xl font-black mb-6 text-[#22c55e]">Secure Payment Flow</h3>
            <ol className="text-xl space-y-4 max-w-2xl mx-auto text-gray-300">
              <li>1. Enter phone → Click Buy</li>
              <li>2. MPESA STK Push to phone</li>
              <li>3. Enter PIN → Payment confirmed</li>
              <li>4. Instant signals access!</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  )
}

