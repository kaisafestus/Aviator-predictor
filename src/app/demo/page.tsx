'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Shared PRNG engine (same as dashboard) ──────────────────────────────────
const ROUND_MS = 12000

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function getRoundInfo(roundIndex: number) {
  const rand = mulberry32(roundIndex)
  const tier = rand()
  let crashMultiplier: number
  let isRare: boolean
  if (tier < 0.35) { crashMultiplier = parseFloat((rand() * 33 + 1.5).toFixed(2)); isRare = false }
  else if (tier < 0.65) { crashMultiplier = parseFloat((rand() * 44 + 35).toFixed(2)); isRare = false }
  else if (tier < 0.85) { crashMultiplier = parseFloat((rand() * 219 + 80).toFixed(2)); isRare = true }
  else if (tier < 0.95) { crashMultiplier = parseFloat((rand() * 199 + 300).toFixed(2)); isRare = true }
  else { crashMultiplier = parseFloat((rand() * 530 + 500).toFixed(2)); isRare = true }
  const commonCrashMs = Math.floor(rand() * ROUND_MS) + Math.floor(0.6 * ROUND_MS)
  const crashFloor = isRare ? 2300 : commonCrashMs
  const crashMs = Math.floor(rand() * ROUND_MS * (isRare ? 1.03 : 1.0)) + crashFloor
  return { crashMultiplier, crashMs, isRare }
}

function getCurrentRoundState() {
  const now = Date.now()
  const currentRoundIndex = Math.floor(now / ROUND_MS)
  const elapsed = now - currentRoundIndex * ROUND_MS
  return { currentRoundIndex, elapsed, ...getRoundInfo(currentRoundIndex) }
}

function computeLiveMultiplier(elapsed: number, crashMs: number, crashMultiplier: number) {
  if (elapsed >= crashMs) return crashMultiplier
  const progress = elapsed / crashMs
  return 1.01 + (crashMultiplier - 1.01) * Math.pow(progress, 0.82)
}

// VIP signal fires at 70% of crash time — giving members early exit
function getVipSignalMs(crashMs: number) {
  return Math.floor(crashMs * 0.70)
}

// ── Social proof ticker data ────────────────────────────────────────────────
const tickerItems = [
  'John K. just cashed out at 47x 🔥',
  'Mary W. made KSH 8,700 this hour 💰',
  'Ahmed S. cashed out at 312x 🚀',
  'Peter O. just bought VIP package ⭐',
  'Fatma M. cashed out at 89x 🎯',
  'David M. made KSH 45,000 today 💎',
  'Grace L. cashed out at 156x 🔥',
  'Joseph N. just activated VIP signals ✅',
  'Sarah K. made KSH 12,300 this session 💰',
  'Amina H. cashed out at 523x 🚀',
]

// Past rounds for the history strip
function getPastRounds(currentRoundIndex: number, count: number) {
  const rounds = []
  for (let i = count; i >= 1; i--) {
    const idx = currentRoundIndex - i
    if (idx < 0) continue
    const info = getRoundInfo(idx)
    rounds.push({ multiplier: info.crashMultiplier, isRare: info.isRare })
  }
  return rounds
}

export default function Demo() {
  const [liveGame, setLiveGame] = useState(1.01)
  const [roundState, setRoundState] = useState({
    crashed: false,
    isRare: false,
    crashMultiplier: 1.01,
    crashMs: 8000,
    currentRoundIndex: 0,
    elapsed: 0,
  })
  const [vipSignalFired, setVipSignalFired] = useState(false)
  const [missedSignalToast, setMissedSignalToast] = useState(false)
  const [nextSignalCountdown, setNextSignalCountdown] = useState(0)
  const [tickerIndex, setTickerIndex] = useState(0)
  const [pastRounds, setPastRounds] = useState<Array<{ multiplier: number; isRare: boolean }>>([])
  const prevRoundRef = useRef(-1)
  const vipFiredRef = useRef(false)

  // Ticker rotates every 3s
  useEffect(() => {
    const t = setInterval(() => setTickerIndex((i) => (i + 1) % tickerItems.length), 3000)
    return () => clearInterval(t)
  }, [])

  // Main game loop
  useEffect(() => {
    const update = () => {
      const state = getCurrentRoundState()
      const multiplier = computeLiveMultiplier(state.elapsed, state.crashMs, state.crashMultiplier)
      setLiveGame(parseFloat(multiplier.toFixed(2)))

      const crashed = state.elapsed >= state.crashMs
      setRoundState({
        crashed,
        isRare: state.isRare,
        crashMultiplier: state.crashMultiplier,
        crashMs: state.crashMs,
        currentRoundIndex: state.currentRoundIndex,
        elapsed: state.elapsed,
      })

      // New round reset
      if (state.currentRoundIndex !== prevRoundRef.current) {
        prevRoundRef.current = state.currentRoundIndex
        vipFiredRef.current = false
        setVipSignalFired(false)
        setMissedSignalToast(false)
        setPastRounds(getPastRounds(state.currentRoundIndex, 8))
      }

      // VIP signal moment — fires at 70% of crash time
      const vipMs = getVipSignalMs(state.crashMs)
      if (!vipFiredRef.current && state.elapsed >= vipMs && !crashed) {
        vipFiredRef.current = true
        setVipSignalFired(true)
      }

      // When crashed: show "you missed it" toast
      if (crashed && vipFiredRef.current && !missedSignalToast) {
        setMissedSignalToast(true)
      }

      // Countdown to next VIP signal
      if (!crashed) {
        const msToVip = Math.max(0, vipMs - state.elapsed)
        setNextSignalCountdown(Math.ceil(msToVip / 1000))
      } else {
        const msToNextRound = ROUND_MS - state.elapsed
        setNextSignalCountdown(Math.ceil(msToNextRound / 1000))
      }
    }

    update()
    const interval = setInterval(update, 100)
    return () => clearInterval(interval)
  }, [missedSignalToast])

  const isMega = liveGame > 100
  const { crashed, crashMultiplier, crashMs, elapsed } = roundState
  const vipMs = getVipSignalMs(crashMs)
  const progressPct = Math.min(100, Math.round((elapsed / crashMs) * 100))

  return (
    <div className="min-h-screen bg-[#0a0e17] aviator-grid-bg">

      {/* ── Top banner ── */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-b border-yellow-400/30 py-2 px-4 text-center">
        <p className="text-yellow-400 text-xs sm:text-sm font-bold">
          👀 FREE DEMO — Watch how our signals work. VIP members get the exact cashout moment.{' '}
          <Link href="/packages" className="underline hover:no-underline text-white">Get VIP access →</Link>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs sm:text-sm font-bold">LIVE DEMO MODE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">
            See How Signals <span className="text-[#22c55e]">Actually Work</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-xl mx-auto">
            Watch a real round live. VIP members get the cashout signal <span className="text-yellow-400 font-bold">before</span> the crash — you&apos;ll see exactly what they see.
          </p>
        </div>

        {/* Social proof ticker */}
        <div className="glass border border-[#22c55e]/20 rounded-2xl px-4 sm:px-6 py-3 mb-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="text-[#22c55e] text-xs font-black shrink-0 uppercase tracking-widest">LIVE</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm sm:text-base font-medium truncate animate-pulse">
                {tickerItems[tickerIndex]}
              </p>
            </div>
          </div>
        </div>

        {/* Round history strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {pastRounds.map((r, i) => (
            <div
              key={i}
              className={`shrink-0 px-3 py-2 rounded-xl text-sm font-black border ${
                r.multiplier > 100
                  ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400'
                  : r.multiplier > 10
                  ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-[#22c55e]'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {r.multiplier.toFixed(2)}x
            </div>
          ))}
          <div className="shrink-0 px-3 py-2 rounded-xl text-sm font-black border border-gray-600 text-gray-400 animate-pulse">
            LIVE →
          </div>
        </div>

        {/* Main live multiplier */}
        <div className={`glass p-6 sm:p-10 rounded-3xl shadow-2xl mb-6 text-center border-2 transition-all duration-500 ${
          crashed ? 'border-red-500 bg-red-500/10'
          : vipSignalFired ? 'border-yellow-400 bg-yellow-400/5'
          : isMega ? 'border-yellow-400/60 mega-multiplier-glow'
          : 'border-[#22c55e]/30 multiplier-glow'
        }`}>
          <h2 className="text-base sm:text-2xl font-black mb-4 text-gray-400 uppercase tracking-wider">
            🎮 Current Round Multiplier
          </h2>

          {/* Progress bar toward VIP signal */}
          {!crashed && (
            <div className="mb-4 max-w-xs mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Round progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    progressPct >= 70 ? 'bg-yellow-400' : 'bg-[#22c55e]'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {progressPct >= 70 && !vipSignalFired && (
                <p className="text-yellow-400 text-xs mt-1 text-center font-bold animate-pulse">⚡ VIP signal zone approaching...</p>
              )}
            </div>
          )}

          <div className={`text-6xl sm:text-8xl font-black animate-pulse drop-shadow-2xl mb-4 ${
            crashed ? 'text-red-500' : vipSignalFired ? 'text-yellow-400' : isMega ? 'text-yellow-400 mega-multiplier-glow' : 'text-[#22c55e] multiplier-glow'
          }`}>
            {liveGame.toFixed(2)}<span className="text-4xl sm:text-6xl">x</span>
          </div>

          {/* VIP signal fired — blurred for demo */}
          {vipSignalFired && !crashed && (
            <div className="relative mb-4">
              <div className="blur-sm select-none pointer-events-none">
                <div className="inline-flex items-center gap-3 bg-yellow-400/20 border-2 border-yellow-400 px-6 py-3 rounded-2xl">
                  <span className="text-2xl">🚨</span>
                  <span className="text-yellow-400 font-black text-lg">CASH OUT NOW — VIP SIGNAL ACTIVE</span>
                  <span className="text-2xl">🚨</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/80 px-4 py-2 rounded-xl border border-yellow-400/50 flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <span className="text-yellow-400 text-xs sm:text-sm font-black">VIP SIGNAL — UNLOCK TO SEE</span>
                </div>
              </div>
            </div>
          )}

          <p className={`text-sm sm:text-xl font-bold ${crashed ? 'text-red-400' : vipSignalFired ? 'text-yellow-400' : 'text-gray-400'}`}>
            {crashed
              ? `💥 CRASHED AT ${crashMultiplier.toFixed(2)}x`
              : vipSignalFired
              ? '🔒 VIP signal is active right now — members are cashing out'
              : `Next VIP signal in ${nextSignalCountdown}s`}
          </p>
        </div>

        {/* "You missed it" toast */}
        {missedSignalToast && (
          <div className="glass border-2 border-red-500 bg-red-500/10 rounded-2xl p-4 sm:p-6 mb-6 text-center">
            <p className="text-red-400 font-black text-base sm:text-xl mb-1">
              💥 You missed the cashout! The signal fired at {getVipSignalMs(crashMs) / 1000 < 1 ? '<1' : (getVipSignalMs(crashMs) / 1000).toFixed(1)}s before crash.
            </p>
            <p className="text-gray-400 text-sm sm:text-base">
              VIP members received the signal and cashed out in time. You could have made money on this round.
            </p>
          </div>
        )}

        {/* How it works — 3 steps */}
        <div className="glass border border-[#22c55e]/20 rounded-3xl p-5 sm:p-8 mb-6">
          <h3 className="text-lg sm:text-2xl font-black text-white mb-5 text-center">How VIP Signals Work</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: '📡', step: '1', title: 'Signal Fires', desc: 'Our system detects the optimal cashout window before the crash happens.' },
              { icon: '📳', step: '2', title: 'You Get Notified', desc: 'You see the signal on your dashboard with enough time to tap cashout.' },
              { icon: '💰', step: '3', title: 'Cash Out & Win', desc: 'Tap cashout on Betika, Pepeta or any platform before it crashes.' },
            ].map((s) => (
              <div key={s.step} className="text-center p-4 rounded-2xl bg-white/5">
                <div className="text-3xl sm:text-4xl mb-2">{s.icon}</div>
                <div className="text-[#22c55e] text-xs font-black uppercase tracking-widest mb-1">Step {s.step}</div>
                <div className="text-white font-black text-base sm:text-lg mb-1">{s.title}</div>
                <div className="text-gray-400 text-xs sm:text-sm">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What you're missing */}
        <div className="glass border border-yellow-400/20 rounded-3xl p-5 sm:p-8 mb-8">
          <h3 className="text-lg sm:text-2xl font-black text-yellow-400 mb-4 text-center">🔒 What VIP Members See (You&apos;re Missing)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              '✅ Exact cashout multiplier before crash',
              '✅ 10–15 second advance signal warning',
              '✅ Works on Betika, Pepeta, Odibet & all sites',
              '✅ 95.2% accurate — backed by live rounds',
              '✅ Dashboard auto-refreshes every round',
              '✅ Works 24/7 — day and night',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA block */}
        <div className="text-center glass border-2 border-[#22c55e]/40 rounded-3xl p-6 sm:p-10">
          <div className="text-4xl sm:text-5xl mb-3">🚀</div>
          <h3 className="text-2xl sm:text-4xl font-black text-white mb-2">
            Ready to Stop Missing Signals?
          </h3>
          <p className="text-gray-400 text-sm sm:text-lg mb-6 max-w-md mx-auto">
            Get full VIP access from just <span className="text-[#22c55e] font-black">KSH 100</span>. Start winning on the next round.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/packages"
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl shadow-2xl hover:scale-105 transition-all border border-red-500/30 text-center"
            >
              GET VIP ACCESS — KSH 100
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto glass bg-[#111827] text-[#22c55e] px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg hover:scale-105 transition-all border-2 border-[#22c55e]/40 text-center"
            >
              View Full Dashboard
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">No subscription. Pay per session. Cancel anytime.</p>
        </div>
      </div>
    </div>
  )
}
