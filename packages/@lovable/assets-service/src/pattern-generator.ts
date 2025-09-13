export interface PatternOptions {
  color?: string;
  backgroundColor?: string;
  size?: number;
  opacity?: number;
  spacing?: number;
}

export interface GradientOptions {
  colors: string[];
  direction?: 'linear' | 'radial' | 'conic';
  angle?: number;
}

export class PatternGenerator {
  generateDotsPattern(options: PatternOptions = {}): string {
    const {
      color = '#6366f1',
      backgroundColor = 'transparent',
      size = 2,
      opacity = 0.3,
      spacing = 20
    } = options;

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${spacing}" height="${spacing}" viewBox="0 0 ${spacing} ${spacing}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <circle cx="${spacing/2}" cy="${spacing/2}" r="${size}" fill="${color}" opacity="${opacity}"/>
      </svg>
    `)}`;
  }

  generateGridPattern(options: PatternOptions = {}): string {
    const {
      color = '#e5e7eb',
      backgroundColor = 'transparent',
      size = 1,
      opacity = 0.4,
      spacing = 24
    } = options;

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${spacing}" height="${spacing}" viewBox="0 0 ${spacing} ${spacing}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <path d="M0 0h${spacing}v${size}H0zM0 0v${spacing}h${size}V0z" fill="${color}" opacity="${opacity}"/>
      </svg>
    `)}`;
  }

  generateWavesPattern(options: PatternOptions = {}): string {
    const {
      color = '#3b82f6',
      backgroundColor = 'transparent',
      opacity = 0.1,
      spacing = 60
    } = options;

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${spacing}" height="${spacing/2}" viewBox="0 0 ${spacing} ${spacing/2}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <path d="M0,${spacing/4}Q${spacing/4},0,${spacing/2},${spacing/4}T${spacing},${spacing/4}V${spacing/2}H0Z" 
              fill="${color}" opacity="${opacity}"/>
      </svg>
    `)}`;
  }

  generateLinearGradient(options: GradientOptions): string {
    const { colors, angle = 135 } = options;
    
    const colorStops = colors.map((color, index) => 
      `${color} ${(index / (colors.length - 1)) * 100}%`
    ).join(', ');

    return `linear-gradient(${angle}deg, ${colorStops})`;
  }

  generateRadialGradient(options: GradientOptions): string {
    const { colors } = options;
    
    const colorStops = colors.map((color, index) => 
      `${color} ${(index / (colors.length - 1)) * 100}%`
    ).join(', ');

    return `radial-gradient(circle, ${colorStops})`;
  }

  generateConicGradient(options: GradientOptions): string {
    const { colors, angle = 0 } = options;
    
    const colorStops = colors.map((color, index) => 
      `${color} ${(index / colors.length) * 360}deg`
    ).join(', ');

    return `conic-gradient(from ${angle}deg, ${colorStops})`;
  }

  generateMeshGradient(colors: string[]): string {
    const positions = [
      'at 20% 30%',
      'at 80% 20%',
      'at 40% 70%',
      'at 90% 80%'
    ];

    const gradients = colors.slice(0, 4).map((color, index) => 
      `radial-gradient(600px ${positions[index]}, ${color} 0%, transparent 50%)`
    ).join(', ');

    return gradients;
  }

  getDomainPatterns(domain: string): Record<string, string> {
    switch (domain) {
      case 'ecommerce':
        return {
          hero: this.generateLinearGradient({
            colors: ['#667eea', '#764ba2']
          }),
          section: this.generateDotsPattern({
            color: '#e0e7ff',
            spacing: 30,
            opacity: 0.4
          }),
          card: this.generateGridPattern({
            color: '#f3f4f6',
            spacing: 20,
            opacity: 0.3
          })
        };

      case 'saas':
        return {
          hero: this.generateLinearGradient({
            colors: ['#4f46e5', '#06b6d4', '#10b981']
          }),
          features: this.generateWavesPattern({
            color: '#6366f1',
            opacity: 0.08
          }),
          pricing: this.generateDotsPattern({
            color: '#3b82f6',
            spacing: 25,
            opacity: 0.2
          })
        };

      case 'landing':
        return {
          hero: this.generateMeshGradient([
            '#ff6b6b',
            '#4ecdc4',
            '#45b7d1',
            '#f9ca24'
          ]),
          features: this.generateGridPattern({
            color: '#e5e7eb',
            spacing: 32,
            opacity: 0.25
          })
        };

      case 'blog':
        return {
          header: this.generateLinearGradient({
            colors: ['#ffecd2', '#fcb69f']
          }),
          sidebar: this.generateDotsPattern({
            color: '#d1d5db',
            spacing: 28,
            opacity: 0.3
          })
        };

      case 'portfolio':
        return {
          hero: this.generateConicGradient({
            colors: ['#667eea', '#764ba2', '#667eea'],
            angle: 45
          }),
          gallery: this.generateWavesPattern({
            color: '#6366f1',
            opacity: 0.05
          })
        };

      default:
        return {
          background: this.generateLinearGradient({
            colors: ['#f8fafc', '#e2e8f0']
          }),
          accent: this.generateDotsPattern({
            color: '#cbd5e1',
            spacing: 24,
            opacity: 0.3
          })
        };
    }
  }

  generatePatternCSS(patternName: string, pattern: string): string {
    const isGradient = pattern.includes('gradient');
    const property = isGradient ? 'background' : 'background-image';
    
    return `
.pattern-${patternName} {
  ${property}: ${pattern};
}

.pattern-${patternName}-overlay {
  position: relative;
}

.pattern-${patternName}-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  ${property}: ${pattern};
  pointer-events: none;
  z-index: -1;
}`;
  }

  generateFrameworkComponent(
    patternName: string,
    pattern: string,
    framework: 'react' | 'vue' | 'angular' | 'html' = 'react'
  ): string {
    const isGradient = pattern.includes('gradient');
    const property = isGradient ? 'background' : 'backgroundImage';
    
    switch (framework) {
      case 'react':
        return `
export const ${this.toPascalCase(patternName)}Pattern = ({ children, className = '' }) => {
  return (
    <div 
      className={\`relative \${className}\`}
      style={{ ${property}: '${pattern}' }}
    >
      {children}
    </div>
  );
};`;

      case 'vue':
        return `
<template>
  <div 
    :class="['relative', className]"
    :style="{ ${property}: '${pattern}' }"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: '${this.toPascalCase(patternName)}Pattern',
  props: {
    className: {
      type: String,
      default: ''
    }
  }
}
</script>`;

      case 'angular':
        return `
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-${this.toKebabCase(patternName)}-pattern',
  template: \`
    <div 
      [class]="'relative ' + className"
      [style.${property}]="'${pattern}'"
    >
      <ng-content></ng-content>
    </div>
  \`
})
export class ${this.toPascalCase(patternName)}PatternComponent {
  @Input() className: string = '';
}`;

      case 'html':
        return `
<div class="pattern-${this.toKebabCase(patternName)} relative">
  <!-- Content goes here -->
</div>

<style>
.pattern-${this.toKebabCase(patternName)} {
  ${property.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${pattern};
}
</style>`;

      default:
        return '';
    }
  }

  injectPatternsIntoCode(
    code: string,
    patterns: Record<string, string>,
    domain: string
  ): string {
    let enhancedCode = code;

    // Replace pattern placeholders
    Object.entries(patterns).forEach(([section, pattern]) => {
      const placeholder = new RegExp(`pattern-${section}|bg-gradient-placeholder`, 'g');
      const isGradient = pattern.includes('gradient');
      
      if (isGradient) {
        enhancedCode = enhancedCode.replace(
          placeholder,
          `style="background: ${pattern}"`
        );
      } else {
        enhancedCode = enhancedCode.replace(
          placeholder,
          `style="background-image: url('${pattern}')"`
        );
      }
    });

    // Add CSS for patterns
    const cssPatterns = Object.entries(patterns)
      .map(([name, pattern]) => this.generatePatternCSS(name, pattern))
      .join('\n');

    if (enhancedCode.includes('</style>')) {
      enhancedCode = enhancedCode.replace(
        '</style>',
        `${cssPatterns}\n</style>`
      );
    } else if (enhancedCode.includes('</head>')) {
      enhancedCode = enhancedCode.replace(
        '</head>',
        `<style>\n${cssPatterns}\n</style>\n</head>`
      );
    }

    return enhancedCode;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|-)(.)/g, (_, char) => char.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

export default PatternGenerator;