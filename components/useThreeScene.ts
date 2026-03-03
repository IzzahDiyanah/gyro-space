'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { GyroValues } from './useGyroscope'

// ─── Gyroscope Object3D (from three/addons/misc/Gyroscope.js) ────────────────
const _tObj = new THREE.Vector3()
const _qObj = new THREE.Quaternion()
const _sObj = new THREE.Vector3()
const _tWld = new THREE.Vector3()
const _qWld = new THREE.Quaternion()
const _sWld = new THREE.Vector3()

class Gyroscope extends THREE.Object3D {
  override updateMatrixWorld(force?: boolean) {
    if (this.matrixAutoUpdate) this.updateMatrix()
    if (this.matrixWorldNeedsUpdate || force) {
      if (this.parent !== null) {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)
        this.matrixWorld.decompose(_tWld, _qWld, _sWld)
        this.matrix.decompose(_tObj, _qObj, _sObj)
        // Key: world position + local rotation + world scale
        this.matrixWorld.compose(_tWld, _qObj, _sWld)
      } else {
        this.matrixWorld.copy(this.matrix)
      }
      this.matrixWorldNeedsUpdate = false
      force = true
    }
    for (const child of this.children) child.updateMatrixWorld(force)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildStars(count: number) {
  const pos: number[] = [], col: number[] = []
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    let x: number, y: number, z: number
    if (Math.random() < 0.65) {
      const dist = 30 + Math.random() * 200
      x = Math.cos(theta) * dist
      z = Math.sin(theta) * dist
      y = (Math.random() - 0.5) * dist * 0.15
    } else {
      const dist = 50 + Math.random() * 180
      const phi = (Math.random() - 0.5) * Math.PI
      x = Math.sin(phi) * Math.cos(theta) * dist
      y = Math.cos(phi) * dist * 0.5
      z = Math.sin(phi) * Math.sin(theta) * dist
    }
    pos.push(x, y, z)
    if (Math.random() < 0.12) { col.push(1.0, 0.88, 0.65) }
    else { const b = 0.7 + Math.random() * 0.3; col.push(0.85, 0.9, b) }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.0, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }))
}

function buildNebula() {
  const pos: number[] = [], col: number[] = []
  for (let i = 0; i < 1800; i++) {
    const theta = Math.random() * Math.PI * 2
    const dist = 25 + Math.random() * 160
    pos.push(Math.cos(theta) * dist, (Math.random() - 0.5) * dist * 0.13, Math.sin(theta) * dist)
    const t = Math.random()
    col.push(0.15 + t * 0.25, 0.2 + t * 0.3, 0.55 + t * 0.45)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return new THREE.Points(geo, new THREE.PointsMaterial({
    size: 3.5, vertexColors: true, transparent: true, opacity: 0.065,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
}

function makeGyroAssembly(color: number) {
  const gyro = new Gyroscope()
  const mat = (c: number) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, side: THREE.DoubleSide })

  const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.022, 8, 72), mat(color))
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 8, 56), mat(color))
  const r3 = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.013, 8, 44), mat(color))
  r2.rotation.x = Math.PI / 2
  r3.rotation.y = Math.PI / 2

  const spokeGeo = new THREE.BufferGeometry()
  spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -1.35, 0, 0, 1.35, 0, 0, 0, -1.35, 0, 0, 1.35, 0,
  ], 3))
  const spokes = new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 }))
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }))

  gyro.add(r1, r2, r3, spokes, center)
  return gyro
}

const ORBIT_DATA = [
  { r: 5.5,  spd: 0.32, phase: 0,              tilt: 0.3,   color: 0x44aaff, y: 0   },
  { r: 8.5,  spd: 0.19, phase: Math.PI * 0.65, tilt: -0.5,  color: 0x66ddff, y: 1.4 },
  { r: 11.5, spd: 0.12, phase: Math.PI * 1.3,  tilt: 0.55,  color: 0x88ffee, y: -1  },
  { r: 7.0,  spd: 0.25, phase: Math.PI * 0.4,  tilt: -0.2,  color: 0x99bbff, y: -2  },
  { r: 9.5,  spd: 0.16, phase: Math.PI,        tilt: 0.4,   color: 0x55ccff, y: 2   },
]

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  gyroRef: React.RefObject<GyroValues>
) {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // ── Renderer ──
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000008, 50, 180)

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800)
    camera.position.set(0, 6, 24)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000005, 1)
    containerRef.current.appendChild(renderer.domElement)

    // ── Scene objects ──
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    const stars = buildStars(isMobile ? 8000 : 13000)
    scene.add(stars, buildNebula())

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff0cc })
    )
    scene.add(nucleus)
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    ))

    // ── Orbits ──
    const orbits = ORBIT_DATA.map(({ r, spd, phase, tilt, color, y }) => {
      const pivot = new THREE.Object3D()
      pivot.rotation.z = tilt
      scene.add(pivot)

      const arm = new THREE.Object3D()
      arm.position.set(r, y, 0)
      pivot.add(arm)

      const pts: number[] = []
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2
        pts.push(Math.cos(a) * r, 0, Math.sin(a) * r)
      }
      const pathGeo = new THREE.BufferGeometry()
      pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      const path = new THREE.LineLoop(pathGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12 }))
      path.rotation.z = tilt
      scene.add(path)

      arm.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), new THREE.MeshBasicMaterial({ color })))
      arm.add(makeGyroAssembly(color))

      return { pivot, spd, phase }
    })

    // ── Camera state ──
    let camTheta = 0.3, camPhi = 0.42, camDist = 22
    let targetTheta = camTheta, targetPhi = camPhi, targetDist = camDist

    // ── Touch controls ──
    let touchStart: { x: number; y: number; theta: number; phi: number } | null = null
    let pinchStartDist = 0, pinchStartCamDist = 0

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, theta: camTheta, phi: camPhi }
      } else if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        pinchStartCamDist = camDist
        touchStart = null
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && touchStart) {
        const dx = e.touches[0].clientX - touchStart.x
        const dy = e.touches[0].clientY - touchStart.y
        targetTheta = touchStart.theta - dx * 0.007
        targetPhi   = Math.max(0.08, Math.min(Math.PI * 0.46, touchStart.phi - dy * 0.007))
      } else if (e.touches.length === 2 && pinchStartDist > 0) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        targetDist = Math.max(8, Math.min(50, pinchStartCamDist * (pinchStartDist / d)))
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length < 2) pinchStartDist = 0
      if (e.touches.length === 0) touchStart = null
    }

    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false })
    renderer.domElement.addEventListener('touchmove',  onTouchMove,  { passive: false })
    renderer.domElement.addEventListener('touchend',   onTouchEnd,   { passive: false })

    // ── Gyro smoothing state ──
    let smoothAlpha = 0, smoothBeta = 0
    let baseAlpha: number | null = null, baseBeta: number | null = null
    const GYRO_SMOOTH = 0.06

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation loop ──
    const clock = new THREE.Clock()
    const camTarget = new THREE.Vector3()
    const LERP = 0.08
    let rafId: number

    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = clock.getDelta()
      const t  = clock.elapsedTime

      orbits.forEach(({ pivot, spd, phase }) => { pivot.rotation.y = t * spd + phase })
      nucleus.scale.setScalar(1 + Math.sin(t * 1.8) * 0.055)
      stars.rotation.y = t * 0.003

      // Apply gyro
      const g = gyroRef.current
      if (g.enabled) {
        smoothAlpha += (g.alpha - smoothAlpha) * GYRO_SMOOTH * 60 * dt
        smoothBeta  += (g.beta  - smoothBeta)  * GYRO_SMOOTH * 60 * dt

        if (baseAlpha === null) { baseAlpha = smoothAlpha; baseBeta = smoothBeta }

        let dA = smoothAlpha - baseAlpha
        if (dA > 180)  dA -= 360
        if (dA < -180) dA += 360
        const dB = smoothBeta - baseBeta!

        targetTheta = 0.3 - dA * (Math.PI / 180) * 0.7
        targetPhi   = Math.max(0.08, Math.min(Math.PI * 0.46, 0.42 + dB * (Math.PI / 180) * 0.5))
      }

      const L = LERP * 60 * dt
      camTheta += (targetTheta - camTheta) * L
      camPhi   += (targetPhi   - camPhi)   * L
      camDist  += (targetDist  - camDist)  * L

      camera.position.x = camDist * Math.sin(camTheta) * Math.sin(camPhi)
      camera.position.y = camDist * Math.cos(camPhi)
      camera.position.z = camDist * Math.cos(camTheta) * Math.sin(camPhi)
      camera.lookAt(camTarget)

      renderer.render(scene, camera)
    }
    animate()

    // ── Cleanup ──
    cleanupRef.current = () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('touchstart', onTouchStart)
      renderer.domElement.removeEventListener('touchmove',  onTouchMove)
      renderer.domElement.removeEventListener('touchend',   onTouchEnd)
      renderer.dispose()
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }

    return () => { cleanupRef.current?.() }
  }, [containerRef, gyroRef])
}
