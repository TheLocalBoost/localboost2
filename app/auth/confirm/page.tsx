import Link from 'next/link'

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/">
          <img src="/logo.png.png" alt="LocalBoost" className="h-16 w-auto mx-auto mb-8" />
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="text-5xl mb-5">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Votre email est confirmé !</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Votre compte LocalBoost est activé. Cliquez ci-dessous pour vous connecter et accéder à votre espace.
          </p>
          <Link
            href="/login"
            className="block w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition text-center"
          >
            Se connecter →
          </Link>
        </div>
      </div>
    </div>
  )
}
