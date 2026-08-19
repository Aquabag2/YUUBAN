/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta oficial Yuuban ─────────────────────────────────────
        // Fondo principal de la app
        'yn-bg':      '#07080F',
        // Superficie de cards / paneles
        'yn-surface': '#0D1017',
        // Bordes sutiles
        'yn-border':  'rgba(255,255,255,0.07)',
        // Brand violet — color corporativo principal
        'yn-brand': {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          DEFAULT: '#7C3AED',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Confirmado / Pagado — verde esmeralda
        'yn-green': {
          DEFAULT: '#059669',
          light:   '#34D399',
          bg:      'rgba(5,150,105,0.10)',
          border:  'rgba(5,150,105,0.22)',
        },
        // Pendiente / Atención — ámbar
        'yn-amber': {
          DEFAULT: '#D97706',
          light:   '#FCD34D',
          bg:      'rgba(217,119,6,0.10)',
          border:  'rgba(217,119,6,0.22)',
        },
        // Error / Cancelado — rojo
        'yn-red': {
          DEFAULT: '#DC2626',
          light:   '#F87171',
          bg:      'rgba(220,38,38,0.10)',
          border:  'rgba(220,38,38,0.22)',
        },
        // Texto
        'yn-text':  '#F1F5F9',
        'yn-muted': '#64748B',
        // ── Colores genéricos de utilidad (mantener compatibilidad) ───
        'success': {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        'warning': {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        'error': {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'note-float': 'noteFloat 8s ease-in-out infinite',
        'note-bounce': 'noteBounce 4s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'wave': 'wave 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gradient-x': {
          '0%, 100%': { transform: 'translateX(0%)' },
          '50%': { transform: 'translateX(100%)' },
        },
        'gradient-y': {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        'gradient-xy': {
          '0%, 100%': { transform: 'translate(0%, 0%)' },
          '25%': { transform: 'translate(100%, 0%)' },
          '50%': { transform: 'translate(100%, 100%)' },
          '75%': { transform: 'translate(0%, 100%)' },
        },
        noteFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)', opacity: '0.3' },
          '25%': { transform: 'translateY(-20px) rotate(5deg)', opacity: '0.6' },
          '50%': { transform: 'translateY(-40px) rotate(0deg)', opacity: '0.8' },
          '75%': { transform: 'translateY(-20px) rotate(-5deg)', opacity: '0.6' },
        },
        noteBounce: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: '0.4' },
          '50%': { transform: 'translateY(-30px) scale(1.1)', opacity: '0.7' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0px) rotate(0deg)' },
          '25%': { transform: 'translateX(10px) rotate(2deg)' },
          '50%': { transform: 'translateX(0px) rotate(0deg)' },
          '75%': { transform: 'translateX(-10px) rotate(-2deg)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-forest': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'gradient-fire': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-purple': '0 0 20px rgba(217, 70, 239, 0.3)',
        'glow-yellow': '0 0 20px rgba(234, 179, 8, 0.3)',
      }
    },
  },
  plugins: [],
}
