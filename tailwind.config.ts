import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syncopate: ['Syncopate', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        space: {
          blue: 'rgba(140,180,255,0.8)',
          dim: 'rgba(140,170,255,0.45)',
          green: 'rgba(100,220,150,0.7)',
        },
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        floatIcon: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeHud: { to: { opacity: '1' } },
        fadeOut: { to: { opacity: '0', pointerEvents: 'none' } },
        fadeIn: { to: { opacity: '1' } },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-12deg)' },
          '50%': { transform: 'rotate(12deg)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1', boxShadow: '0 0 8px rgba(80,220,140,0.8)' },
        },
        spinRing1: { to: { transform: 'rotate(360deg)' } },
        spinRing3: { to: { transform: 'rotate(-360deg)' } },
      },
      animation: {
        twinkle: 'twinkle var(--dur) var(--delay) infinite ease-in-out',
        floatIcon: 'floatIcon 3s ease-in-out infinite',
        fadeHud: 'fadeHud 1.5s 0.5s forwards',
        fadeHint: 'fadeIn 2s 2s forwards',
        fadeOut: 'fadeOut 1s 6s forwards',
        wiggle: 'wiggle 1.5s ease-in-out infinite',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
        spinRing1: 'spinRing1 4s linear infinite',
        spinRing3: 'spinRing3 3s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
