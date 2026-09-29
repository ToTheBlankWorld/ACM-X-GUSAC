/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Product tint gradients live in the database, so the exact utility
  // classes must be safelisted for Tailwind to generate them.
  safelist: [
    'from-teal-100', 'to-cyan-100',
    'from-violet-100', 'to-fuchsia-100',
    'from-rose-100', 'to-orange-100',
    'from-emerald-100', 'to-lime-100',
    'from-sky-100', 'to-blue-100',
    'from-cyan-100', 'to-teal-100',
    'from-indigo-100', 'to-violet-100',
    'from-amber-100', 'to-orange-100',
    'from-pink-100', 'to-rose-100',
    'from-lime-100', 'to-green-100',
    'from-stone-100', 'to-stone-200',
    'from-teal-50', 'to-teal-100',
    'from-amber-50',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces Variable', 'Fraunces', 'Georgia', 'serif'],
      },
      maxWidth: {
        shell: '76rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,0.06), 0 1px 3px rgba(28,25,23,0.08)',
        lift: '0 12px 32px -12px rgba(28,25,23,0.22)',
        drawer: '-12px 0 40px rgba(28,25,23,0.18)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--tilt, 0deg))' },
          '50%': { transform: 'translateY(-8px) rotate(var(--tilt, 0deg))' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
