/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#F5F5F7',
          darkBg: '#000000',
          card: '#FFFFFF',
          darkCard: '#1C1C1E',
          cardSecondary: '#2C2C2E',
          darkInput: '#2C2C2E',
          darkBorder: '#38383A',
          blue: '#007AFF',
          darkBlue: '#0A84FF',
          green: '#34C759',
          darkGreen: '#30D158',
          red: '#FF3B30',
          darkRed: '#FF453A',
          orange: '#FF9500',
          purple: '#AF52DE',
          indigo: '#5856D6',
          yellow: '#FFCC00',
          teal: '#5AC8FA',
          gray: '#8E8E93',
          gray2: '#636366',
          gray3: '#48484A',
          gray4: '#3A3A3C',
          gray5: '#2C2C2E',
          gray6: '#1C1C1E',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Inter"',
          'system-ui',
          'sans-serif'
        ]
      },
      boxShadow: {
        'ios': '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'ios-dark': '0 2px 16px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3)',
        'ios-lg': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'ios-sheet': '0 -8px 32px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
