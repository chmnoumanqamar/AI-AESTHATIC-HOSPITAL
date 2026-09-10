/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      'xs': ['10px', { lineHeight: '14px' }],
      'sm': ['11px', { lineHeight: '15px' }],
      'base': ['12px', { lineHeight: '16px' }],
      'lg': ['12px', { lineHeight: '16px' }],
      'xl': ['12px', { lineHeight: '16px' }],
      '2xl': ['12px', { lineHeight: '16px' }],
      '3xl': ['12px', { lineHeight: '16px' }],
      '4xl': ['12px', { lineHeight: '16px' }],
      '5xl': ['12px', { lineHeight: '16px' }],
      '6xl': ['12px', { lineHeight: '16px' }],
      '7xl': ['12px', { lineHeight: '16px' }],
      '8xl': ['12px', { lineHeight: '16px' }],
      '9xl': ['12px', { lineHeight: '16px' }],
    },
    extend: {
      colors: {
        // EXACT 10-SWATCH PALETTE REQUESTED BY USER
        palette: {
          1: '#582F0E',
          2: '#7F4F24',
          3: '#936639',
          4: '#A68A64',
          5: '#B6AD90',
          6: '#C2C5AA',
          7: '#A4AC86',
          8: '#656D4A',
          9: '#414833',
          10: '#333D29',
        },
        brand: {
          50: '#F6F7F2',   // Clean lightest tint
          100: '#EAECE2',  // Soft linen background
          200: '#D7DBC7',  // Light herbal celadon
          300: '#C2C5AA',  // Swatch 6
          400: '#B6AD90',  // Swatch 5
          500: '#A4AC86',  // Swatch 7
          600: '#656D4A',  // Swatch 8
          700: '#936639',  // Swatch 3
          800: '#414833',  // Swatch 9
          850: '#7F4F24',  // Swatch 2
          900: '#333D29',  // Swatch 10
          950: '#582F0E',  // Swatch 1
        },
        slate: {
          50: '#F7F8F4',
          100: '#ECEEE5',
          200: '#DCE0D0',
          300: '#C2C5AA',  // Swatch 6
          400: '#B6AD90',  // Swatch 5
          500: '#A4AC86',  // Swatch 7
          600: '#656D4A',  // Swatch 8
          700: '#414833',  // Swatch 9
          800: '#333D29',  // Swatch 10
          900: '#252E1C',  // Deep forest charcoal
          950: '#181F12'
        },
        sky: {
          50: '#F7F8F4',
          100: '#ECEEE5',
          200: '#DCE0D0',
          300: '#C2C5AA',  // Swatch 6
          400: '#A4AC86',  // Swatch 7
          500: '#656D4A',  // Swatch 8
          600: '#52593B',
          700: '#414833',  // Swatch 9
          800: '#333D29',  // Swatch 10
          900: '#252E1C'
        },
        blue: {
          50: '#F7F8F4',
          100: '#ECEEE5',
          200: '#DCE0D0',
          300: '#C2C5AA',  // Swatch 6
          400: '#A4AC86',  // Swatch 7
          500: '#656D4A',  // Swatch 8
          600: '#52593B',
          700: '#414833',  // Swatch 9
          800: '#333D29',  // Swatch 10
          900: '#252E1C'
        },
        emerald: {
          50: '#F6F7F2',
          100: '#EAECE2',
          200: '#D7DBC7',
          300: '#C2C5AA',  // Swatch 6
          400: '#A4AC86',  // Swatch 7
          500: '#656D4A',  // Swatch 8
          600: '#52593B',
          700: '#414833',  // Swatch 9
          800: '#333D29',  // Swatch 10
          900: '#252E1C'
        },
        teal: {
          50: '#F6F7F2',
          100: '#EAECE2',
          200: '#D7DBC7',
          300: '#C2C5AA',  // Swatch 6
          400: '#A4AC86',  // Swatch 7
          500: '#656D4A',  // Swatch 8
          600: '#414833',  // Swatch 9
          700: '#333D29'   // Swatch 10
        },
        amber: {
          50: '#FAF7F2',
          100: '#F4ECE0',
          200: '#E6D7C3',
          300: '#B6AD90',  // Swatch 5
          400: '#A68A64',  // Swatch 4
          500: '#936639',  // Swatch 3
          600: '#7F4F24',  // Swatch 2
          700: '#582F0E',  // Swatch 1
          800: '#432207',
          900: '#2F1703'
        },
        orange: {
          50: '#FAF7F2',
          100: '#F4ECE0',
          200: '#E6D7C3',
          300: '#B6AD90',  // Swatch 5
          400: '#A68A64',  // Swatch 4
          500: '#936639',  // Swatch 3
          600: '#7F4F24',  // Swatch 2
          700: '#582F0E',  // Swatch 1
          800: '#432207'
        },
        rose: {
          50: '#FAF6F2',
          100: '#F2E8DE',
          200: '#E1CFBF',
          300: '#A68A64',  // Swatch 4
          400: '#936639',  // Swatch 3
          500: '#7F4F24',  // Swatch 2
          600: '#582F0E',  // Swatch 1
          700: '#432207',
          800: '#333D29'   // Swatch 10
        },
        red: {
          50: '#FAF6F2',
          100: '#F2E8DE',
          200: '#E1CFBF',
          300: '#A68A64',  // Swatch 4
          400: '#936639',  // Swatch 3
          500: '#7F4F24',  // Swatch 2
          600: '#582F0E',  // Swatch 1
          700: '#432207'
        },
        indigo: {
          50: '#F7F8F4',
          100: '#ECEEE5',
          200: '#DCE0D0',
          300: '#C2C5AA',  // Swatch 6
          400: '#A4AC86',  // Swatch 7
          500: '#656D4A',  // Swatch 8
          600: '#414833',  // Swatch 9
          700: '#333D29',  // Swatch 10
          800: '#252E1C'
        },
        purple: {
          50: '#FAF6F2',
          100: '#F2E8DE',
          400: '#936639',  // Swatch 3
          500: '#7F4F24',  // Swatch 2
          600: '#582F0E',  // Swatch 1
          700: '#333D29'   // Swatch 10
        },
        semantic: {
          emergency: '#582F0E', // Deep espresso bronze (Swatch 1)
          success: '#656D4A',   // Moss olive (Swatch 8)
          warning: '#936639',   // Caramel amber (Swatch 3)
          info: '#A4AC86'       // Muted sage (Swatch 7)
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'subtle-card': '0 1px 3px 0 rgba(51, 61, 41, 0.06), 0 1px 2px -1px rgba(51, 61, 41, 0.04)',
        'docked-drawer': '-4px 0 24px 0 rgba(51, 61, 41, 0.12)',
        'modal-pop': '0 20px 25px -5px rgba(51, 61, 41, 0.25), 0 8px 10px -6px rgba(51, 61, 41, 0.18)'
      }
    },
  },
  plugins: [],
}
