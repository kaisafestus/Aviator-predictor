import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <section className="relative text-white py-32 px-4 overflow-hidden aviator-grid-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] via-transparent to-[#0a0e17]" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="plane absolute left-10 top-20 w-24 h-auto" style={{ animationDelay: '1s' }} />
          <h1 className="text-7xl md:text-8xl font-black mb-8">
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent drop-shadow-2xl">
              AVIATOR
            </span>
            <span className="block text-4xl font-normal text-[#22c55e] multiplier-glow mt-2">SIGNALS</span>
          </h1>
          <p className="text-3xl md:text-4xl mb-8 text-[#22c55e] font-semibold pulse">
            95.2% WIN RATE • LIVE CRASH PREDICTIONS
          </p>
          <p className="text-2xl mb-12 max-w-3xl mx-auto opacity-80 text-gray-300">
            Get instant cashout signals for <span className="font-black text-red-400">Betika • Pepeta • Odibet • Melbet</span>{' '}
            and every Aviator game. Start from KSH 100!
          </p>
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center mb-16">
            <Link
              href="/packages"
              className="glass bg-gradient-to-r from-red-600 to-red-700 text-white text-xl font-black px-12 py-6 rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-red-900/50 border border-red-500/30"
            >
              BUY SIGNALS NOW
            </Link>
            <Link
              href="/dashboard"
              className="glass bg-[#111827] text-[#22c55e] text-xl font-bold px-12 py-6 rounded-2xl hover:scale-105 transition-all shadow-2xl border-2 border-[#22c55e]/50 multiplier-glow"
            >
              LIVE DASHBOARD ➡️
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            <div className="glass p-6 rounded-2xl border border-[#22c55e]/20">
              <span className="text-4xl font-black block text-[#22c55e] multiplier-glow">1.5x - 25x</span>
              <span className="opacity-70 text-gray-400">Multipliers</span>
            </div>
            <div className="glass p-6 rounded-2xl border border-red-500/20">
              <span className="text-4xl font-black block text-red-400">KSH 100</span>
              <span className="opacity-70 text-gray-400">Min Package</span>
            </div>
            <div className="glass p-6 rounded-2xl border border-[#22c55e]/20">
              <span className="text-4xl font-black block text-[#22c55e]">24/7</span>
              <span className="opacity-70 text-gray-400">Live Support</span>
            </div>
            <div className="glass p-6 rounded-2xl border border-red-500/20">
              <span className="text-4xl font-black block text-red-400">15s AVG</span>
              <span className="opacity-70 text-gray-400">Signal Delay</span>
            </div>
          </div>
        </div>
      </section>
      <section className="py-24 px-4 bg-[#0a0e17]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-20 text-[#22c55e] multiplier-glow">
            ✅ PROVEN ON ALL PLATFORMS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center justify-items-center">
            <div className="text-3xl font-black text-red-400 glass p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border border-red-500/20">🏆 BETIKA</div>
            <div className="text-3xl font-black text-[#22c55e] glass p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border border-[#22c55e]/20">⚡ PEPETA</div>
            <div className="text-3xl font-black text-red-400 glass p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border border-red-500/20">🎯 ODITBET</div>
            <div className="text-3xl font-black text-[#22c55e] glass p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border border-[#22c55e]/20">⭐ MELBET</div>
            <div className="text-3xl font-black text-red-400 glass p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border border-red-500/20">📱 1XBET</div>
            <div className="text-3xl font-black text-[#22c55e] glass p-6 rounded-2xl w-full text-center hover:scale-110 transition-all border border-[#22c55e]/20">🎰 ALL SITES</div>
          </div>
        </div>
      </section>
    </div>
  );
}

