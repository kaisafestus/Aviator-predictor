'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PaymentSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [countdown, setCountdown] = useState(5)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const transactionId = searchParams.get('transaction')
  const packageName = searchParams.get('package') || 'VIP'
  const amount = searchParams.get('amount') || 'KSH 100'
  const phone = searchParams.get('phone') || '0710******'

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen py-24 px-4 bg-[#0a0e17] aviator-grid-bg flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center glass p-12 rounded-3xl shadow-2xl border border-[#22c55e]/30">
        <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-xl">
          <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#22c55e] to-green-500 bg-clip-text text-transparent">
          Payment Successful!
        </h1>
        
        <div className="space-y-4 mb-8 text-xl text-gray-300">
          <p><span className="font-mono text-green-400">✓</span> {packageName} Package Activated</p>
          <p><span className="font-mono text-green-400">✓</span> KSH {amount} charged to {phone}</p>
          <p><span className="font-mono text-green-400">✓</span> Transaction ID: <code className="bg-black/30 px-2 py-1 rounded text-green-400">{transactionId}</code></p>
        </div>
        
        <div className="glass-p-8 rounded-2xl border border-green-500/30 mb-8">
          <p className="text-2xl font-bold text-[#22c55e] mb-2">🚀 Aviator Signals Ready!</p>
          <p className="text-lg text-green-300">Redirecting to dashboard in <span className="text-2xl font-black text-yellow-400">{countdown}</span>s</p>
        </div>
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-12 py-4 rounded-2xl font-black text-xl shadow-2xl transition-all transform hover:scale-105 border border-green-500/50"
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  )
}

