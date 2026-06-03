'use client'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png.png" alt="LocalBoost" className="h-7 w-auto" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              Automatisez votre Google Business. Récupérez vos clients perdus.
            </p>
            <p className="text-xs text-gray-400">🇫🇷 Conçu pour les artisans français</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">LocalBoost</p>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-gray-500 hover:text-gray-900 text-left"
                >
                  Analyser ma fiche
                </button>
              </li>
              <li><a href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">Tarifs</a></li>
              <li><a href="/contact" className="text-sm text-gray-500 hover:text-gray-900">Contact</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Légal</p>
            <ul className="space-y-2">
              <li><a href="/cgv" className="text-sm text-gray-500 hover:text-gray-900">CGV</a></li>
              <li><a href="/mentions-legales" className="text-sm text-gray-500 hover:text-gray-900">Mentions légales</a></li>
              <li><a href="mailto:contact@thelocalboost.fr" className="text-sm text-gray-500 hover:text-gray-900">contact@thelocalboost.fr</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">© 2026 TheLocalBoost · SIRET 105 578 884 00014</p>
          <p className="text-xs text-gray-400">Fait avec ❤️ en France</p>
        </div>
      </div>
    </footer>
  )
}
