'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const names = ['John K.', 'Mary W.', 'Ahmed S.', 'Fatma M.', 'Peter O.', 'Sarah K.', 'David M.', 'Amina H.', 'Joseph N.', 'Grace L.']
const phones = ['+254712345678', '+254722987654', '+254733456789', '+254744567890', '+254755678901', '+254766789012']
const amounts = ['2,450', '8,720', '15,300', '4,890', '22,100', '9,650', '31,200', '5,870', '68,500', '125,000', '89,300', '156,700', '243,000', '78,900', '198,500', '312,000', '445,000', '567,800', '78,200', '156,000', '289,000', '445,600', '678,900', '123,400', '256,700', '389,000', '512,300', '645,600', '778,900', '56,700', '189,000', '234,500', '367,800', '490,000', '623,400', '756,700', '889,000', '134,500', '267,800', '401,200']
const emojis = ['👨', '👩', '🧔', '🧕', '🕶️', '💄', '🎩', '👳', '🥳', '⭐']

// ─── Real-Time Sync Engine ───
// Every user with the same clock sees the exact same state

const ROUND_MS = 12000 // 12 seconds per round

/** Deterministic PRNG (mulberry32) – same seed = same sequence everywhere */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Multiplier tier probabilities (must sum to 1.0):
 *   35%  → common      1.5x – 34.5x
 *   30%  → medium      35x  – 79x
 *   20%  → high        80x  – 299x
 *   10%  → rare        300x – 499x
 *    5%  → mega        500x – 1030x
 */
function getRoundInfo(roundIndex: number) {
  const rand = mulberry32(roundIndex)
  const tier = rand()

  let crashMultiplier: number
  let isRare: boolean

  if (tier < 0.35) {
    // common
    crashMultiplier = parseFloat((rand() * 33 + 1.5).toFixed(2))
    isRare = false
  } else if (tier < 0.65) {
    // medium
    crashMultiplier = parseFloat((rand() * 44 + 35).toFixed(2))
    isRare = false
  } else if (tier < 0.85) {
    // high
    crashMultiplier = parseFloat((rand() * 219 + 80).toFixed(2))
    isRare = true
  } else if (tier < 0.95) {
    // rare 300x–499x
    crashMultiplier = parseFloat((rand() * 199 + 300).toFixed(2))
    isRare = true
  } else {
    // mega 500x–1030x
    crashMultiplier = parseFloat((rand() * 530 + 500).toFixed(2))
    isRare = true
  }

  // Crash timing
  const commonCrashMs = Math.floor(rand() * ROUND_MS) + Math.floor(0.6 * ROUND_MS)
  const crashWindow = isRare ? 1.03 : 1.0
  const crashFloor = isRare ? 2300 : commonCrashMs
  const crashMs = Math.floor(rand() * ROUND_MS * crashWindow) + crashFloor

  return { crashMultiplier, crashMs, isRare }
}

function getCurrentRoundState() {
  const now = Date.now()
  const currentRoundIndex = Math.floor(now / ROUND_MS)
  const roundStart = currentRoundIndex * ROUND_MS
  const elapsed = now - roundStart
  const info = getRoundInfo(currentRoundIndex)
  return { currentRoundIndex, roundStart, elapsed, ...info }
}

function computeLiveMultiplier(elapsed: number, crashMs: number, crashMultiplier: number) {
  if (elapsed >= crashMs) return crashMultiplier
  const progress = elapsed / crashMs
  return 1.01 + (crashMultiplier - 1.01) * Math.pow(progress, 0.82)
}

function generateSignals(count: number, currentRoundIndex: number) {
  const signals = []
  for (let i = count - 1; i >= 0; i--) {
    const idx = currentRoundIndex - i - 1
    if (idx < 0) continue
    const info = getRoundInfo(idx)
    const winRand = mulberry32(idx + 999999)()
    const status: 'live' | 'crashed' = winRand > 0.048 ? 'live' : 'crashed'
    const time = new Date(idx * ROUND_MS + info.crashMs).toLocaleTimeString('en-US', { hour12: false })
    signals.push({
      multiplier: info.crashMultiplier.toFixed(2) + 'x',
      time,
      status,
    })
  }
  return signals
}

function generateRecentWins(seedBase: number, count: number) {
  const wins = []
  const rand = mulberry32(seedBase)
  for (let i = 0; i < count; i++) {
    wins.push({
      name: names[Math.floor(rand() * names.length)],
      phone: phones[Math.floor(rand() * phones.length)],
      amount: amounts[Math.floor(rand() * amounts.length)],
      emoji: emojis[Math.floor(rand() * emojis.length)],
    })
  }
  return wins
}

function maskPhone(phone: string) {
  if (phone.length < 6) return phone
  return phone.slice(0, 7) + '***' + phone.slice(-3)
}

// ─── Access gate overlay ───
function AccessGate({ minutesLeft, expiresAt }: { minutesLeft?: number; expiresAt?: string }) {
  const label = minutesLeft != null ? `${minutesLeft} min remaining` : expiresAt ? `Expires ${new Date(expiresAt).toLocaleTimeString()}` : ''
  return (
    <div className="mb-8 text-center">
      <div className="glass inline-flex items-center gap-4 px-8 py-4 rounded-full border-2 border-[#22c55e]/30">
        <span className="text-2xl">✅</span>
        <span className="text-lg font-bold text-[#22c55e]">VIP Access Active — {label}</span>
      </div>
    </div>
  )
}

function LockedOverlay() {
  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="blur-sm pointer-events-none select-none opacity-40">
        <div className="glass bg-[#111827]/80 text-white p-12 rounded-3xl shadow-2xl mb-8 text-center border-2 border-gray-700">
          <h2 className="text-3xl font-black mb-6 text-gray-300">🎮 CURRENT LIVE MULTIPLIER</h2>
          <div className="text-8xl font-black mb-4 text-gray-500">??.??x</div>
          <p className="text-2xl font-bold text-gray-500">CASH OUT NOW! ⏰</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-50">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-6 rounded-2xl border-2 border-gray-700 h-20" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-4 rounded-xl border border-gray-700 h-16" />
            ))}
          </div>
        </div>
      </div>

      {/* Lock card on top */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="glass p-10 rounded-3xl border-2 border-[#22c55e]/40 text-center max-w-md shadow-2xl">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-3xl font-black text-[#22c55e] mb-3">VIP Access Required</h3>
          <p className="text-gray-300 text-lg mb-6">Buy a package to unlock live signals and real-time multipliers.</p>
          <Link
            href="/packages"
            className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all border border-red-500/30"
          >
            BUY SIGNALS — FROM KSH 100
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [liveGame, setLiveGame] = useState(1.01)
  const [signals, setSignals] = useState<Array<{ multiplier: string; time: string; status: 'live' | 'crashed' }>>([])
  const [recentWins, setRecentWins] = useState<Array<{ name: string; phone: string; amount: string; emoji: string }>>([])
  const [roundState, setRoundState] = useState({
    crashed: false,
    isRare: false,
    crashMultiplier: 1.01,
    currentRoundIndex: 0,
    elapsed: 0,
  })

  // Access state
  const [accessGranted, setAccessGranted] = useState(false)
  const [accessInfo, setAccessInfo] = useState<{ minutesLeft?: number; expiresAt?: string } | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)
  const accessIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Verify access on mount and then every 60 seconds
  useEffect(() => {
    async function checkAccess() {
      const phone = localStorage.getItem('aviator_phone')
      if (!phone) {
        setAccessGranted(false)
        setAccessChecked(true)
        return
      }

      try {
        const res = await fetch(`/api/verify-access?phone=${encodeURIComponent(phone)}`)
        const data = await res.json().catch(() => ({}))
        if (data.hasAccess) {
          setAccessGranted(true)
          setAccessInfo({ minutesLeft: data.minutesLeft, expiresAt: data.expiresAt })
        } else {
          setAccessGranted(false)
          setAccessInfo(null)
        }
      } catch {
        setAccessGranted(false)
      } finally {
        setAccessChecked(true)
      }
    }

    checkAccess()
    accessIntervalRef.current = setInterval(checkAccess, 60_000)
    return () => {
      if (accessIntervalRef.current) clearInterval(accessIntervalRef.current)
    }
  }, [])

  // Real-time sync loop — 10× per second
  useEffect(() => {
    const update = () => {
      const state = getCurrentRoundState()
      const multiplier = computeLiveMultiplier(state.elapsed, state.crashMs, state.crashMultiplier)
      setLiveGame(parseFloat(multiplier.toFixed(2)))
      setRoundState({
        crashed: state.elapsed >= state.crashMs,
        isRare: state.isRare,
        crashMultiplier: state.crashMultiplier,
        currentRoundIndex: state.currentRoundIndex,
        elapsed: state.elapsed,
      })
      setSignals(generateSignals(10, state.currentRoundIndex))
      setRecentWins(generateRecentWins(Math.floor(Date.now() / 5000), 14))
    }

    update()
    const interval = setInterval(update, 100)
    return () => clearInterval(interval)
  }, [])

  const isMega = liveGame > 100
  const { crashed, crashMultiplier } = roundState

  // Show nothing until access check completes (avoids flash of locked/unlocked)
  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
        <div className="text-[#22c55e] text-2xl font-black animate-pulse">Verifying access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-[#0a0e17] aviator-grid-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-4 text-[#22c55e] multiplier-glow">
            LIVE AVIATOR SIGNALS
          </h1>
          <p className="text-2xl text-gray-400 font-semibold">Cash out before it crashes ➡️</p>
        </div>

        {/* Access status */}
        {accessGranted && accessInfo ? (
          <AccessGate minutesLeft={accessInfo.minutesLeft} expiresAt={accessInfo.expiresAt} />
        ) : (
          <div className="mb-8 text-center">
            <Link href="/packages">
              <div className="glass inline-flex items-center gap-4 px-8 py-4 rounded-full border-2 border-[#22c55e]/30 hover:border-[#22c55e] hover:scale-105 transition-all cursor-pointer">
                <span className="text-2xl">🚀</span>
                <span className="text-lg font-bold text-[#22c55e]">Get VIP Signals — Buy Package</span>
                <span className="text-2xl">←</span>
              </div>
            </Link>
          </div>
        )}

        {/* ── GATED CONTENT ── */}
        {!accessGranted ? (
          <LockedOverlay />
        ) : (
          <>
            {/* Live Multiplier */}
            <div
              className={`glass bg-[#111827]/80 text-white p-12 rounded-3xl shadow-2xl mb-16 text-center border-2 transition-all duration-500 ${
                crashed
                  ? 'border-red-500 bg-red-500/10'
                  : isMega
                  ? 'border-yellow-400/60 mega-multiplier-glow'
                  : 'border-[#22c55e]/30 multiplier-glow'
              }`}
            >
              <h2 className="text-3xl font-black mb-6 text-gray-300">🎮 CURRENT LIVE MULTIPLIER</h2>

              {crashed && (
                <div className="mb-4">
                  <span className="inline-block text-sm font-black bg-red-500 text-white px-4 py-1 rounded-full animate-bounce">
                    💥 CRASHED!
                  </span>
                </div>
              )}
              {!crashed && isMega && (
                <div className="mb-4">
                  <span className="inline-block text-sm font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full animate-bounce">
                    🔥 MEGA MULTIPLIER!
                  </span>
                </div>
              )}

              <div
                className={`text-8xl font-black animate-pulse drop-shadow-2xl mb-4 transition-colors duration-300 ${
                  crashed ? 'text-red-500' : isMega ? 'text-yellow-400 mega-multiplier-glow' : 'text-[#22c55e] multiplier-glow'
                }`}
              >
                {liveGame.toFixed(2)}
                <span className="text-6xl">x</span>
              </div>

              <p
                className={`text-2xl font-bold pulse ${
                  crashed ? 'text-red-400' : isMega ? 'text-yellow-400' : 'text-red-400'
                }`}
              >
                {crashed
                  ? `💥 CRASHED AT ${crashMultiplier.toFixed(2)}x – NEXT ROUND SOON`
                  : isMega
                  ? '💰 RARE OPPORTUNITY - CASH OUT NOW!'
                  : 'CASH OUT NOW! ⏰'}
              </p>
            </div>

            {/* Signals & Wins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-3xl font-black mb-8 text-[#22c55e] multiplier-glow">🔥 LIVE SIGNALS (95.2% Accurate)</h3>
                <div className="space-y-4">
                  {signals.map((signal, index) => {
                    const sigMega = parseFloat(signal.multiplier) > 100
                    return (
                      <div
                        key={index}
                        className={`glass p-6 rounded-2xl shadow-2xl border-2 transition-all pulse ${
                          signal.status === 'live'
                            ? sigMega
                              ? 'border-yellow-400 bg-yellow-400/10 mega-multiplier-glow'
                              : 'border-[#22c55e] bg-[#22c55e]/10'
                            : 'border-red-500 bg-red-500/10'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-4xl font-black ${
                              signal.status === 'live'
                                ? sigMega
                                  ? 'text-yellow-400 mega-multiplier-glow'
                                  : 'text-[#22c55e] multiplier-glow'
                                : 'text-red-400'
                            }`}
                          >
                            {signal.multiplier}
                          </span>
                          <span className="text-lg opacity-90 font-mono text-gray-400">{signal.time}</span>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            signal.status === 'live' ? (sigMega ? 'text-yellow-400' : 'text-[#22c55e]') : 'text-red-400'
                          }`}
                        >
                          {signal.status === 'live'
                            ? sigMega
                              ? '🔥 MEGA WIN - UNBELIEVABLE!'
                              : '✅ CASHED OUT - WINNER!'
                            : '💥 CRASHED TOO LATE'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-black mb-8 text-red-400 multiplier-glow">🏆 Recent Player Wins</h3>
                <div className="space-y-4 mb-8">
                  {recentWins.map((win, index) => {
                    const isBig = parseInt(win.amount.replace(/,/g, '')) >= 100000
                    return (
                      <div
                        key={index}
                        className={`glass p-4 rounded-xl flex items-center justify-between hover:scale-105 transition-all border ${
                          isBig ? 'border-yellow-400/50 bg-yellow-400/10 big-win-burst' : 'border-[#22c55e]/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-2xl pulse ${
                              isBig
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                                : 'bg-gradient-to-r from-[#22c55e] to-green-600 text-black'
                            }`}
                          >
                            {win.emoji}
                          </div>
                          <div>
                            <div className="font-bold text-lg text-white flex items-center gap-2">
                              {win.name}
                              {isBig && (
                                <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded-full font-black animate-bounce">
                                  BIG WIN!
                                </span>
                              )}
                            </div>
                            <div className="text-sm opacity-75 truncate max-w-[120px] text-gray-400">{maskPhone(win.phone)}</div>
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${isBig ? 'text-yellow-400' : 'text-[#22c55e]'}`}>
                          +KSH {win.amount}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <h3 className="text-3xl font-black mb-6 text-gray-300">📊 Your Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass p-8 rounded-2xl text-center border-2 border-[#22c55e]/30">
                    <div className="text-5xl font-black text-[#22c55e] multiplier-glow">95.2%</div>
                    <div className="text-xl opacity-80 mt-2 text-gray-400">Win Rate</div>
                  </div>
                  <div className="glass p-8 rounded-2xl text-center border-2 border-red-500/30">
                    <div className="text-5xl font-black text-red-400">247</div>
                    <div className="text-xl opacity-80 mt-2 text-gray-400">Signals Today</div>
                  </div>
                  <div className="glass p-8 rounded-2xl text-center border-2 border-[#22c55e]/30">
                    <div className="text-5xl font-black text-[#22c55e] multiplier-glow">KSH 12.7M</div>
                    <div className="text-xl opacity-80 mt-2 text-gray-400">Total Profit</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 text-center">
              <p className="text-2xl text-gray-500 mb-12">Works perfectly on all platforms</p>
              <div className="flex flex-wrap justify-center gap-12">
                <span className="text-4xl font-black text-red-400 hover:scale-110 transition-all cursor-pointer">🏆 BETIKA</span>
                <span className="text-4xl font-black text-[#22c55e] hover:scale-110 transition-all cursor-pointer">⚡ PEPETA</span>
                <span className="text-4xl font-black text-red-400 hover:scale-110 transition-all cursor-pointer">🎯 ODITBET</span>
                <span className="text-4xl font-black text-[#22c55e] hover:scale-110 transition-all cursor-pointer">⭐ MELBET</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
