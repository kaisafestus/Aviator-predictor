'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-[#111827] text-white shadow-lg border-b border-[#22c55e]/20 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-red-400 shrink-0">
            🚀 <span className="text-[#22c55e]">Aviator</span> Signals
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center space-x-6">
            <Link href="/" className="text-gray-300 hover:text-[#22c55e] transition-colors font-medium">
              Home
            </Link>
            <Link href="/packages" className="text-gray-300 hover:text-[#22c55e] transition-colors font-medium">
              Packages
            </Link>
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl font-bold hover:from-red-500 hover:to-red-600 transition-all border border-red-500/30"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-[#111827] border-t border-[#22c55e]/20 px-4 py-4 flex flex-col gap-3">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-gray-300 hover:text-[#22c55e] transition-colors font-medium py-2 border-b border-gray-700/40"
          >
            Home
          </Link>
          <Link
            href="/packages"
            onClick={() => setMenuOpen(false)}
            className="text-gray-300 hover:text-[#22c55e] transition-colors font-medium py-2 border-b border-gray-700/40"
          >
            Packages
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-bold text-center hover:from-red-500 hover:to-red-600 transition-all border border-red-500/30"
          >
            Dashboard
          </Link>
        </div>
      )}
    </nav>
  )
}
