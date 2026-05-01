/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'op-primary':       '#257985',
        'op-primary-dark':  '#1c5f69',
        'op-primary-light': '#eef7f8',
        'op-bg':            '#f5f6f8',
        'op-surface':       '#ffffff',
        'op-text':          '#232a32',
        'op-text-sec':      '#6b7280',
        'op-text-ter':      '#9ca3af',
        'op-border':        '#e5e7eb',
        'op-border-light':  '#f0f0f0',
        'op-nav':           '#1e2736',
        'op-nav-hover':     '#2d3a4d',
        'op-nav-active':    '#364863',
        'op-nav-idle':      '#8899aa',
        'op-error':         '#ef4444',
        'op-success':       '#22c55e',
      },
      animation: {
        'toast-in':       'toast-in .32s cubic-bezier(.22,1.2,.36,1)',
        'toast-progress': 'toast-progress 4s linear forwards',
      },
      keyframes: {
        'toast-in': {
          '0%':   { transform: 'translateX(24px)', opacity: '0' },
          '60%':  { transform: 'translateX(-4px)', opacity: '1' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'toast-progress': {
          'from': { width: '100%' },
          'to':   { width: '0%' },
        },
      },
    },
  },
  plugins: [],
};
