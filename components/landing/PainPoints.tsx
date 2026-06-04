export default function PainPoints() {
  return (
    <section className="py-14 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-2">
          La vérité que personne ne vous dit
        </p>
        <p className="text-center text-gray-600 font-semibold text-base mb-8">
          Il n'existe pas de fiche Google parfaitement optimisée sans quelqu'un qui s'en occupe chaque semaine.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">

          {/* Temps requis */}
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6">
            <p className="text-4xl font-extrabold text-amber-500 mb-1">2 à 3h</p>
            <p className="text-sm font-semibold text-amber-600 mb-3">par semaine, sans exception</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Publications Google, réponses aux avis, photos récentes, horaires à jour, Q&A — c'est le travail hebdomadaire qu'exige une fiche réellement optimisée. La plupart des artisans commencent bien, puis oublient. Et c'est là que les concurrents remontent.
            </p>
          </div>

          {/* Argent perdu */}
          <div className="rounded-2xl bg-red-50 border border-red-100 p-6">
            <p className="text-4xl font-extrabold text-red-500 mb-1">150–450€</p>
            <p className="text-sm font-semibold text-red-600 mb-3">perdus chaque mois</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ce que vous coûte concrètement une fiche négligée. Des clients qui cherchent votre métier sur Google, ne vous trouvent pas, et appellent le concurrent au-dessus. Selon votre secteur, c'est 2 à 8 clients perdus par mois — chaque mois.
            </p>
          </div>

          {/* Vérifier son propre cas */}
          <div className="rounded-2xl bg-blue-600 p-6 flex flex-col justify-between">
            <div>
              <p className="text-white font-bold text-xl mb-2">Et vous, où en êtes-vous ?</p>
              <p className="text-blue-100 text-sm leading-relaxed mb-5">
                Ces chiffres ne sont pas génériques — ils varient selon votre fiche, votre position et votre secteur. En 60 secondes, voyez exactement ce que la vôtre vous coûte.
              </p>
            </div>
            <a
              href="/analyser"
              className="block w-full rounded-xl bg-white py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 transition text-center"
            >
              Analyser ma fiche — gratuit →
            </a>
            <p className="text-blue-300 text-xs text-center mt-2">Sans inscription · Données réelles</p>
          </div>

        </div>
      </div>
    </section>
  )
}
