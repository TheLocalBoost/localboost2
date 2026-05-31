export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png.png" alt="LocalBoost" className="h-7 w-auto" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">La suite IA pour les indépendants français.</p>
          </div>

          {/* Outils */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Outils</p>
            <ul className="space-y-2">
              <li><a href="/signup" className="text-sm text-gray-500 hover:text-gray-900">LocalBoost</a></li>
              <li><a href="/devisboost/dashboard" className="text-sm text-gray-500 hover:text-gray-900">DevisBoost</a></li>
              <li><a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900">Pack Complet</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Légal</p>
            <ul className="space-y-2">
              <li><a href="/cgv" className="text-sm text-gray-500 hover:text-gray-900">CGV</a></li>
              <li><a href="/mentions-legales" className="text-sm text-gray-500 hover:text-gray-900">Mentions légales</a></li>
              <li><a href="/mentions-legales" className="text-sm text-gray-500 hover:text-gray-900">Confidentialité</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</p>
            <ul className="space-y-2">
              <li><a href="mailto:contact@thelocalboost.fr" className="text-sm text-gray-500 hover:text-gray-900">contact@thelocalboost.fr</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">SIREN 105 578 884 · RCS Val de Briey · © 2026 TheLocalBoost</p>
          <p className="text-xs text-gray-400">Fait avec ❤️ en France 🇫🇷</p>
        </div>
      </div>
    </footer>
  )
}
