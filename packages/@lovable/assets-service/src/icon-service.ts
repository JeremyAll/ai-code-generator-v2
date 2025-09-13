export interface IconSet {
  name: string;
  icons: Record<string, string>; // name -> SVG content
  style: 'line' | 'solid' | 'duotone';
  license: string;
}

export class IconService {
  private iconSets: Map<string, IconSet> = new Map();
  
  constructor() {
    this.loadDefaultIcons();
  }
  
  private loadDefaultIcons() {
    // Heroicons set (most popular open source icons)
    this.iconSets.set('heroicons', {
      name: 'heroicons',
      style: 'solid',
      license: 'MIT',
      icons: {
        'home': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"/><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z"/></svg>',
        'user': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd"/></svg>',
        'shopping-cart': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25z"/></svg>',
        'menu': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clip-rule="evenodd"/></svg>',
        'x': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd"/></svg>',
        'check': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd"/></svg>',
        'star': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd"/></svg>',
        'heart': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>',
        'search': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clip-rule="evenodd"/></svg>',
        'settings': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.570.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348L13.928 3.817c-.151-.904-.933-1.567-1.85-1.567h-1.844zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd"/></svg>',
        'mail': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/></svg>',
        'bell': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9z" clip-rule="evenodd"/></svg>',
        'chart': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5V3z" clip-rule="evenodd"/></svg>',
        'rocket': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clip-rule="evenodd"/><path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z"/></svg>',
        'shield': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.814 3.051 10.503 9.398 12.339a.75.75 0 00.704 0C18.699 20.253 21.75 15.564 21.75 9.75a12.74 12.74 0 00-.635-4.235.75.75 0 00-.722-.516 11.209 11.209 0 01-7.877-3.08z" clip-rule="evenodd"/></svg>',
        'lightning': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71L11.018 14.25H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd"/></svg>'
      }
    });
    
    // Feather icons set (outline style)
    this.iconSets.set('feather', {
      name: 'feather',
      style: 'line',
      license: 'MIT',
      icons: {
        'home': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
        'user': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>',
        'shopping-cart': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 6H3m4 7v1a2 2 0 002 2h8a2 2 0 002-2v-1M9 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20.5 19.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>',
        'menu': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>',
        'x': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
        'check': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
        'star': '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>'
      }
    });
  }
  
  getIcon(
    name: string,
    set: string = 'heroicons',
    options: {
      className?: string;
      size?: number;
      color?: string;
    } = {}
  ): string {
    const iconSet = this.iconSets.get(set);
    if (!iconSet) return '';
    
    let svg = iconSet.icons[name] || '';
    if (!svg) return '';
    
    // Add className if provided
    if (options.className) {
      svg = svg.replace('<svg', `<svg class="${options.className}"`);
    }
    
    // Add size if provided
    if (options.size) {
      svg = svg.replace('<svg', `<svg width="${options.size}" height="${options.size}"`);
    } else if (!svg.includes('width=') && !svg.includes('class=')) {
      // Add default size if not present
      svg = svg.replace('<svg', '<svg width="24" height="24"');
    }
    
    // Add color if provided (for outline icons)
    if (options.color && iconSet.style === 'line') {
      svg = svg.replace('stroke="currentColor"', `stroke="${options.color}"`);
    } else if (options.color && iconSet.style === 'solid') {
      svg = svg.replace('fill="currentColor"', `fill="${options.color}"`);
    }
    
    return svg;
  }
  
  getIconsForDomain(domain: string): Record<string, string> {
    const domainIconMap: Record<string, string[]> = {
      'ecommerce': ['shopping-cart', 'user', 'heart', 'search', 'star', 'shield'],
      'saas': ['chart', 'settings', 'user', 'bell', 'shield', 'lightning'],
      'landing': ['rocket', 'star', 'check', 'lightning', 'shield', 'chart'],
      'blog': ['home', 'user', 'heart', 'star', 'mail', 'search'],
      'portfolio': ['user', 'star', 'mail', 'chart', 'home', 'heart'],
      'dashboard': ['chart', 'bell', 'settings', 'user', 'home', 'search'],
      'finance': ['chart', 'shield', 'user', 'star', 'settings', 'check'],
      'healthcare': ['shield', 'user', 'heart', 'star', 'check', 'home'],
      'education': ['star', 'user', 'check', 'chart', 'home', 'search']
    };
    
    const iconNames = domainIconMap[domain] || ['home', 'user', 'settings', 'star'];
    const result: Record<string, string> = {};
    
    iconNames.forEach(iconName => {
      result[iconName] = this.getIcon(iconName);
    });
    
    return result;
  }
  
  generateIconComponent(
    name: string,
    framework: 'react' | 'vue' | 'angular' | 'html' = 'react',
    set: string = 'heroicons'
  ): string {
    const svg = this.getIcon(name, set);
    
    if (framework === 'react') {
      const componentName = this.toPascalCase(name);
      return `
import React from 'react';

export const ${componentName}Icon = ({ className = "w-6 h-6", ...props }) => (
  ${svg.replace('class=', 'className=').replace('<svg', '<svg className={className} {...props}')}
);

export default ${componentName}Icon;`;
    }
    
    if (framework === 'vue') {
      const componentName = this.toPascalCase(name);
      return `
<template>
  ${svg.replace('<svg', '<svg :class="className" v-bind="$attrs"')}
</template>

<script>
export default {
  name: '${componentName}Icon',
  props: {
    className: {
      type: String,
      default: 'w-6 h-6'
    }
  }
}
</script>`;
    }
    
    if (framework === 'angular') {
      const componentName = this.toKebabCase(name);
      return `
import { Component, Input } from '@angular/core';

@Component({
  selector: '${componentName}-icon',
  template: \`${svg.replace('class=', '[class]="className"')}\`
})
export class ${this.toPascalCase(name)}IconComponent {
  @Input() className: string = 'w-6 h-6';
}`;
    }
    
    return svg; // HTML
  }
  
  generateIconSet(
    domain: string,
    framework: 'react' | 'vue' | 'angular' | 'html' = 'react'
  ): Record<string, string> {
    const icons = this.getIconsForDomain(domain);
    const components: Record<string, string> = {};
    
    Object.keys(icons).forEach(iconName => {
      components[iconName] = this.generateIconComponent(iconName, framework);
    });
    
    return components;
  }
  
  getAvailableIcons(set: string = 'heroicons'): string[] {
    const iconSet = this.iconSets.get(set);
    return iconSet ? Object.keys(iconSet.icons) : [];
  }
  
  getAvailableSets(): string[] {
    return Array.from(this.iconSets.keys());
  }
  
  addCustomIcon(name: string, svg: string, set: string = 'custom'): void {
    let iconSet = this.iconSets.get(set);
    
    if (!iconSet) {
      iconSet = {
        name: set,
        style: 'solid',
        license: 'Custom',
        icons: {}
      };
      this.iconSets.set(set, iconSet);
    }
    
    iconSet.icons[name] = svg;
  }
  
  private toPascalCase(str: string): string {
    return str.split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
  
  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }
}