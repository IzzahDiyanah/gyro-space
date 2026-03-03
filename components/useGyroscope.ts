'use client'

import { useRef, useCallback } from 'react'

export interface GyroValues {
  alpha: number
  beta: number
  gamma: number
  enabled: boolean
}

export function useGyroscope() {
  const valuesRef = useRef<GyroValues>({ alpha: 0, beta: 0, gamma: 0, enabled: false })

  const onOrientationEvent = useCallback((e: DeviceOrientationEvent) => {
    valuesRef.current = {
      alpha:   e.alpha   ?? 0,
      beta:    e.beta    ?? 0,
      gamma:   e.gamma   ?? 0,
      enabled: true,
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<'granted' | 'denied' | 'touch-only'> => {
    // iOS 13+ requires explicit permission
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }

    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission()
        if (result === 'granted') {
          window.addEventListener('deviceorientation', onOrientationEvent, true)
          return 'granted'
        }
        return 'denied'
      } catch {
        return 'denied'
      }
    } else {
      // Android — no permission needed
      window.addEventListener('deviceorientation', onOrientationEvent, true)
      return 'granted'
    }
  }, [onOrientationEvent])

  const skip = useCallback(() => {
    // Touch-only mode — gyro stays disabled
  }, [])

  return { valuesRef, requestPermission, skip }
}
