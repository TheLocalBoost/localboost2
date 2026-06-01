'use client'
import { useState, useEffect } from 'react'
import Navbar     from './Navbar'
import Hero       from './Hero'
import PainPoints from './PainPoints'
import HowItWorks from './HowItWorks'
import Modules    from './Modules'
import Pricing    from './Pricing'
import FAQ        from './FAQ'
import CTAFinal        from './CTAFinal'
import Footer          from './Footer'
import DashboardPreview from './DashboardPreview'

function AnalyzeCTA() {
  return (
    <section id="analyzer" className="py-20 px-6 bg-blue-600">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-3">Diagnostic gratuit</p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
          Découvrez en 60 secondes pourquoi votre fiche Google n'attire pas assez de clients
        </h2>
        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
          LocalBoost analyse votre présence Google et vous montre les actions prioritaires à réaliser — sans jargon, sans abonnement pour commencer.
        </p>
        <a
          href="/signup"
          className="inline-block rounded-xl bg-white text-blue-600 font-bold text-base px-8 py-4 hover:bg-blue-50 transition shadow-lg"
        >
          Analyser ma fiche gratuitement →
        </a>
        <p className="text-blue-200 text-sm mt-4">Sans carte bancaire · 7 jours d'essai gratuit</p>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const [detectedCity, setDetectedCity] = useState('')
  const [signupCount, setSignupCount]   = useState(0)
  const [animScore, setAnimScore]       = useState(34)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (d.city) setDetectedCity(d.city) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/public-stats')
      .then(r => r.json())
      .then(d => { if (d.count) setSignupCount(d.count) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = document.getElementById('hero-anim')
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 34
      const run = () => { n = Math.min(n + 2, 78); setAnimScore(n); if (n < 78) requestAnimationFrame(run) }
      setTimeout(() => requestAnimationFrame(run), 300)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div id="hero-anim">
        <Hero detectedCity={detectedCity} signupCount={signupCount} animScore={animScore} />
      </div>

      <PainPoints />

      <AnalyzeCTA />

      <DashboardPreview />

      <HowItWorks />

      <Modules />

      <Pricing />

      <FAQ />

      <CTAFinal />

      <Footer />
    </div>
  )
}
