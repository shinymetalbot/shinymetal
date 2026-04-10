/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "error": "#ffb4ab",
        "primary": "#ffabf3",
        "primary-container": "#ff00ff",
        "inverse-surface": "#e5e1e4",
        "on-secondary-fixed": "#002020",
        "primary-fixed": "#ffd7f5",
        "background": "#131315",
        "inverse-primary": "#a900a9",
        "on-surface-variant": "#dcbed4",
        "on-surface": "#e5e1e4",
        "on-background": "#e5e1e4",
        "on-tertiary-fixed": "#291800",
        "tertiary-fixed-dim": "#ffb952",
        "on-tertiary-container": "#3e2600",
        "outline": "#a4899d",
        "secondary": "#ffffff",
        "on-primary-fixed": "#380038",
        "on-error-container": "#ffdad6",
        "surface-variant": "#353437",
        "on-tertiary-fixed-variant": "#633f00",
        "error-container": "#93000a",
        "surface": "#131315",
        "on-secondary-fixed-variant": "#004f4f",
        "secondary-fixed": "#00fbfb",
        "surface-tint": "#ffabf3",
        "tertiary-fixed": "#ffddb4",
        "on-primary-container": "#510051",
        "surface-dim": "#131315",
        "primary-fixed-dim": "#ffabf3",
        "outline-variant": "#564052",
        "on-primary": "#5b005b",
        "on-primary-fixed-variant": "#810081",
        "surface-bright": "#39393b",
        "surface-container-high": "#2a2a2c",
        "on-error": "#690005",
        "on-tertiary": "#452b00",
        "tertiary": "#ffb952",
        "on-secondary-container": "#007070",
        "surface-container": "#201f21",
        "secondary-fixed-dim": "#00dddd",
        "secondary-container": "#00fbfb",
        "surface-container-highest": "#353437",
        "surface-container-low": "#1c1b1d",
        "on-secondary": "#003737",
        "tertiary-container": "#c78400",
        "surface-container-lowest": "#0e0e10",
        "inverse-on-surface": "#313032"
      },
      borderRadius: {
        "DEFAULT": "0px",
        "lg": "0px",
        "xl": "0px",
        "full": "9999px"
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
        label: ["Space Grotesk", "sans-serif"],
        mono: ["Space Grotesk", "monospace"], // Using Space Grotesk for mono as per design often
      },
      animation: {
        'flicker': 'flicker 0.15s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flicker: {
          '0%': { opacity: '0.97' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
