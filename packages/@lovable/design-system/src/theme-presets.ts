export interface ThemePreset {
  style: 'modern' | 'classic' | 'minimal' | 'bold';
  primaryColor: string;
  features: string[];
  description: string;
  typography?: {
    heading?: string;
    body?: string;
  };
  spacing?: 'compact' | 'comfortable' | 'spacious';
  borderRadius?: 'sharp' | 'rounded' | 'pill';
}

export const themePresets: Record<string, ThemePreset> = {
  'ecommerce-modern': {
    style: 'modern',
    primaryColor: '#f59e0b', // Amber
    features: ['gradients', 'shadows', 'animations', 'product-focus'],
    description: 'Bold and engaging design perfect for modern e-commerce platforms with strong CTAs and product showcases',
    typography: {
      heading: 'Poppins',
      body: 'Inter'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'ecommerce-luxury': {
    style: 'classic',
    primaryColor: '#1f2937', // Dark gray
    features: ['minimal', 'elegant', 'premium'],
    description: 'Sophisticated and premium aesthetic for luxury brands with emphasis on whitespace and typography',
    typography: {
      heading: 'Playfair Display',
      body: 'Source Sans Pro'
    },
    spacing: 'spacious',
    borderRadius: 'sharp'
  },
  
  'saas-professional': {
    style: 'minimal',
    primaryColor: '#3b82f6', // Blue
    features: ['clean', 'readable', 'accessible', 'data-focused'],
    description: 'Clean and professional interface optimized for productivity and data visualization',
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    spacing: 'compact',
    borderRadius: 'rounded'
  },
  
  'saas-creative': {
    style: 'bold',
    primaryColor: '#8b5cf6', // Purple
    features: ['vibrant', 'playful', 'innovative'],
    description: 'Creative and vibrant design for innovative SaaS products with bold visual elements',
    typography: {
      heading: 'Outfit',
      body: 'Inter'
    },
    spacing: 'comfortable',
    borderRadius: 'pill'
  },
  
  'landing-startup': {
    style: 'bold',
    primaryColor: '#10b981', // Emerald
    features: ['gradients', 'animations', 'parallax', 'conversion-focused'],
    description: 'High-impact landing page design with strong conversion focus and dynamic elements',
    typography: {
      heading: 'Space Grotesk',
      body: 'Inter'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'landing-corporate': {
    style: 'classic',
    primaryColor: '#1e40af', // Blue
    features: ['trustworthy', 'professional', 'corporate'],
    description: 'Professional corporate design that builds trust and credibility',
    typography: {
      heading: 'Source Sans Pro',
      body: 'Source Sans Pro'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'blog-modern': {
    style: 'minimal',
    primaryColor: '#059669', // Emerald
    features: ['readable', 'content-focused', 'typography'],
    description: 'Reader-friendly design optimized for content consumption and engagement',
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    spacing: 'spacious',
    borderRadius: 'rounded'
  },
  
  'blog-editorial': {
    style: 'classic',
    primaryColor: '#dc2626', // Red
    features: ['serif', 'editorial', 'magazine-style'],
    description: 'Editorial magazine-style design with sophisticated typography and layout',
    typography: {
      heading: 'Merriweather',
      body: 'Merriweather'
    },
    spacing: 'spacious',
    borderRadius: 'sharp'
  },
  
  'portfolio-creative': {
    style: 'bold',
    primaryColor: '#ec4899', // Pink
    features: ['artistic', 'showcase', 'visual-impact'],
    description: 'Creative portfolio design that showcases work with artistic flair and visual impact',
    typography: {
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'portfolio-minimal': {
    style: 'minimal',
    primaryColor: '#6b7280', // Gray
    features: ['minimal', 'focus', 'gallery'],
    description: 'Minimalist portfolio that lets the work speak for itself with clean presentation',
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    spacing: 'spacious',
    borderRadius: 'sharp'
  },
  
  'dashboard-analytics': {
    style: 'modern',
    primaryColor: '#06b6d4', // Cyan
    features: ['data-visualization', 'charts', 'metrics'],
    description: 'Data-focused dashboard design optimized for analytics and metrics visualization',
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    spacing: 'compact',
    borderRadius: 'rounded'
  },
  
  'dashboard-dark': {
    style: 'modern',
    primaryColor: '#8b5cf6', // Purple
    features: ['dark-mode', 'glassmorphism', 'neon-accents'],
    description: 'Dark mode dashboard with glassmorphism effects and vibrant accent colors',
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'mobile-app': {
    style: 'modern',
    primaryColor: '#f59e0b', // Amber
    features: ['touch-friendly', 'mobile-first', 'gestures'],
    description: 'Mobile-optimized design with touch-friendly interactions and native app feel',
    typography: {
      heading: 'System UI',
      body: 'System UI'
    },
    spacing: 'comfortable',
    borderRadius: 'pill'
  },
  
  'web3-crypto': {
    style: 'bold',
    primaryColor: '#7c3aed', // Violet
    features: ['futuristic', 'gradients', 'crypto-aesthetic'],
    description: 'Futuristic Web3 design with gradient backgrounds and cryptocurrency-inspired aesthetics',
    typography: {
      heading: 'Space Grotesk',
      body: 'Inter'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'medical-healthcare': {
    style: 'classic',
    primaryColor: '#0ea5e9', // Sky blue
    features: ['trustworthy', 'accessible', 'calming'],
    description: 'Healthcare-focused design that prioritizes trust, accessibility, and calming aesthetics',
    typography: {
      heading: 'Source Sans Pro',
      body: 'Source Sans Pro'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'education-learning': {
    style: 'modern',
    primaryColor: '#f97316', // Orange
    features: ['engaging', 'interactive', 'learning-focused'],
    description: 'Educational platform design that enhances learning with engaging and interactive elements',
    typography: {
      heading: 'Nunito',
      body: 'Nunito'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'gaming-esports': {
    style: 'bold',
    primaryColor: '#ef4444', // Red
    features: ['gaming-aesthetic', 'neon', 'high-contrast'],
    description: 'Gaming and esports design with high contrast, neon accents, and dynamic elements',
    typography: {
      heading: 'Rajdhani',
      body: 'Inter'
    },
    spacing: 'compact',
    borderRadius: 'sharp'
  },
  
  'restaurant-food': {
    style: 'classic',
    primaryColor: '#dc2626', // Red
    features: ['appetizing', 'warm-colors', 'menu-focused'],
    description: 'Restaurant and food service design with warm colors and appetite-appealing aesthetics',
    typography: {
      heading: 'Playfair Display',
      body: 'Open Sans'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'real-estate': {
    style: 'classic',
    primaryColor: '#059669', // Emerald
    features: ['professional', 'property-showcase', 'trustworthy'],
    description: 'Real estate design focused on property showcasing with professional and trustworthy appearance',
    typography: {
      heading: 'Montserrat',
      body: 'Open Sans'
    },
    spacing: 'comfortable',
    borderRadius: 'rounded'
  },
  
  'finance-fintech': {
    style: 'minimal',
    primaryColor: '#1e40af', // Blue
    features: ['secure', 'data-focused', 'professional'],
    description: 'Financial services design emphasizing security, data clarity, and professional credibility',
    typography: {
      heading: 'Inter',
      body: 'Inter'
    },
    spacing: 'compact',
    borderRadius: 'rounded'
  }
};

// Helper functions to work with presets
export function getPresetsByDomain(domain: string): ThemePreset[] {
  return Object.entries(themePresets)
    .filter(([key]) => key.toLowerCase().includes(domain.toLowerCase()))
    .map(([, preset]) => preset);
}

export function getPresetsByStyle(style: ThemePreset['style']): ThemePreset[] {
  return Object.entries(themePresets)
    .filter(([, preset]) => preset.style === style)
    .map(([, preset]) => preset);
}

export function getPresetByName(name: string): ThemePreset | undefined {
  return themePresets[name];
}

export function getAllPresetNames(): string[] {
  return Object.keys(themePresets);
}

export function getRandomPreset(): { name: string; preset: ThemePreset } {
  const names = getAllPresetNames();
  const randomName = names[Math.floor(Math.random() * names.length)];
  return {
    name: randomName,
    preset: themePresets[randomName]
  };
}

// Color palette suggestions for different industries
export const industryColors = {
  technology: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'],
  healthcare: ['#0ea5e9', '#10b981', '#06b6d4', '#3b82f6'],
  finance: ['#1e40af', '#059669', '#0f766e', '#374151'],
  ecommerce: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'],
  education: ['#f97316', '#eab308', '#84cc16', '#22c55e'],
  creative: ['#ec4899', '#8b5cf6', '#f59e0b', '#ef4444'],
  corporate: ['#1f2937', '#374151', '#059669', '#1e40af'],
  food: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a'],
  travel: ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b'],
  gaming: ['#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4']
};

// Typography combinations for different use cases
export const typographyCombinations = {
  modern: [
    { heading: 'Inter', body: 'Inter' },
    { heading: 'Poppins', body: 'Inter' },
    { heading: 'Space Grotesk', body: 'Inter' },
    { heading: 'Outfit', body: 'Inter' }
  ],
  classic: [
    { heading: 'Playfair Display', body: 'Source Sans Pro' },
    { heading: 'Merriweather', body: 'Open Sans' },
    { heading: 'Lora', body: 'PT Sans' },
    { heading: 'Crimson Text', body: 'Lato' }
  ],
  minimal: [
    { heading: 'Inter', body: 'Inter' },
    { heading: 'System UI', body: 'System UI' },
    { heading: 'Helvetica Neue', body: 'Helvetica Neue' }
  ],
  creative: [
    { heading: 'Montserrat', body: 'Open Sans' },
    { heading: 'Oswald', body: 'Nunito' },
    { heading: 'Raleway', body: 'Source Sans Pro' },
    { heading: 'Quicksand', body: 'Nunito' }
  ]
};