import { DesignSystem } from './design-generator';

export class TailwindConfigGenerator {
  generate(designSystem: DesignSystem): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(this.transformColors(designSystem.colors), null, 6)},
      fontFamily: ${JSON.stringify(designSystem.typography.fontFamily, null, 6)},
      fontSize: ${JSON.stringify(designSystem.typography.fontSize, null, 6)},
      fontWeight: ${JSON.stringify(designSystem.typography.fontWeight, null, 6)},
      lineHeight: ${JSON.stringify(designSystem.typography.lineHeight, null, 6)},
      spacing: ${JSON.stringify(designSystem.spacing, null, 6)},
      borderRadius: ${JSON.stringify(designSystem.borderRadius, null, 6)},
      boxShadow: ${JSON.stringify(designSystem.shadows, null, 6)},
      screens: ${JSON.stringify(designSystem.breakpoints, null, 6)},
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: ${JSON.stringify(this.extendKeyframes(designSystem.animations.keyframes), null, 6)},
      transitionDuration: ${JSON.stringify(designSystem.animations.duration, null, 6)},
      transitionTimingFunction: ${JSON.stringify(this.transformEasing(designSystem.animations.easing), null, 6)}
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class'
    }),
    require('@tailwindcss/typography'),
    function({ addUtilities, theme, addComponents }) {
      // Custom gradient utilities
      addUtilities({
        '.gradient-primary': {
          background: \`linear-gradient(135deg, \${theme('colors.primary.500')} 0%, \${theme('colors.primary.600')} 100%)\`
        },
        '.gradient-secondary': {
          background: \`linear-gradient(135deg, \${theme('colors.secondary')} 0%, \${theme('colors.accent')} 100%)\`
        },
        '.gradient-rainbow': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        '.text-gradient': {
          background: \`linear-gradient(135deg, \${theme('colors.primary.500')} 0%, \${theme('colors.primary.700')} 100%)\`,
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text'
        }
      });
      
      // Custom components
      addComponents({
        '.btn-primary': {
          '@apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 ease-out': {},
          '&:hover': {
            '@apply transform -translate-y-0.5 shadow-lg': {}
          }
        },
        '.btn-secondary': {
          '@apply bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium py-2 px-4 rounded-md border border-neutral-300 transition-all duration-200 ease-out': {}
        },
        '.btn-outline': {
          '@apply bg-transparent hover:bg-primary-500 text-primary-500 hover:text-white font-medium py-2 px-4 rounded-md border border-primary-500 transition-all duration-200 ease-out': {}
        },
        '.card': {
          '@apply bg-white dark:bg-neutral-900 rounded-lg shadow-base border border-neutral-200 dark:border-neutral-700 p-6 transition-all duration-200 ease-out': {},
          '&:hover': {
            '@apply shadow-lg transform -translate-y-1': {}
          }
        },
        '.card-interactive': {
          '@apply card cursor-pointer': {},
          '&:hover': {
            '@apply shadow-xl transform -translate-y-2 scale-[1.02]': {}
          }
        },
        '.glass': {
          '@apply bg-white/10 backdrop-blur-md border border-white/20': {}
        },
        '.glass-dark': {
          '@apply bg-black/10 backdrop-blur-md border border-black/20': {}
        }
      });
      
      // Dark mode utilities
      addUtilities({
        '.dark-mode-toggle': {
          'color-scheme': 'dark light'
        }
      });
    }
  ],
  darkMode: 'class'
};`;
  }
  
  private transformColors(colors: any) {
    return {
      primary: colors.primary,
      secondary: {
        DEFAULT: colors.secondary,
        50: this.lightenColor(colors.secondary, 95),
        100: this.lightenColor(colors.secondary, 90),
        200: this.lightenColor(colors.secondary, 80),
        300: this.lightenColor(colors.secondary, 70),
        400: this.lightenColor(colors.secondary, 60),
        500: colors.secondary,
        600: this.darkenColor(colors.secondary, 40),
        700: this.darkenColor(colors.secondary, 30),
        800: this.darkenColor(colors.secondary, 20),
        900: this.darkenColor(colors.secondary, 10)
      },
      accent: {
        DEFAULT: colors.accent,
        50: this.lightenColor(colors.accent, 95),
        100: this.lightenColor(colors.accent, 90),
        200: this.lightenColor(colors.accent, 80),
        300: this.lightenColor(colors.accent, 70),
        400: this.lightenColor(colors.accent, 60),
        500: colors.accent,
        600: this.darkenColor(colors.accent, 40),
        700: this.darkenColor(colors.accent, 30),
        800: this.darkenColor(colors.accent, 20),
        900: this.darkenColor(colors.accent, 10)
      },
      neutral: colors.neutral,
      gray: colors.neutral, // Alias for neutral
      success: {
        DEFAULT: colors.semantic.success,
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: colors.semantic.success,
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b'
      },
      warning: {
        DEFAULT: colors.semantic.warning,
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: colors.semantic.warning,
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
      },
      error: {
        DEFAULT: colors.semantic.error,
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: colors.semantic.error,
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
      },
      info: {
        DEFAULT: colors.semantic.info,
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: colors.semantic.info,
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a'
      }
    };
  }
  
  private lightenColor(color: string, lightness: number): string {
    // Simple implementation - in real use, would use a color manipulation library
    return color.replace(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (match, r, g, b) => {
      const factor = lightness / 100;
      const newR = Math.round(parseInt(r, 16) + (255 - parseInt(r, 16)) * factor);
      const newG = Math.round(parseInt(g, 16) + (255 - parseInt(g, 16)) * factor);
      const newB = Math.round(parseInt(b, 16) + (255 - parseInt(b, 16)) * factor);
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    });
  }
  
  private darkenColor(color: string, lightness: number): string {
    // Simple implementation - in real use, would use a color manipulation library
    return color.replace(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (match, r, g, b) => {
      const factor = (100 - lightness) / 100;
      const newR = Math.round(parseInt(r, 16) * factor);
      const newG = Math.round(parseInt(g, 16) * factor);
      const newB = Math.round(parseInt(b, 16) * factor);
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    });
  }
  
  private extendKeyframes(baseKeyframes: any) {
    return {
      ...baseKeyframes,
      bounceSubtle: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-5px)' }
      },
      glow: {
        '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
        '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }
      },
      float: {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-10px)' }
      },
      wiggle: {
        '0%, 100%': { transform: 'rotate(-3deg)' },
        '50%': { transform: 'rotate(3deg)' }
      },
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' }
      }
    };
  }
  
  private transformEasing(easing: any) {
    return {
      ...easing,
      'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };
  }
}