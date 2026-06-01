'use client'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <img src="/logo.png.png" alt="LocalBoost" className="h-7 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <button onClick={() => document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' })}>
            Mon score gratuit
          </button>
          <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
            Comment ça marche
          </button>
          <a href="#pricing">Tarifs</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Se connecter
          </a>
          <a href="/signup" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
            Essai gratuit 7 jours →
          </a>
        </div>

        <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 text-gray-500">
          {open
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <button
            onClick={() => { setOpen(false); document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="block text-sm text-gray-700 py-1 w-full text-left"
          >
            Calculer mon score gratuit
          </button>
          <a href="#pricing" className="block text-sm text-gray-700 py-1" onClick={() => setOpen(false)}>Tarifs</a>
          <hr className="border-gray-100" />
          <a href="/login" className="block text-sm text-gray-700 py-1">Se connecter</a>
          <a href="/signup" className="block w-full text-center text-sm font-semibold text-white bg-blue-600 rounded-xl px-4 py-2.5">
            Essai gratuit 7 jours →
          </a>
        </div>
      )}
    </nav>
  )
}
