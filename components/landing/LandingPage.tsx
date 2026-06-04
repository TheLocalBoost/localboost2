'use client'
import { useState, useEffect } from 'react'
import Navbar          from './Navbar'
import Hero            from './Hero'
import PainPoints      from './PainPoints'
import HowItWorks      from './HowItWorks'
import DashboardPreview from './DashboardPreview'
import CTASection      from './CTASection'
import Modules         from './Modules'
import Pricing         from './Pricing'
import Stats           from './Stats'
import FAQ             from './FAQ'
import CTAFinal        from './CTAFinal'
import Footer          from './Footer'
import SeoLinks        from './SeoLinks'

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

      <HowItWorks />

      <DashboardPreview />

      <CTASection />

      <Modules />

      <Pricing />

      <Stats signupCount={signupCount} />

      <FAQ />

      <CTAFinal />

      <SeoLinks />

      <Footer />
    </div>
  )
}
