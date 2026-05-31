'use client'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <img src="/logo.png.png" alt="LocalBoost" className="h-7 w-auto" />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="relative">
            <button
              onClick={() => setToolsOpen(v => !v)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Nos outils
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {toolsOpen && (
              <div className="absolute top-8 left-0 bg-white border border-gray-100 rounded-xl shadow-lg p-2 w-56" onMouseLeave={() => setToolsOpen(false)}>
                <a href="/signup" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">LocalBoost</p>
                    <p className="text-xs text-gray-400">Google Business automatisé</p>
                  </div>
                </a>
                <a href="/devisboost/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">DevisBoost</p>
                    <p className="text-xs text-gray-400">Devis IA en 30 secondes</p>
                  </div>
                </a>
              </div>
            )}
          </div>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Tarifs</a>
          <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl px-4 py-2">
            Se connecter
          </a>
          <a href="/signup" className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 transition">
            Essai gratuit →
          </a>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nos outils</p>
          <a href="/signup" className="flex items-center gap-2 text-sm text-gray-700 py-1">📍 LocalBoost</a>
          <a href="/devisboost/dashboard" className="flex items-center gap-2 text-sm text-gray-700 py-1">📋 DevisBoost</a>
          <hr className="border-gray-100" />
          <a href="#pricing" className="block text-sm text-gray-700 py-1" onClick={() => setOpen(false)}>Tarifs</a>
          <a href="#faq" className="block text-sm text-gray-700 py-1" onClick={() => setOpen(false)}>FAQ</a>
          <hr className="border-gray-100" />
          <a href="/login" className="block text-sm text-gray-700 py-1">Se connecter</a>
          <a href="/signup" className="block w-full text-center text-sm font-semibold text-white bg-blue-600 rounded-xl px-4 py-2.5">
            Essai gratuit →
          </a>
        </div>
      )}
    </nav>
  )
}
