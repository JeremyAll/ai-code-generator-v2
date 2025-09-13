export interface IllustrationCategory {
  name: string;
  illustrations: Record<string, string>;
}

export class IllustrationService {
  private illustrations: Record<string, IllustrationCategory> = {};
  
  constructor() {
    this.loadDefaultIllustrations();
  }
  
  private loadDefaultIllustrations() {
    // Empty states illustrations
    this.illustrations['empty-state'] = {
      name: 'Empty States',
      illustrations: {
        'no-data': `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f8fafc"/>
              <stop offset="100%" style="stop-color:#e2e8f0"/>
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill="url(#bg)"/>
          <circle cx="200" cy="120" r="40" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
          <rect x="160" y="180" width="80" height="8" rx="4" fill="#e2e8f0"/>
          <rect x="170" y="200" width="60" height="6" rx="3" fill="#f1f5f9"/>
          <text x="200" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">No data available</text>
        </svg>`,
        'no-results': `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8fafc"/>
          <circle cx="180" cy="120" r="30" fill="none" stroke="#e2e8f0" stroke-width="3"/>
          <line x1="202" y1="142" x2="230" y2="170" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
          <line x1="160" y1="100" x2="200" y2="140" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
          <line x1="200" y1="100" x2="160" y2="140" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
          <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">No results found</text>
        </svg>`,
        '404': `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f8fafc"/>
          <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#e2e8f0">404</text>
          <rect x="150" y="140" width="100" height="40" rx="20" fill="none" stroke="#e2e8f0" stroke-width="2"/>
          <circle cx="170" cy="160" r="5" fill="#64748b"/>
          <circle cx="230" cy="160" r="5" fill="#64748b"/>
          <path d="M 170 175 Q 200 190 230 175" stroke="#64748b" stroke-width="2" fill="none" stroke-linecap="round"/>
          <text x="200" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Page not found</text>
        </svg>`,
        'error': `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#fef2f2"/>
          <circle cx="200" cy="120" r="40" fill="#fca5a5" stroke="#ef4444" stroke-width="2"/>
          <line x1="185" y1="105" x2="215" y2="135" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
          <line x1="215" y1="105" x2="185" y2="135" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
          <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#dc2626">Something went wrong</text>
        </svg>`
      }
    };
    
    // Hero section illustrations
    this.illustrations['hero'] = {
      name: 'Hero Sections',
      illustrations: {
        'startup': `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#dbeafe"/>
              <stop offset="100%" style="stop-color:#bfdbfe"/>
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#skyGrad)"/>
          <!-- Rocket -->
          <polygon points="400,100 420,180 380,180" fill="#f59e0b"/>
          <rect x="390" y="180" width="20" height="60" fill="#d97706"/>
          <polygon points="380,240 400,280 420,240" fill="#ef4444"/>
          <polygon points="385,240 395,280 405,240" fill="#fbbf24"/>
          <!-- Buildings -->
          <rect x="100" y="400" width="80" height="200" fill="#e5e7eb"/>
          <rect x="200" y="350" width="100" height="250" fill="#d1d5db"/>
          <rect x="500" y="380" width="90" height="220" fill="#e5e7eb"/>
          <rect x="620" y="420" width="70" height="180" fill="#d1d5db"/>
          <!-- Windows -->
          <rect x="120" y="420" width="15" height="15" fill="#fbbf24"/>
          <rect x="140" y="420" width="15" height="15" fill="#fbbf24"/>
          <rect x="220" y="380" width="15" height="15" fill="#fbbf24"/>
          <rect x="245" y="380" width="15" height="15" fill="#fbbf24"/>
        </svg>`,
        'teamwork': `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="#f0f9ff"/>
          <!-- People -->
          <circle cx="300" cy="200" r="30" fill="#fde68a"/>
          <rect x="280" y="230" width="40" height="80" fill="#3b82f6"/>
          <circle cx="500" cy="200" r="30" fill="#fde68a"/>
          <rect x="480" y="230" width="40" height="80" fill="#10b981"/>
          <!-- Table -->
          <ellipse cx="400" cy="350" rx="150" ry="20" fill="#e5e7eb"/>
          <rect x="250" y="330" width="300" height="20" fill="#d1d5db"/>
          <!-- Laptops -->
          <rect x="320" y="320" width="40" height="25" fill="#374151"/>
          <rect x="440" y="320" width="40" height="25" fill="#374151"/>
          <!-- Charts floating -->
          <rect x="600" y="150" width="80" height="60" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" rx="8"/>
          <rect x="610" y="180" width="10" height="20" fill="#3b82f6"/>
          <rect x="625" y="170" width="10" height="30" fill="#10b981"/>
          <rect x="640" y="160" width="10" height="40" fill="#f59e0b"/>
        </svg>`,
        'growth': `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="#f0fdf4"/>
          <!-- Chart background -->
          <rect x="200" y="150" width="400" height="300" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" rx="12"/>
          <!-- Grid lines -->
          <line x1="200" y1="200" x2="600" y2="200" stroke="#f3f4f6" stroke-width="1"/>
          <line x1="200" y1="250" x2="600" y2="250" stroke="#f3f4f6" stroke-width="1"/>
          <line x1="200" y1="300" x2="600" y2="300" stroke="#f3f4f6" stroke-width="1"/>
          <line x1="200" y1="350" x2="600" y2="350" stroke="#f3f4f6" stroke-width="1"/>
          <line x1="200" y1="400" x2="600" y2="400" stroke="#f3f4f6" stroke-width="1"/>
          <!-- Growth line -->
          <polyline points="230,380 280,350 330,320 380,280 430,240 480,200 530,160" 
                   fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
          <!-- Data points -->
          <circle cx="230" cy="380" r="6" fill="#10b981"/>
          <circle cx="280" cy="350" r="6" fill="#10b981"/>
          <circle cx="330" cy="320" r="6" fill="#10b981"/>
          <circle cx="380" cy="280" r="6" fill="#10b981"/>
          <circle cx="430" cy="240" r="6" fill="#10b981"/>
          <circle cx="480" cy="200" r="6" fill="#10b981"/>
          <circle cx="530" cy="160" r="6" fill="#10b981"/>
          <!-- Arrow up -->
          <polygon points="530,120 540,140 545,135 550,140 560,120 545,100" fill="#10b981"/>
        </svg>`
      }
    };
    
    // Feature illustrations
    this.illustrations['features'] = {
      name: 'Features',
      illustrations: {
        'secure': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f0f9ff"/>
          <path d="M100 30 L140 50 L140 110 C140 130 120 150 100 170 C80 150 60 130 60 110 L60 50 Z" 
                fill="#dbeafe" stroke="#3b82f6" stroke-width="3"/>
          <circle cx="100" cy="90" r="15" fill="#3b82f6"/>
          <rect x="90" y="105" width="20" height="25" fill="#3b82f6"/>
          <circle cx="100" cy="110" r="3" fill="#ffffff"/>
        </svg>`,
        'fast': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#fefce8"/>
          <polygon points="50,100 100,50 150,100 130,100 130,130 70,130 70,100" fill="#eab308"/>
          <polygon points="100,50 110,60 100,70 90,60" fill="#f59e0b"/>
          <!-- Speed lines -->
          <line x1="20" y1="80" x2="40" y2="80" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
          <line x1="25" y1="100" x2="45" y2="100" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
          <line x1="20" y1="120" x2="40" y2="120" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
        </svg>`,
        'easy': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f0fdf4"/>
          <circle cx="100" cy="100" r="60" fill="#bbf7d0" stroke="#22c55e" stroke-width="3"/>
          <circle cx="85" cy="85" r="5" fill="#22c55e"/>
          <circle cx="115" cy="85" r="5" fill="#22c55e"/>
          <path d="M 75 115 Q 100 135 125 115" stroke="#22c55e" stroke-width="4" fill="none" stroke-linecap="round"/>
          <!-- Thumbs up -->
          <rect x="140" y="120" width="15" height="40" fill="#22c55e" rx="7"/>
          <rect x="145" y="110" width="12" height="15" fill="#22c55e" rx="6"/>
        </svg>`
      }
    };
    
    // Tech illustrations
    this.illustrations['tech'] = {
      name: 'Technology',
      illustrations: {
        'cloud': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f0f9ff"/>
          <ellipse cx="100" cy="120" rx="60" ry="25" fill="#dbeafe"/>
          <circle cx="80" cy="105" r="20" fill="#bfdbfe"/>
          <circle cx="120" cy="105" r="25" fill="#bfdbfe"/>
          <circle cx="100" cy="90" r="18" fill="#93c5fd"/>
          <circle cx="70" cy="115" r="15" fill="#93c5fd"/>
          <circle cx="130" cy="115" r="15" fill="#93c5fd"/>
        </svg>`,
        'database': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f8fafc"/>
          <ellipse cx="100" cy="70" rx="50" ry="15" fill="#e2e8f0"/>
          <rect x="50" y="70" width="100" height="60" fill="#f1f5f9"/>
          <ellipse cx="100" cy="130" rx="50" ry="15" fill="#e2e8f0"/>
          <ellipse cx="100" cy="100" rx="50" ry="15" fill="#cbd5e1"/>
          <ellipse cx="100" cy="85" rx="50" ry="15" fill="#cbd5e1"/>
          <ellipse cx="100" cy="70" rx="50" ry="15" fill="#94a3b8"/>
        </svg>`,
        'mobile': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#fafafa"/>
          <rect x="70" y="30" width="60" height="140" rx="12" fill="#1f2937" stroke="#374151" stroke-width="2"/>
          <rect x="75" y="45" width="50" height="100" fill="#3b82f6"/>
          <circle cx="100" cy="155" r="6" fill="#6b7280"/>
          <rect x="85" y="35" width="30" height="4" rx="2" fill="#6b7280"/>
        </svg>`
      }
    };
  }
  
  getIllustration(category: string, name: string): string {
    return this.illustrations[category]?.illustrations[name] || '';
  }
  
  getIllustrationsByCategory(category: string): Record<string, string> {
    return this.illustrations[category]?.illustrations || {};
  }
  
  getAvailableCategories(): string[] {
    return Object.keys(this.illustrations);
  }
  
  getAvailableIllustrations(category: string): string[] {
    return Object.keys(this.illustrations[category]?.illustrations || {});
  }
  
  // Get illustrations for specific domain
  getIllustrationsForDomain(domain: string): Record<string, string> {
    const domainMapping: Record<string, Array<{ category: string; name: string; key: string }>> = {
      'ecommerce': [
        { category: 'empty-state', name: 'no-results', key: 'no-products' },
        { category: 'hero', name: 'growth', key: 'hero' },
        { category: 'features', name: 'secure', key: 'secure-checkout' },
        { category: 'features', name: 'fast', key: 'fast-delivery' }
      ],
      'saas': [
        { category: 'hero', name: 'startup', key: 'hero' },
        { category: 'features', name: 'secure', key: 'security' },
        { category: 'features', name: 'fast', key: 'performance' },
        { category: 'tech', name: 'cloud', key: 'cloud-sync' },
        { category: 'empty-state', name: 'no-data', key: 'no-data' }
      ],
      'landing': [
        { category: 'hero', name: 'growth', key: 'hero' },
        { category: 'features', name: 'easy', key: 'easy-setup' },
        { category: 'features', name: 'fast', key: 'quick-start' },
        { category: 'hero', name: 'teamwork', key: 'collaboration' }
      ],
      'blog': [
        { category: 'empty-state', name: 'no-results', key: 'no-posts' },
        { category: 'hero', name: 'teamwork', key: 'community' },
        { category: 'features', name: 'easy', key: 'easy-writing' }
      ],
      'dashboard': [
        { category: 'hero', name: 'growth', key: 'analytics' },
        { category: 'tech', name: 'database', key: 'data-storage' },
        { category: 'empty-state', name: 'no-data', key: 'no-data' },
        { category: 'features', name: 'fast', key: 'real-time' }
      ]
    };
    
    const mappings = domainMapping[domain] || [
      { category: 'hero', name: 'startup', key: 'hero' },
      { category: 'features', name: 'easy', key: 'features' }
    ];
    
    const result: Record<string, string> = {};
    
    mappings.forEach(({ category, name, key }) => {
      const illustration = this.getIllustration(category, name);
      if (illustration) {
        result[key] = illustration;
      }
    });
    
    return result;
  }
  
  // Get from unDraw API (placeholder implementation)
  async getUnDrawIllustration(
    keyword: string,
    primaryColor: string = '#6366f1'
  ): Promise<string> {
    // unDraw style illustration generator
    const illustrations: Record<string, string> = {
      'startup': 'startup_life',
      'team': 'team_collaboration', 
      'data': 'data_trends',
      'success': 'success_factors',
      'mobile': 'mobile_development',
      'design': 'design_process',
      'growth': 'growth_analytics',
      'security': 'security_on'
    };
    
    const illustrationName = illustrations[keyword] || 'working';
    
    // Since we can't directly access unDraw API, return a styled placeholder
    return `
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .undraw-primary { fill: ${primaryColor}; }
      .undraw-secondary { fill: ${primaryColor}20; }
      .undraw-accent { fill: ${primaryColor}40; }
    </style>
  </defs>
  <rect width="800" height="600" fill="#f8fafc"/>
  <circle cx="400" cy="200" r="80" class="undraw-secondary"/>
  <rect x="320" y="280" width="160" height="200" class="undraw-primary" rx="8"/>
  <circle cx="400" cy="150" r="30" class="undraw-accent"/>
  <text x="400" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748b">
    ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Illustration
  </text>
  <text x="400" y="550" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">
    unDraw Style - ${illustrationName}
  </text>
</svg>`;
  }
  
  // Generate illustration component for different frameworks
  generateIllustrationComponent(
    category: string,
    name: string,
    framework: 'react' | 'vue' | 'html' = 'react'
  ): string {
    const svg = this.getIllustration(category, name);
    const componentName = this.toPascalCase(`${category}-${name}`);
    
    if (framework === 'react') {
      return `
import React from 'react';

export const ${componentName}Illustration = ({ className, ...props }) => (
  <div className={className} {...props}>
    ${svg}
  </div>
);

export default ${componentName}Illustration;`;
    }
    
    if (framework === 'vue') {
      return `
<template>
  <div :class="className" v-bind="$attrs">
    ${svg}
  </div>
</template>

<script>
export default {
  name: '${componentName}Illustration',
  props: {
    className: {
      type: String,
      default: ''
    }
  }
}
</script>`;
    }
    
    return `<div class="illustration">${svg}</div>`; // HTML
  }
  
  // Add custom illustration
  addCustomIllustration(category: string, name: string, svg: string): void {
    if (!this.illustrations[category]) {
      this.illustrations[category] = {
        name: category,
        illustrations: {}
      };
    }
    
    this.illustrations[category].illustrations[name] = svg;
  }
  
  private toPascalCase(str: string): string {
    return str.split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}