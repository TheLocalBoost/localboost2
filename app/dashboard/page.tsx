import { redirect } from 'next/navigation'

// Redirige /dashboard → /localboost/dashboard sans passer les params d'erreur
export default function DashboardRedirect() {
  redirect('/localboost/dashboard')
}
