import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: merchant } = await supabase
    .from('merchant_profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {merchant?.commerce_name || 'là'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Votre assistant Google Business est prêt.</p>
      </div>

      {!merchant && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 mb-6">
          <p className="font-semibold text-amber-800 mb-2">Configurez votre commerce</p>
          <p className="text-sm text-amber-700 mb-4">Renseignez les informations de votre commerce pour que l'IA génère du contenu personnalisé.</p>
          <Link href="/dashboard/onboarding" className="inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition">
            Configurer maintenant
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/generate?type=google" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-green-300 transition">
          <div className="text-2xl mb-2">📍</div>
          <h3 className="font-semibold text-gray-900 mb-1">Post Google Business</h3>
          <p className="text-sm text-gray-500">Générez un post pour cette semaine</p>
        </Link>
        <Link href="/dashboard/generate?type=review" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-green-300 transition">
          <div className="text-2xl mb-2">⭐</div>
          <h3 className="font-semibold text-gray-900 mb-1">Répondre à un avis</h3>
          <p className="text-sm text-gray-500">Collez un avis, recevez 3 réponses</p>
        </Link>
      </div>

      {generations && generations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières générations</h2>
          <div className="space-y-3">
            {generations.map((gen) => (
              <div key={gen.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-600">
                    {gen.type === 'google' ? '📍 Google Business' : '⭐ Réponse avis'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(gen.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{gen.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}