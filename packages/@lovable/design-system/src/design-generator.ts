import Color from 'color';

export interface ColorPalette {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: string;
  accent: string;
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  background: string;
  foreground: string;
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
    '9xl': string;
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface SpacingScale {
  0: string;
  px: string;
  0.5: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface RadiusScale {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface ShadowScale {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  glow?: string;
}

export interface AnimationConfig {
  duration: {
    fast: string;
    base: string;
    slow: string;
    slower: string;
  };
  easing: {
    linear: string;
    in: string;
    out: string;
    'in-out': string;
    bounce: string;
  };
  keyframes: {
    fadeIn: Record<string, any>;
    slideUp: Record<string, any>;
    scaleIn: Record<string, any>;
    pulse: Record<string, any>;
  };
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface DesignSystem {
  colors: ColorPalette;
  typography: Typography;
  spacing: SpacingScale;
  borderRadius: RadiusScale;
  shadows: ShadowScale;
  animations: AnimationConfig;
  breakpoints: Breakpoints;
}

export class DesignSystemGenerator {
  generate(
    domain: string,
    style: 'modern' | 'classic' | 'minimal' | 'bold' = 'modern',
    primaryColor?: string
  ): DesignSystem {
    const baseColor = primaryColor || this.getDefaultColor(domain);
    const palette = this.generateColorPalette(baseColor, style);
    
    return {
      colors: palette,
      typography: this.generateTypography(domain, style),
      spacing: this.generateSpacing(style),
      borderRadius: this.generateBorderRadius(style),
      shadows: this.generateShadows(style),
      animations: this.generateAnimations(style),
      breakpoints: this.getBreakpoints()
    };
  }
  
  private generateColorPalette(baseColor: string, style: string): ColorPalette {
    const color = Color(baseColor);
    
    return {
      primary: {
        50: color.lightness(95).hex(),
        100: color.lightness(90).hex(),
        200: color.lightness(80).hex(),
        300: color.lightness(70).hex(),
        400: color.lightness(60).hex(),
        500: baseColor,
        600: color.lightness(40).hex(),
        700: color.lightness(30).hex(),
        800: color.lightness(20).hex(),
        900: color.lightness(10).hex()
      },
      secondary: this.generateSecondaryColor(color),
      accent: this.generateAccentColor(color),
      neutral: this.generateNeutralColors(style),
      semantic: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      background: style === 'modern' ? '#0a0a0b' : '#ffffff',
      foreground: style === 'modern' ? '#ffffff' : '#0a0a0b'
    };
  }
  
  private generateSecondaryColor(baseColor: Color): string {
    return baseColor.rotate(120).hex();
  }
  
  private generateAccentColor(baseColor: Color): string {
    return baseColor.rotate(-60).saturate(0.2).hex();
  }
  
  private generateNeutralColors(style: string): ColorPalette['neutral'] {
    const baseGray = style === 'modern' ? Color('#18181b') : Color('#f8fafc');
    
    return {
      50: baseGray.lightness(98).hex(),
      100: baseGray.lightness(96).hex(),
      200: baseGray.lightness(88).hex(),
      300: baseGray.lightness(78).hex(),
      400: baseGray.lightness(62).hex(),
      500: baseGray.lightness(45).hex(),
      600: baseGray.lightness(35).hex(),
      700: baseGray.lightness(25).hex(),
      800: baseGray.lightness(15).hex(),
      900: baseGray.lightness(8).hex()
    };
  }
  
  private generateTypography(domain: string, style: string): Typography {
    const fontMap: Record<string, { heading: string; body: string }> = {
      'ecommerce': { heading: 'Poppins', body: 'Inter' },
      'saas': { heading: 'Inter', body: 'Inter' },
      'landing': { heading: 'Outfit', body: 'Inter' },
      'blog': { heading: 'Merriweather', body: 'Georgia' },
      'portfolio': { heading: 'Montserrat', body: 'Open Sans' }
    };
    
    const fonts = fontMap[domain] || { heading: 'Inter', body: 'Inter' };
    
    return {
      fontFamily: {
        heading: fonts.heading,
        body: fonts.body,
        mono: 'JetBrains Mono'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
        '8xl': '6rem',
        '9xl': '8rem'
      },
      fontWeight: {
        thin: 100,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900
      },
      lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      }
    };
  }
  
  private generateSpacing(style: string): SpacingScale {
    const base = style === 'minimal' ? 4 : 8;
    
    return {
      0: '0',
      px: '1px',
      0.5: `${base * 0.125}px`,
      1: `${base * 0.25}px`,
      2: `${base * 0.5}px`,
      3: `${base * 0.75}px`,
      4: `${base}px`,
      5: `${base * 1.25}px`,
      6: `${base * 1.5}px`,
      8: `${base * 2}px`,
      10: `${base * 2.5}px`,
      12: `${base * 3}px`,
      16: `${base * 4}px`,
      20: `${base * 5}px`,
      24: `${base * 6}px`,
      32: `${base * 8}px`,
      40: `${base * 10}px`,
      48: `${base * 12}px`,
      56: `${base * 14}px`,
      64: `${base * 16}px`
    };
  }
  
  private generateBorderRadius(style: string): RadiusScale {
    if (style === 'minimal') {
      return {
        none: '0',
        sm: '2px',
        base: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
        full: '9999px'
      };
    }
    
    return {
      none: '0',
      sm: '4px',
      base: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
      '3xl': '48px',
      full: '9999px'
    };
  }
  
  private generateShadows(style: string): ShadowScale {
    if (style === 'minimal') {
      return {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        base: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
      };
    }
    
    return {
      none: 'none',
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      '2xl': '0 35px 60px -15px rgb(0 0 0 / 0.3)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      glow: '0 0 20px rgb(147 51 234 / 0.3)'
    };
  }
  
  private generateAnimations(style: string): AnimationConfig {
    return {
      duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
        slower: '700ms'
      },
      easing: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      }
    };
  }
  
  private getBreakpoints(): Breakpoints {
    return {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };
  }
  
  private getDefaultColor(domain: string): string {
    const colorMap: Record<string, string> = {
      'ecommerce': '#f59e0b',
      'saas': '#3b82f6',
      'landing': '#8b5cf6',
      'dashboard': '#06b6d4',
      'blog': '#10b981',
      'portfolio': '#ec4899'
    };
    
    return colorMap[domain] || '#3b82f6';
  }
}