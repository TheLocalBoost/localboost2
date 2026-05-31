import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const trialEnd = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialActive = trialEnd && trialEnd > now
  const isActive = profile?.subscription_status === 'active'
  const isTrialing = profile?.subscription_status === 'trialing'
  const hasAccess = isTrialActive || isActive || isTrialing

  if (!hasAccess) redirect('/pricing')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🚀</span>
          <span className="font-bold text-gray-900">LocalBoost</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</a>
          <a href="/dashboard/generate" className="text-sm text-gray-600 hover:text-gray-900">Générer</a>
          <a href="/dashboard/onboarding" className="text-sm text-gray-600 hover:text-gray-900">Mon commerce</a>
          <a href="/devisboost/dashboard" className="text-sm font-semibold text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-3 py-1">📋 DevisBoost</a>
          <a href="/dashboard/account" className="text-sm text-gray-600 hover:text-gray-900">Compte</a>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}