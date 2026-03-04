'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { GyroValues } from './useGyroscope'

// ─── Gyroscope Object3D ───────────────────────────────────────────────────────
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

// ─── 360° Sky Sphere ─────────────────────────────────────────────────────────
// PANORAMA_URL: any equirectangular (2:1 ratio) JPG/PNG.
// - To use your own image: drop it in /public and set '/your-image.jpg'
// - Free Milky Way 360s: https://www.flickr.com/search/?text=milky+way+equirectangular
// - More free HDRIs: https://polyhaven.com/hdris (download as JPG panorama)
const PANORAMA_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Milky_Way_Arch.jpg/2560px-Milky_Way_Arch.jpg'

function buildSkySphere(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(500, 60, 40)
  geo.scale(-1, 1, 1) // flip normals inward so texture is visible from inside

  const texture = new THREE.TextureLoader().load(PANORAMA_URL)
  texture.mapping = THREE.EquirectangularReflectionMapping
  // colorSpace available in Three >=0.152; safe to omit on older builds
  if ('colorSpace' in texture) {
    (texture as THREE.Texture & { colorSpace: string }).colorSpace = THREE.SRGBColorSpace
  }

  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture }))
}

// ─── Gyroscope ring assembly ──────────────────────────────────────────────────
function makeGyroAssembly(color: number): Gyroscope {
  const gyro = new Gyroscope()
  const mat = (c: number) =>
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.75, side: THREE.DoubleSide })

  const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.022, 8, 72), mat(color))
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 8, 56), mat(color))
  const r3 = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.013, 8, 44), mat(color))
  r2.rotation.x = Math.PI / 2
  r3.rotation.y = Math.PI / 2

  const spokeGeo = new THREE.BufferGeometry()
  spokeGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-1.35, 0, 0, 1.35, 0, 0, 0, -1.35, 0, 0, 1.35, 0], 3)
  )
  gyro.add(
    r1, r2, r3,
    new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.22 })),
    new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  )
  return gyro
}

const ORBIT_DATA = [
  { r: 5.5,  spd: 0.32, phase: 0,              tilt: 0.3,  color: 0x44aaff, y: 0   },
  { r: 8.5,  spd: 0.19, phase: Math.PI * 0.65, tilt: -0.5, color: 0x66ddff, y: 1.4 },
  { r: 11.5, spd: 0.12, phase: Math.PI * 1.3,  tilt: 0.55, color: 0x88ffee, y: -1  },
  { r: 7.0,  spd: 0.25, phase: Math.PI * 0.4,  tilt: -0.2, color: 0x99bbff, y: -2  },
  { r: 9.5,  spd: 0.16, phase: Math.PI,        tilt: 0.4,  color: 0x55ccff, y: 2   },
]

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  gyroRef: React.RefObject<GyroValues>
) {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene & camera — camera stays at origin; we rotate the world around it
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 0.01)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000005, 1)
    containerRef.current.appendChild(renderer.domElement)

    // ── Sky sphere (360° panorama) ──
    const skySphere = buildSkySphere()
    scene.add(skySphere)

    // ── Galaxy nucleus (floats in the scene) ──
    const nucleusGroup = new THREE.Group()
    nucleusGroup.position.set(0, 0, -20)
    scene.add(nucleusGroup)

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff0cc })
    )
    nucleusGroup.add(nucleus)
    nucleusGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
    ))

    // ── Orbiting bodies ──
    const orbits = ORBIT_DATA.map(({ r, spd, phase, tilt, color, y }) => {
      const pivot = new THREE.Object3D()
      pivot.rotation.z = tilt
      nucleusGroup.add(pivot)

      const arm = new THREE.Object3D()
      arm.position.set(r, y, 0)
      pivot.add(arm)

      // Orbit path ring
      const pts: number[] = []
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2
        pts.push(Math.cos(a) * r, 0, Math.sin(a) * r)
      }
      const pathGeo = new THREE.BufferGeometry()
      pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      const path = new THREE.LineLoop(pathGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 }))
      path.rotation.z = tilt
      nucleusGroup.add(path)

      arm.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), new THREE.MeshBasicMaterial({ color })))
      arm.add(makeGyroAssembly(color))

      return { pivot, spd, phase }
    })

    // ── Rotation state (degrees) ──
    // We rotate the whole world instead of moving the camera — standard 360-viewer pattern
    let rotY = 0, rotX = 0
    let targetRotY = 0, targetRotX = 0

    // ── Touch / pinch controls ──
    let touchStart: { x: number; y: number; rotY: number; rotX: number } | null = null
    let pinchStartDist = 0, pinchStartFov = camera.fov

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, rotY, rotX }
      } else if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        pinchStartFov = camera.fov
        touchStart = null
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && touchStart) {
        const dx = e.touches[0].clientX - touchStart.x
        const dy = e.touches[0].clientY - touchStart.y
        targetRotY = touchStart.rotY + dx * 0.25
        targetRotX = Math.max(-85, Math.min(85, touchStart.rotX - dy * 0.25))
      } else if (e.touches.length === 2 && pinchStartDist > 0) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        camera.fov = Math.max(30, Math.min(100, pinchStartFov * (pinchStartDist / d)))
        camera.updateProjectionMatrix()
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

    // ── Gyro smoothing ──
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
    const LERP = 0.08
    let rafId: number

    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const t  = clock.elapsedTime

      // Animate orbits
      orbits.forEach(({ pivot, spd, phase }) => { pivot.rotation.y = t * spd + phase })
      const pulse = 1 + Math.sin(t * 1.8) * 0.055
      nucleus.scale.setScalar(pulse)

      // Gyro → rotation target
      const g = gyroRef.current
      if (g && g.enabled) {
        smoothAlpha += (g.alpha - smoothAlpha) * GYRO_SMOOTH * 60 * dt
        smoothBeta  += (g.beta  - smoothBeta)  * GYRO_SMOOTH * 60 * dt
        if (baseAlpha === null) { baseAlpha = smoothAlpha; baseBeta = smoothBeta }
        let dA = smoothAlpha - baseAlpha
        if (dA > 180)  dA -= 360
        if (dA < -180) dA += 360
        const dB = smoothBeta - baseBeta!
        targetRotY = -dA * 0.7
        targetRotX = Math.max(-85, Math.min(85, -dB * 0.5))
      }

      // Smooth lerp
      const L = LERP * 60 * dt
      rotY += (targetRotY - rotY) * L
      rotX += (targetRotX - rotX) * L

      // Rotate sky + nucleus group together so panorama and 3D objects stay in sync
      const yRad = THREE.MathUtils.degToRad(rotY)
      const xRad = THREE.MathUtils.degToRad(rotX)
      skySphere.rotation.set(xRad, yRad, 0)
      nucleusGroup.rotation.set(xRad, yRad, 0)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
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
  }, [containerRef, gyroRef])
}
