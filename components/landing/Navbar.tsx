'use client'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  function scrollToSearch() {
    document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src="/logo.png.png" alt="LocalBoost" className="h-14 w-auto" />
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <a href="#comment-ca-marche" className="text-sm text-gray-500 hover:text-gray-900">Comment ça marche</a>
          <a href="#pricing"           className="text-sm text-gray-500 hover:text-gray-900">Tarifs</a>
          <button
            onClick={scrollToSearch}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400 transition"
          >
            Voir ce qui bloque ma fiche — gratuit →
          </button>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 text-gray-500">
          {open
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <a href="#comment-ca-marche" className="block text-sm text-gray-700 py-1" onClick={() => setOpen(false)}>Comment ça marche</a>
          <a href="#pricing"           className="block text-sm text-gray-700 py-1" onClick={() => setOpen(false)}>Tarifs</a>
          <button
            onClick={() => { setOpen(false); scrollToSearch() }}
            className="block w-full text-center text-sm font-semibold text-white bg-green-500 rounded-xl px-4 py-2.5"
          >
            Voir ce qui bloque ma fiche — gratuit →
          </button>
        </div>
      )}
    </nav>
  )
}
