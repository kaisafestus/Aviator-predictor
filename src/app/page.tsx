import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e17]">

      {/* ── Hero ── */}
      <section className="relative text-white py-16 sm:py-24 lg:py-32 px-4 overflow-hidden aviator-grid-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] via-transparent to-[#0a0e17]" />
        <div className="max-w-7xl mx-auto text-center relative z-10">

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-6">
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent drop-shadow-2xl">
              AVIATOR
            </span>
            <span className="block text-2xl sm:text-4xl font-normal text-[#22c55e] multiplier-glow mt-2">SIGNALS</span>
          </h1>

          <p className="text-xl sm:text-3xl md:text-4xl mb-6 text-[#22c55e] font-semibold pulse px-2">
            95.2% WIN RATE • LIVE CRASH PREDICTIONS
          </p>

          <p className="text-base sm:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto opacity-80 text-gray-300 px-2">
            Get instant cashout signals for{' '}
            <span className="font-black text-red-400">Betika • Pepeta • Odibet • Melbet</span>{' '}
            and every Aviator game. Start from KSH 100!
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 px-4 flex-wrap">
            <Link
              href="/packages"
              className="w-full sm:w-auto glass bg-gradient-to-r from-red-600 to-red-700 text-white text-lg sm:text-xl font-black px-8 sm:px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-red-900/50 border border-red-500/30 text-center"
            >
              BUY SIGNALS NOW
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-lg sm:text-xl font-black px-8 sm:px-10 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-yellow-900/40 border border-yellow-400/50 text-center"
            >
              👀 TRY FREE DEMO
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto glass bg-[#111827] text-[#22c55e] text-lg sm:text-xl font-bold px-8 sm:px-12 py-5 rounded-2xl hover:scale-105 transition-all shadow-2xl border-2 border-[#22c55e]/50 multiplier-glow text-center"
            >
              LIVE DASHBOARD ➡️
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto px-2">
            <div className="glass p-4 sm:p-6 rounded-2xl border border-[#22c55e]/20">
              <span className="text-2xl sm:text-4xl font-black block text-[#22c55e] multiplier-glow">1.5x–25x</span>
              <span className="text-sm sm:text-base opacity-70 text-gray-400">Multipliers</span>
            </div>
            <div className="glass p-4 sm:p-6 rounded-2xl border border-red-500/20">
              <span className="text-2xl sm:text-4xl font-black block text-red-400">KSH 100</span>
              <span className="text-sm sm:text-base opacity-70 text-gray-400">Min Package</span>
            </div>
            <div className="glass p-4 sm:p-6 rounded-2xl border border-[#22c55e]/20">
              <span className="text-2xl sm:text-4xl font-black block text-[#22c55e]">24/7</span>
              <span className="text-sm sm:text-base opacity-70 text-gray-400">Live Support</span>
            </div>
            <div className="glass p-4 sm:p-6 rounded-2xl border border-red-500/20">
              <span className="text-2xl sm:text-4xl font-black block text-red-400">15s AVG</span>
              <span className="text-sm sm:text-base opacity-70 text-gray-400">Signal Delay</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platforms ── */}
      <section className="py-16 sm:py-24 px-4 bg-[#0a0e17]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-12 sm:mb-20 text-[#22c55e] multiplier-glow">
            ✅ PROVEN ON ALL PLATFORMS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-center justify-items-center">
            {[
              { label: '🏆 BETIKA',  color: 'text-red-400',     border: 'border-red-500/20'     },
              { label: '⚡ PEPETA',  color: 'text-[#22c55e]',   border: 'border-[#22c55e]/20'   },
              { label: '🎯 ODITBET', color: 'text-red-400',     border: 'border-red-500/20'     },
              { label: '⭐ MELBET',  color: 'text-[#22c55e]',   border: 'border-[#22c55e]/20'   },
              { label: '📱 1XBET',   color: 'text-red-400',     border: 'border-red-500/20'     },
              { label: '🎰 ALL',     color: 'text-[#22c55e]',   border: 'border-[#22c55e]/20'   },
            ].map((p) => (
              <div
                key={p.label}
                className={`text-base sm:text-xl lg:text-2xl font-black ${p.color} glass p-4 sm:p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border ${p.border}`}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
