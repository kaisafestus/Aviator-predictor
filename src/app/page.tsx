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
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-4 text-[#22c55e] multiplier-glow">
            ✅ WORKS ON ALL PLATFORMS
          </h2>
          <p className="text-center text-gray-400 text-sm sm:text-base mb-12 sm:mb-16">
            Our signals are compatible with every Aviator game host in Kenya
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">

            {/* BETIKA — red/black */}
            <a href="https://betika.com" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 glass rounded-2xl p-4 sm:p-5 border border-red-600/30 hover:border-red-500 hover:scale-105 transition-all cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
                <span className="text-white font-black text-lg sm:text-xl">B</span>
              </div>
              <div className="text-center">
                <div className="text-white font-black text-sm sm:text-base leading-tight">BETIKA</div>
                <div className="text-red-400 text-[10px] sm:text-xs font-semibold mt-0.5">Aviator ✓</div>
              </div>
            </a>

            {/* PEPETA — green */}
            <a href="https://pepeta.co.ke" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 glass rounded-2xl p-4 sm:p-5 border border-green-600/30 hover:border-green-500 hover:scale-105 transition-all cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-900/40">
                <span className="text-white font-black text-lg sm:text-xl">P</span>
              </div>
              <div className="text-center">
                <div className="text-white font-black text-sm sm:text-base leading-tight">PEPETA</div>
                <div className="text-green-400 text-[10px] sm:text-xs font-semibold mt-0.5">Aviator ✓</div>
              </div>
            </a>

            {/* ODIBET — orange/black */}
            <a href="https://odibet.com" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 glass rounded-2xl p-4 sm:p-5 border border-orange-500/30 hover:border-orange-400 hover:scale-105 transition-all cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-900/40">
                <span className="text-white font-black text-lg sm:text-xl">O</span>
              </div>
              <div className="text-center">
                <div className="text-white font-black text-sm sm:text-base leading-tight">ODIBET</div>
                <div className="text-orange-400 text-[10px] sm:text-xs font-semibold mt-0.5">Aviator ✓</div>
              </div>
            </a>

            {/* MELBET — yellow/black */}
            <a href="https://melbet.com" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 glass rounded-2xl p-4 sm:p-5 border border-yellow-500/30 hover:border-yellow-400 hover:scale-105 transition-all cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-900/40">
                <span className="text-black font-black text-lg sm:text-xl">M</span>
              </div>
              <div className="text-center">
                <div className="text-white font-black text-sm sm:text-base leading-tight">MELBET</div>
                <div className="text-yellow-400 text-[10px] sm:text-xs font-semibold mt-0.5">Aviator ✓</div>
              </div>
            </a>

            {/* 1XBET — blue/orange */}
            <a href="https://1xbet.com" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 glass rounded-2xl p-4 sm:p-5 border border-blue-500/30 hover:border-blue-400 hover:scale-105 transition-all cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <span className="text-white font-black text-base sm:text-lg">1X</span>
              </div>
              <div className="text-center">
                <div className="text-white font-black text-sm sm:text-base leading-tight">1XBET</div>
                <div className="text-blue-400 text-[10px] sm:text-xs font-semibold mt-0.5">Aviator ✓</div>
              </div>
            </a>

            {/* ALL SITES */}
            <div className="flex flex-col items-center gap-3 glass rounded-2xl p-4 sm:p-5 border border-[#22c55e]/30 hover:border-[#22c55e] hover:scale-105 transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#22c55e] to-green-700 flex items-center justify-center shadow-lg shadow-green-900/40">
                <span className="text-black font-black text-xl sm:text-2xl">+</span>
              </div>
              <div className="text-center">
                <div className="text-[#22c55e] font-black text-sm sm:text-base leading-tight">ALL SITES</div>
                <div className="text-[#22c55e]/70 text-[10px] sm:text-xs font-semibold mt-0.5">& more ✓</div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
