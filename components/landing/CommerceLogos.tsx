const TYPES = [
  { emoji: '🥖', label: 'Boulanger' },
  { emoji: '✂️', label: 'Coiffeur' },
  { emoji: '🍽️', label: 'Restaurateur' },
  { emoji: '🔧', label: 'Plombier' },
  { emoji: '💐', label: 'Fleuriste' },
  { emoji: '💊', label: 'Pharmacien' },
  { emoji: '🚗', label: 'Garagiste' },
  { emoji: '🎨', label: 'Peintre' },
]

export default function CommerceLogos() {
  return (
    <section className="py-12 px-6 border-y border-gray-100 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-wide">Conçu pour tous les indépendants</p>
        <div className="flex flex-wrap justify-center gap-6">
          {TYPES.map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-xl">{emoji}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
