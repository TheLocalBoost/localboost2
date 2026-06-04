export const metadata = {
  title: 'Widget Score Google — LocalBoost',
  description: 'Ajoutez le badge "Score Google vérifié" sur votre site en une ligne de code.',
}

export default function WidgetPage() {
  const snippet = `<script src="https://thelocalboost.fr/api/widget?nom=Votre+Commerce&ville=VotreVille"></script>`

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Widget Score Google</h1>
        <p className="text-gray-600 mb-8">
          Ajoutez ce badge sur votre site pour montrer que votre fiche Google a été vérifiée.
          Vos visiteurs pourront cliquer pour voir votre score.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <p className="text-sm font-semibold text-gray-500 mb-3">Aperçu</p>
          <a
            href="https://thelocalboost.fr/analyser"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            <span>📍</span><span>Score Google vérifié par LocalBoost</span>
          </a>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 mb-6">
          <p className="text-xs text-gray-400 mb-2">Collez ce code sur votre site</p>
          <code className="text-green-400 text-sm break-all">{snippet}</code>
        </div>

        <p className="text-sm text-gray-500">
          Remplacez <strong>Votre+Commerce</strong> par le nom de votre établissement
          et <strong>VotreVille</strong> par votre ville.
        </p>
      </div>
    </div>
  )
}
