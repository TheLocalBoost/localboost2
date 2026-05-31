'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import Hero from './Hero'
import CommerceLogos from './CommerceLogos'
import PainPoints from './PainPoints'
import Analyzer from './Analyzer'
import Modules from './Modules'
import HowItWorks from './HowItWorks'
import Pricing from './Pricing'
import FAQ from './FAQ'
import CTAFinal from './CTAFinal'
import Footer from './Footer'

export default function LandingPage() {
  const [detectedCity, setDetectedCity] = useState('')
  const [signupCount, setSignupCount] = useState(0)
  const [animScore, setAnimScore] = useState(34)
  const heroRef = useRef<HTMLDivElement>(null)

  // Géolocalisation IP
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (d.city) setDetectedCity(d.city) })
      .catch(() => {})
  }, [])

  // Compteur inscrits
  useEffect(() => {
    fetch('/api/public-stats')
      .then(r => r.json())
      .then(d => { if (d.count) setSignupCount(d.count) })
      .catch(() => {})
  }, [])

  // Animation score 34→78 via IntersectionObserver sur le hero
  useEffect(() => {
    const el = document.getElementById('hero-score-anim')
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let current = 34
      const step = () => {
        current = Math.min(current + 2, 78)
        setAnimScore(current)
        if (current < 78) requestAnimationFrame(step)
      }
      setTimeout(() => requestAnimationFrame(step), 400)
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Pre-fill depuis lien email (?nom=...&ville=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nom = params.get('nom')
    const ville = params.get('ville')
    if (nom || ville) {
      const el = document.getElementById('analyzer')
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div id="hero-score-anim">
        <Hero detectedCity={detectedCity} signupCount={signupCount} animScore={animScore} />
      </div>
      <CommerceLogos />
      <PainPoints />
      <Analyzer />
      <Modules />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  )
}
