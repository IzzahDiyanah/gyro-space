'use client'

import { useRef, useState, useCallback } from 'react'
import PermissionScreen from './PermissionScreen'
import HUD from './HUD'
import { useGyroscope } from './useGyroscope'
import { useThreeScene } from './useThreeScene'

type Mode = 'splash' | 'active'

export default function GyroscopeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode]         = useState<Mode>('splash')
  const [gyroLabel, setGyroLabel] = useState('Gyro Active')
  const [dotColor, setDotColor]   = useState('rgba(80,220,140,0.9)')

  const { valuesRef, requestPermission } = useGyroscope()

  // Three.js scene always mounted — just hidden behind the splash screen
  useThreeScene(containerRef, valuesRef)

  const handleGrant = useCallback(async () => {
    const result = await requestPermission()
    if (result === 'granted') {
      setGyroLabel('Gyro Active')
      setDotColor('rgba(80,220,140,0.9)')
    } else {
      setGyroLabel('Touch Mode')
      setDotColor('rgba(200,150,80,0.8)')
    }
    setMode('active')
  }, [requestPermission])

  const handleSkip = useCallback(() => {
    setGyroLabel('Touch Mode')
    setDotColor('rgba(200,150,80,0.6)')
    setMode('active')
  }, [])

  return (
    <>
      {/* Scanlines */}
      <div className="scanlines fixed inset-0 pointer-events-none z-[5]" />

      {/* Three.js canvas target */}
      <div ref={containerRef} className="fixed inset-0" />

      {/* Splash screen */}
      {mode === 'splash' && (
        <PermissionScreen onGrant={handleGrant} onSkip={handleSkip} />
      )}

      {/* HUD — shown after splash dismissed */}
      {mode === 'active' && (
        <HUD gyroLabel={gyroLabel} dotColor={dotColor} />
      )}
    </>
  )
}
