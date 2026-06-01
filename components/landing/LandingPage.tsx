'use client'
import { useState, useEffect } from 'react'
import Navbar    from './Navbar'
import Hero      from './Hero'
import PainPoints from './PainPoints'
import Analyzer  from './Analyzer'
import HowItWorks from './HowItWorks'
import Modules   from './Modules'
import Pricing   from './Pricing'
import FAQ       from './FAQ'
import CTAFinal  from './CTAFinal'
import Footer    from './Footer'

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

      {/* 1 — Hero : hook sur la perte */}
      <div id="hero-anim">
        <Hero detectedCity={detectedCity} signupCount={signupCount} animScore={animScore} />
      </div>

      {/* 2 — Chiffres : preuve que le problème est réel */}
      <PainPoints />

      {/* 3 — Analyzer : l'outil de conversion (aha moment) */}
      <Analyzer />

      {/* 4 — Comment ça marche : lever les frictions */}
      <HowItWorks />

      {/* 5 — Ce qu'on reçoit : concrétiser la valeur */}
      <Modules />

      {/* 6 — Pricing : simple, trial, ROI ancré */}
      <Pricing />

      {/* 7 — FAQ : traiter les objections */}
      <FAQ />

      {/* 8 — CTA final : urgence douce */}
      <CTAFinal />

      <Footer />
    </div>
  )
}
