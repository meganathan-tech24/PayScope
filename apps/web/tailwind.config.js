/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent: ink navy. Solid primary actions, active navigation, links.
        brand: {
          50: '#eef2f7',
          100: '#e6ecf4',
          200: '#c9d5e4',
          300: '#9fb3ce',
          400: '#6b87ad',
          500: '#3f5f8a',
          600: '#1e3a5f',
          700: '#172d4a',
          800: '#10233a',
          900: '#0a1726',
        },
        // Slate neutrals (the standard `neutral-*` names are kept so existing classes still work).
        neutral: {
          50: '#f6f8fb',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Dark surfaces: sidebar, hero, footer.
        ink: {
          DEFAULT: '#0b1c2c',
          800: '#12283b',
          700: '#1b3a52',
          600: '#2a506c',
          300: '#9db4c8',
          100: '#dbe6ef',
        },
        signal: { DEFAULT: '#f5b83d', 600: '#d99a14', 100: '#fdf1d1' },
        // One fixed colour per action type. See the Buttons reference in docs/design-notes.md.
        edit: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
          active: '#1e3a8a',
          soft: '#dbeafe',
          'soft-hover': '#bfdbfe',
          'soft-active': '#93c5fd',
          text: '#1e40af',
          tint: '#eff6ff',
        },
        remove: {
          DEFAULT: '#b91c1c',
          hover: '#991b1b',
          active: '#7f1d1d',
          soft: '#fee2e2',
          'soft-hover': '#fecaca',
          'soft-active': '#fca5a5',
          text: '#991b1b',
          tint: '#fef2f2',
        },
        download: {
          DEFAULT: '#0f766e',
          hover: '#115e59',
          active: '#134e4a',
          soft: '#ccfbf1',
          tint: '#f0fdfa',
        },
        success: { DEFAULT: '#166534', hover: '#14532d', active: '#052e16', light: '#dcfce7' },
        warning: { DEFAULT: '#92400e', light: '#fef3c7', mark: '#d97706' },
        danger: { DEFAULT: '#b91c1c', light: '#fee2e2' },
        info: { DEFAULT: '#1d4ed8', light: '#dbeafe' },
        // Disabled controls are grey, never coloured.
        disabled: { bg: '#e6eaf0', text: '#526071' },
        // Chart scale: one sequential ramp that keeps its order in greyscale.
        chart: {
          1: '#dbeafe',
          2: '#93b4e6',
          3: '#5b86c4',
          4: '#2f5c99',
          5: '#1e3a5f',
          grid: '#e2e8f0',
        },
        focus: { DEFAULT: '#2563eb', dark: '#93c5fd' },
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        // One typeface: headings differ by weight and tracking, not by family.
        display: [
          '"Inter Variable"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '1.05' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.375rem',
        lg: '0.625rem',
        xl: '0.875rem',
      },
      boxShadow: {
        raised: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        overlay: '0 10px 30px -8px rgb(15 23 42 / 0.25), 0 2px 6px rgb(15 23 42 / 0.08)',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
};
