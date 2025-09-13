import { DesignSystem, ColorPalette, Typography, SpacingScale, RadiusScale, ShadowScale, AnimationConfig } from './design-generator';

export class CSSGenerator {
  generateCSS(designSystem: DesignSystem): string {
    return `
/* === DESIGN SYSTEM VARIABLES === */
:root {
  /* Colors */
  ${this.generateColorVariables(designSystem.colors)}
  
  /* Typography */
  ${this.generateTypographyVariables(designSystem.typography)}
  
  /* Spacing */
  ${this.generateSpacingVariables(designSystem.spacing)}
  
  /* Border Radius */
  ${this.generateRadiusVariables(designSystem.borderRadius)}
  
  /* Shadows */
  ${this.generateShadowVariables(designSystem.shadows)}
  
  /* Animations */
  ${this.generateAnimationVariables(designSystem.animations)}
  
  /* Breakpoints */
  ${this.generateBreakpointVariables(designSystem.breakpoints)}
}

/* === BASE STYLES === */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-foreground);
  background-color: var(--color-background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-4);
}

h1 { font-size: var(--text-5xl); }
h2 { font-size: var(--text-4xl); }
h3 { font-size: var(--text-3xl); }
h4 { font-size: var(--text-2xl); }
h5 { font-size: var(--text-xl); }
h6 { font-size: var(--text-lg); }

p {
  margin-bottom: var(--space-4);
  line-height: var(--leading-relaxed);
}

a {
  color: var(--color-primary-500);
  text-decoration: none;
  transition: color var(--duration-base) var(--ease-out);
}

a:hover {
  color: var(--color-primary-600);
}

/* === UTILITY CLASSES === */
${this.generateUtilityClasses(designSystem)}

/* === ANIMATIONS === */
${this.generateAnimations(designSystem.animations)}

/* === RESPONSIVE UTILITIES === */
${this.generateResponsiveUtilities(designSystem.breakpoints)}
`;
  }
  
  private generateColorVariables(colors: ColorPalette): string {
    let css = '';
    
    // Primary colors
    Object.entries(colors.primary).forEach(([shade, value]) => {
      css += `  --color-primary-${shade}: ${value};\n`;
    });
    
    // Neutral colors
    Object.entries(colors.neutral).forEach(([shade, value]) => {
      css += `  --color-neutral-${shade}: ${value};\n`;
    });
    
    // Other colors
    css += `  --color-secondary: ${colors.secondary};\n`;
    css += `  --color-accent: ${colors.accent};\n`;
    css += `  --color-background: ${colors.background};\n`;
    css += `  --color-foreground: ${colors.foreground};\n`;
    
    // Semantic colors
    Object.entries(colors.semantic).forEach(([name, value]) => {
      css += `  --color-${name}: ${value};\n`;
    });
    
    return css;
  }
  
  private generateTypographyVariables(typography: Typography): string {
    let css = '';
    
    // Font families
    Object.entries(typography.fontFamily).forEach(([name, value]) => {
      css += `  --font-${name}: ${value}, sans-serif;\n`;
    });
    
    // Font sizes
    Object.entries(typography.fontSize).forEach(([size, value]) => {
      css += `  --text-${size}: ${value};\n`;
    });
    
    // Font weights
    Object.entries(typography.fontWeight).forEach(([weight, value]) => {
      css += `  --font-${weight}: ${value};\n`;
    });
    
    // Line heights
    Object.entries(typography.lineHeight).forEach(([height, value]) => {
      css += `  --leading-${height}: ${value};\n`;
    });
    
    return css;
  }
  
  private generateSpacingVariables(spacing: SpacingScale): string {
    let css = '';
    Object.entries(spacing).forEach(([key, value]) => {
      const varName = key === '0.5' ? '0_5' : key;
      css += `  --space-${varName}: ${value};\n`;
    });
    return css;
  }
  
  private generateRadiusVariables(borderRadius: RadiusScale): string {
    let css = '';
    Object.entries(borderRadius).forEach(([key, value]) => {
      css += `  --radius-${key}: ${value};\n`;
    });
    return css;
  }
  
  private generateShadowVariables(shadows: ShadowScale): string {
    let css = '';
    Object.entries(shadows).forEach(([key, value]) => {
      css += `  --shadow-${key}: ${value};\n`;
    });
    return css;
  }
  
  private generateAnimationVariables(animations: AnimationConfig): string {
    let css = '';
    
    // Durations
    Object.entries(animations.duration).forEach(([key, value]) => {
      css += `  --duration-${key}: ${value};\n`;
    });
    
    // Easing functions
    Object.entries(animations.easing).forEach(([key, value]) => {
      const varName = key.replace('-', '_');
      css += `  --ease-${varName}: ${value};\n`;
    });
    
    return css;
  }
  
  private generateBreakpointVariables(breakpoints: any): string {
    let css = '';
    Object.entries(breakpoints).forEach(([key, value]) => {
      css += `  --breakpoint-${key}: ${value};\n`;
    });
    return css;
  }
  
  private generateUtilityClasses(designSystem: DesignSystem): string {
    return `
/* === BUTTONS === */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all var(--duration-base) var(--ease-out);
  cursor: pointer;
  border: none;
  text-decoration: none;
  user-select: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
  border: 1px solid var(--color-neutral-300);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-neutral-200);
  border-color: var(--color-neutral-400);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary-500);
  border: 1px solid var(--color-primary-500);
}

.btn-outline:hover:not(:disabled) {
  background: var(--color-primary-500);
  color: white;
}

.btn-ghost {
  background: transparent;
  color: var(--color-primary-500);
  border: none;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-primary-50);
}

.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-base);
}

/* === CARDS === */
.card {
  background: var(--color-background);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-base);
  border: 1px solid var(--color-neutral-200);
  transition: all var(--duration-base) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-neutral-200);
}

.card-footer {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-neutral-200);
}

/* === CONTAINERS === */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.container-sm {
  max-width: 640px;
}

.container-lg {
  max-width: 1536px;
}

/* === GRID === */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }

.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }

/* === FLEXBOX === */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.flex-1 { flex: 1; }
.flex-auto { flex: auto; }
.flex-none { flex: none; }

/* === SPACING === */
.m-0 { margin: 0; }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

.p-0 { padding: 0; }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

/* === TEXT === */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.text-2xl { font-size: var(--text-2xl); }
.text-3xl { font-size: var(--text-3xl); }

.font-light { font-weight: var(--font-light); }
.font-normal { font-weight: var(--font-normal); }
.font-medium { font-weight: var(--font-medium); }
.font-semibold { font-weight: var(--font-semibold); }
.font-bold { font-weight: var(--font-bold); }

.text-primary { color: var(--color-primary-500); }
.text-secondary { color: var(--color-secondary); }
.text-accent { color: var(--color-accent); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-error { color: var(--color-error); }
.text-neutral { color: var(--color-neutral-600); }

/* === BACKGROUNDS === */
.bg-primary { background-color: var(--color-primary-500); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-neutral { background-color: var(--color-neutral-100); }
.bg-white { background-color: #ffffff; }
.bg-transparent { background-color: transparent; }

/* === BORDERS === */
.border { border: 1px solid var(--color-neutral-300); }
.border-primary { border-color: var(--color-primary-500); }
.border-neutral { border-color: var(--color-neutral-300); }

.rounded { border-radius: var(--radius-base); }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-full { border-radius: var(--radius-full); }

/* === SHADOWS === */
.shadow { box-shadow: var(--shadow-base); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-none { box-shadow: none; }

/* === FORMS === */
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--color-foreground);
  font-size: var(--text-base);
  transition: border-color var(--duration-base) var(--ease-out);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}

.form-label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-medium);
  color: var(--color-neutral-700);
}

.form-error {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-error);
}
`;
  }
  
  private generateAnimations(animations: AnimationConfig): string {
    let css = '';
    
    // Generate keyframes
    Object.entries(animations.keyframes).forEach(([name, keyframe]) => {
      css += `@keyframes ${name} {\n`;
      Object.entries(keyframe).forEach(([percentage, styles]) => {
        css += `  ${percentage} {\n`;
        Object.entries(styles as Record<string, any>).forEach(([property, value]) => {
          css += `    ${property}: ${value};\n`;
        });
        css += `  }\n`;
      });
      css += `}\n\n`;
    });
    
    // Animation utility classes
    css += `
.animate-fade-in {
  animation: fadeIn var(--duration-base) var(--ease-out);
}

.animate-slide-up {
  animation: slideUp var(--duration-base) var(--ease-out);
}

.animate-scale-in {
  animation: scaleIn var(--duration-base) var(--ease-out);
}

.animate-pulse {
  animation: pulse 2s var(--ease-in_out) infinite;
}
`;
    
    return css;
  }
  
  private generateResponsiveUtilities(breakpoints: any): string {
    let css = '';
    
    Object.entries(breakpoints).forEach(([key, value]) => {
      css += `
@media (min-width: ${value}) {
  .${key}\\:grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
  .${key}\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .${key}\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .${key}\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  
  .${key}\\:text-sm { font-size: var(--text-sm); }
  .${key}\\:text-base { font-size: var(--text-base); }
  .${key}\\:text-lg { font-size: var(--text-lg); }
  .${key}\\:text-xl { font-size: var(--text-xl); }
  .${key}\\:text-2xl { font-size: var(--text-2xl); }
  
  .${key}\\:p-4 { padding: var(--space-4); }
  .${key}\\:p-6 { padding: var(--space-6); }
  .${key}\\:p-8 { padding: var(--space-8); }
  
  .${key}\\:flex { display: flex; }
  .${key}\\:hidden { display: none; }
  .${key}\\:block { display: block; }
}`;
    });
    
    return css;
  }
}