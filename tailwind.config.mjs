/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "surface-container-low": "#1a1c1e",
        "outline-variant": "#3b494b",
        "surface-container": "#1e2022",
        "on-tertiary-fixed": "#1a1c1c",
        "on-secondary-fixed-variant": "#7f2b00",
        "on-secondary": "#5a1c00",
        "tertiary": "#f6f5f5",
        "inverse-primary": "#006970",
        "error": "#ffb4ab",
        "on-primary-container": "#006970",
        "inverse-surface": "#e2e2e5",
        "on-error": "#690005",
        "surface-bright": "#38393c",
        "on-primary-fixed": "#002022",
        "surface": "#121416",
        "tertiary-fixed": "#e2e2e2",
        "on-secondary-container": "#521900",
        "secondary-fixed-dim": "#ffb599",
        "on-error-container": "#ffdad6",
        "tertiary-container": "#d9d9d9",
        "on-primary": "#00363a",
        "on-tertiary": "#2f3131",
        "tertiary-fixed-dim": "#c6c6c6",
        "primary": "#dbfcff",
        "on-primary-fixed-variant": "#004f54",
        "on-secondary-fixed": "#370e00",
        "on-surface-variant": "#b9cacb",
        "background": "#121416",
        "on-background": "#e2e2e5",
        "surface-container-highest": "#333537",
        "surface-container-high": "#282a2c",
        "error-container": "#93000a",
        "surface-variant": "#333537",
        "primary-fixed": "#7df4ff",
        "on-tertiary-container": "#5d5f5f",
        "primary-container": "#00f0ff",
        "primary-fixed-dim": "#00dbe9",
        "surface-tint": "#00dbe9",
        "on-surface": "#e2e2e5",
        "secondary-fixed": "#ffdbce",
        "inverse-on-surface": "#2f3133",
        "surface-container-lowest": "#0c0e10",
        "secondary": "#ffb599",
        "surface-dim": "#121416",
        "secondary-container": "#fe5f00",
        "outline": "#849495",
        "on-tertiary-fixed-variant": "#454747"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"],
        label: ["Manrope", "sans-serif"],
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
