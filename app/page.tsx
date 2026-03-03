import dynamic from 'next/dynamic'

// Three.js must be client-side only — no SSR
const GyroscopeScene = dynamic(() => import('@/components/GyroscopeScene'), {
  ssr: false,
})

export default function Home() {
  return <GyroscopeScene />
}
