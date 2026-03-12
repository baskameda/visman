import React, { useState, useEffect, useRef } from 'react'
import { useAuth }    from '../context/AuthContext'
import { useLicence } from '../context/LicenceContext'
import { useTranslation } from 'react-i18next'
import greetings, { icons } from '../data/greetings'

function ensureKeyframes() {
  if (document.getElementById('greeting-kf')) return
  const s = document.createElement('style')
  s.id = 'greeting-kf'
  s.textContent = `
    @keyframes greetingBackdropIn  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes greetingBackdropOut { from { opacity: 1 } to { opacity: 0 } }
    @keyframes greetingCardIn {
      0%   { opacity: 0; transform: scale(0.78) translateY(40px);  }
      14%  { opacity: 1; transform: scale(1.06) translateY(-10px); }
      22%  { opacity: 1; transform: scale(0.97) translateY(4px);   }
      28%  { opacity: 1; transform: scale(1)    translateY(0);     }
      100% { opacity: 1; transform: scale(1)    translateY(0);     }
    }
    @keyframes greetingCardOut {
      from { opacity: 1; transform: scale(1)    translateY(0);     }
      to   { opacity: 0; transform: scale(0.88) translateY(-24px); }
    }
    @keyframes iconBounce {
      0%   { transform: scale(0)    rotate(-18deg); }
      55%  { transform: scale(1.30) rotate(10deg);  }
      72%  { transform: scale(0.88) rotate(-5deg);  }
      86%  { transform: scale(1.10) rotate(3deg);   }
      100% { transform: scale(1)    rotate(0deg);   }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
  `
  document.head.appendChild(s)
}

export default function GreetingOverlay({ accentColor = '#1677ff' }) {
  const { auth }          = useAuth()
  const { featureActive } = useLicence()
  const { i18n }          = useTranslation()
  const [visible,  setVisible]  = useState(false)
  const [leaving,  setLeaving]  = useState(false)
  const greetingRef = useRef('')
  const iconRef     = useRef('')
  const timerRef    = useRef(null)

  const overlayRef = useRef(null)

  const dismiss = () => {
    clearTimeout(timerRef.current)
    setLeaving(true)
    setTimeout(() => setVisible(false), 380)
  }

  // If gamification is turned off mid-session, immediately dismiss any visible greeting
  // and clear the pending flag so it cannot appear even if the toggle is later re-enabled.
  useEffect(() => {
    if (!featureActive.gamification) {
      sessionStorage.removeItem('greeting_pending')
      setVisible(false)
    }
  }, [featureActive.gamification])

  useEffect(() => {
    if (!auth) return
    if (!featureActive.gamification) return
    if (!sessionStorage.getItem('greeting_pending')) return
    sessionStorage.removeItem('greeting_pending')
    const pool = greetings[i18n.language] ?? greetings[i18n.language?.slice(0, 2)] ?? greetings.en
    const idx = Math.floor(Math.random() * pool.length)
    greetingRef.current = pool[idx]
    iconRef.current = icons[idx]
    ensureKeyframes()
    setLeaving(false)
    setVisible(true)
    timerRef.current = setTimeout(dismiss, 5000)
    setTimeout(() => overlayRef.current?.focus(), 50)
    return () => clearTimeout(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.username])

  if (!visible || !auth) return null

  const fullName = [auth.firstName, auth.lastName].filter(Boolean).join(' ') || auth.username

  return (
    <div
      ref={overlayRef}
      onClick={dismiss}
      onKeyDown={e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss() } }}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome, ${fullName}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,8,24,0.68)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        cursor: 'pointer',
        outline: 'none',
        animation: leaving
          ? 'greetingBackdropOut 0.38s ease-in forwards'
          : 'greetingBackdropIn 0.35s ease-out forwards',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 28,
          padding: '48px 72px 36px',
          textAlign: 'center',
          boxShadow: '0 48px 120px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.08)',
          maxWidth: 520,
          minWidth: 300,
          position: 'relative',
          overflow: 'hidden',
          animation: leaving
            ? 'greetingCardOut 0.38s cubic-bezier(0.4,0,1,1) forwards'
            : 'greetingCardIn 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Shimmer accent stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 5,
          background: `linear-gradient(90deg, transparent, ${accentColor}, ${accentColor}cc, ${accentColor}, transparent)`,
          backgroundSize: '200% auto',
          animation: 'shimmer 2.2s linear infinite',
          borderRadius: '28px 28px 0 0',
        }} />

        {/* Icon */}
        <div style={{
          fontSize: 80, lineHeight: 1, marginBottom: 20,
          display: 'inline-block',
          animation: 'iconBounce 0.72s cubic-bezier(0.34,1.56,0.64,1) 0.18s both',
        }}>
          {iconRef.current}
        </div>

        {/* Greeting */}
        <div style={{
          fontSize: 13, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: accentColor, marginBottom: 14,
        }}>
          {greetingRef.current}
        </div>

        {/* Name + ! */}
        <div style={{ fontSize: 40, fontWeight: 900, color: '#111', lineHeight: 1.15 }}>
          {fullName}<span style={{ color: accentColor }}>!</span>
        </div>

        {/* Dismiss hint */}
        <div style={{ fontSize: 11, color: '#c8c8c8', marginTop: 28, letterSpacing: '0.05em' }}>
          click or press Escape to dismiss
        </div>
      </div>
    </div>
  )
}
