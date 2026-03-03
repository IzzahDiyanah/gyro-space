'use client'

interface Props {
  gyroLabel: string
  dotColor: string
}

export default function HUD({ gyroLabel, dotColor }: Props) {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 animate-fade-hud">

      {/* Corner brackets */}
      <div className="absolute w-4 h-4 corner-tl opacity-25" />
      <div className="absolute w-4 h-4 corner-tr opacity-25" />
      <div className="absolute w-4 h-4 corner-bl opacity-25" />
      <div className="absolute w-4 h-4 corner-br opacity-25" />

      {/* Title — top left */}
      <div className="absolute top-safe left-safe">
        <h1
          className="font-syncopate font-bold tracking-[0.25em]"
          style={{
            fontSize: 'clamp(14px, 4vw, 22px)',
            color: '#e8f0ff',
            textShadow: '0 0 30px rgba(100,150,255,0.6)',
          }}
        >
          GYROSCOPE
        </h1>
        <p className="mt-1 text-[8px] tracking-[0.25em] uppercase"
           style={{ color: 'rgba(140,170,255,0.4)' }}>
          Milky Way · Three.js
        </p>
      </div>

      {/* Mode badge — top right */}
      <div
        className="absolute top-safe right-safe flex items-center gap-2 text-[8px] tracking-[0.2em] uppercase rounded-sm px-3 py-2"
        style={{
          color: 'rgba(100,220,150,0.7)',
          background: 'rgba(0,20,10,0.4)',
          border: '1px solid rgba(80,200,130,0.25)',
        }}
      >
        <div
          className="w-[5px] h-[5px] rounded-full animate-pulse-dot"
          style={{ background: dotColor }}
        />
        <span id="gyro-label">{gyroLabel}</span>
      </div>

      {/* Tilt hint — bottom center */}
      <div className="absolute bottom-safe left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hint-appear">
        <div className="text-[22px] animate-wiggle">📱</div>
        <span className="text-[8px] tracking-[0.25em] uppercase whitespace-nowrap"
              style={{ color: 'rgba(140,170,255,0.45)' }}>
          Tilt to explore
        </span>
      </div>

      {/* Pinch hint — bottom right */}
      <div
        className="absolute bottom-safe right-safe text-[8px] tracking-[0.2em] uppercase pinch-hint-appear"
        style={{ color: 'rgba(140,170,255,0.3)' }}
      >
        Pinch to zoom
      </div>
    </div>
  )
}
