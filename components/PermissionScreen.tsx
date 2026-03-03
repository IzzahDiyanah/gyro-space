'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onGrant: () => void
  onSkip: () => void
}

export default function PermissionScreen({ onGrant, onSkip }: Props) {
  const starsRef = useRef<HTMLDivElement>(null)

  // Generate CSS twinkle stars
  useEffect(() => {
    if (!starsRef.current) return
    const frag = document.createDocumentFragment()
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div')
      s.className = 'absolute w-[2px] h-[2px] rounded-full bg-white animate-twinkle'
      s.style.cssText = `
        left: ${Math.random() * 100}%;
        top:  ${Math.random() * 100}%;
        --dur:    ${2 + Math.random() * 4}s;
        --delay:  ${Math.random() * 4}s;
        --bright: ${0.3 + Math.random() * 0.7};
        opacity: 0;
      `
      frag.appendChild(s)
    }
    starsRef.current.appendChild(frag)
  }, [])

  return (
    <div
      id="permission-screen"
      className="fixed inset-0 flex flex-col items-center justify-center z-[100] gap-0"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0520 0%, #000008 70%)',
        padding:
          'calc(var(--safe-top) + 20px) calc(var(--safe-right) + 24px) calc(var(--safe-bottom) + 20px) calc(var(--safe-left) + 24px)',
      }}
    >
      {/* Twinkling stars */}
      <div ref={starsRef} className="absolute inset-0 overflow-hidden pointer-events-none" />

      {/* Animated gyroscope icon */}
      <div className="w-[90px] h-[90px] relative mb-9 animate-float">
        <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <g className="ring-spin-1">
            <circle cx="45" cy="45" r="40" stroke="rgba(68,170,255,0.6)" strokeWidth="1.5" strokeDasharray="4 3" />
          </g>
          <g className="ring-spin-2">
            <ellipse cx="45" cy="45" rx="28" ry="12" stroke="rgba(100,220,255,0.7)" strokeWidth="1.5" />
          </g>
          <g className="ring-spin-3">
            <circle cx="45" cy="45" r="18" stroke="rgba(150,200,255,0.5)" strokeWidth="1" />
          </g>
          <circle cx="45" cy="45" r="4" fill="rgba(255,240,180,0.9)" />
          <circle cx="45" cy="45" r="8" fill="rgba(255,180,80,0.15)" />
        </svg>
      </div>

      {/* Title */}
      <h1
        className="font-syncopate text-[22px] font-bold tracking-[0.28em] text-center mb-2"
        style={{ color: '#e8f0ff', textShadow: '0 0 40px rgba(100,150,255,0.7)' }}
      >
        GYROSCOPE
      </h1>
      <p className="text-[9px] tracking-[0.3em] uppercase text-center mb-12"
         style={{ color: 'rgba(140,170,255,0.45)' }}>
        Milky Way · Stabilized Orientation
      </p>

      {/* Description */}
      <p
        className="text-[11px] leading-relaxed tracking-wide text-center max-w-[280px] mb-11"
        style={{ color: 'rgba(180,200,255,0.6)' }}
      >
        Tilt and move your phone to navigate the galaxy.<br />
        Gyroscope rings maintain fixed world orientation<br />
        while orbiting the galactic core.
      </p>

      {/* Grant button */}
      <button
        onClick={onGrant}
        className="relative overflow-hidden font-syncopate text-[10px] tracking-[0.3em] uppercase px-9 py-4 rounded-sm transition-transform active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(60,100,220,0.3), rgba(80,140,255,0.2))',
          border: '1px solid rgba(100,160,255,0.5)',
          color: '#b0d0ff',
        }}
      >
        Enable Gyroscope
      </button>

      {/* Skip button */}
      <button
        onClick={onSkip}
        className="mt-4 bg-transparent border-none font-mono text-[9px] tracking-[0.2em] uppercase py-2 px-3 cursor-pointer"
        style={{ color: 'rgba(140,170,255,0.3)' }}
      >
        Use Touch Only
      </button>
    </div>
  )
}
