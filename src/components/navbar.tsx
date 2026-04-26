'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-[#111827] text-white shadow-lg border-b border-[#22c55e]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-red-400">
              🚀 <span className="text-[#22c55e]">Aviator</span> Signals
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-300 hover:text-[#22c55e] transition-colors">
              Home
            </Link>
            <Link href="/packages" className="text-gray-300 hover:text-[#22c55e] transition-colors">
              Packages
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-[#22c55e] transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

