// Core services
export { IconService } from './icon-service';
export { IllustrationService } from './illustration-service';
export { PatternGenerator, type PatternOptions, type GradientOptions } from './pattern-generator';
export { EmojiService, type EmojiMapping } from './emoji-service';

import { IconService } from './icon-service';
import { IllustrationService } from './illustration-service';
import { PatternGenerator } from './pattern-generator';
import { EmojiService } from './emoji-service';

export interface AssetConfig {
  domain: string;
  framework?: 'react' | 'vue' | 'angular' | 'html';
  includeIcons?: boolean;
  includeIllustrations?: boolean;
  includePatterns?: boolean;
  includeEmojis?: boolean;
  emojiProbability?: number;
  customIcons?: Record<string, string>;
  customPatterns?: Record<string, string>;
}

export interface AssetResult {
  code: string;
  assets: {
    icons: Record<string, string>;
    illustrations: Record<string, string>;
    patterns: Record<string, string>;
    emojis: string[];
  };
  components: Record<string, string>;
  metadata: {
    totalAssets: number;
    assetsUsed: string[];
    domain: string;
    framework: string;
    generatedAt: string;
  };
}

/**
 * Main function to enhance generated code with comprehensive assets
 * @param code - The generated HTML/React/Vue code to enhance
 * @param config - Asset configuration options
 * @returns Enhanced code with icons, illustrations, patterns, and emojis
 */
export async function enhanceWithAssets(
  code: string,
  config: AssetConfig
): Promise<AssetResult> {
  const {
    domain,
    framework = 'html',
    includeIcons = true,
    includeIllustrations = true,
    includePatterns = true,
    includeEmojis = true,
    emojiProbability = 0.3,
    customIcons = {},
    customPatterns = {}
  } = config;

  // Initialize services
  const iconService = new IconService();
  const illustrationService = new IllustrationService();
  const patternGenerator = new PatternGenerator();
  const emojiService = new EmojiService();

  let enhancedCode = code;
  const usedAssets: string[] = [];
  const components: Record<string, string> = {};

  // Collect all assets
  const assets = {
    icons: {} as Record<string, string>,
    illustrations: {} as Record<string, string>,
    patterns: {} as Record<string, string>,
    emojis: [] as string[]
  };

  try {
    // 1. Add Icons
    if (includeIcons) {
      const domainIcons = iconService.getIconsForDomain(domain);
      assets.icons = { ...domainIcons, ...customIcons };

      // Inject icons into code
      enhancedCode = iconService.injectIconsIntoCode(
        enhancedCode,
        assets.icons,
        domain
      );

      // Generate framework components
      Object.entries(assets.icons).forEach(([name, svg]) => {
        const componentName = `${name.charAt(0).toUpperCase() + name.slice(1)}Icon`;
        components[componentName] = iconService.generateIconComponent(
          name,
          framework
        );
      });

      usedAssets.push('icons');
    }

    // 2. Add Illustrations
    if (includeIllustrations) {
      const domainIllustrations = illustrationService.getIllustrationsForDomain(domain);
      assets.illustrations = domainIllustrations;

      // Inject illustrations into code
      enhancedCode = illustrationService.injectIllustrationsIntoCode(
        enhancedCode,
        assets.illustrations,
        domain
      );

      // Generate framework components
      Object.entries(assets.illustrations).forEach(([key, svg]) => {
        const componentName = `${key.split('-').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join('')}Illustration`;
        
        const [category, name] = key.split('-');
        components[componentName] = illustrationService.generateIllustrationComponent(
          category,
          name,
          framework
        );
      });

      usedAssets.push('illustrations');
    }

    // 3. Add Patterns
    if (includePatterns) {
      const domainPatterns = patternGenerator.getDomainPatterns(domain);
      assets.patterns = { ...domainPatterns, ...customPatterns };

      // Inject patterns into code
      enhancedCode = patternGenerator.injectPatternsIntoCode(
        enhancedCode,
        assets.patterns,
        domain
      );

      // Generate framework components
      Object.entries(assets.patterns).forEach(([name, pattern]) => {
        const componentName = `${name.charAt(0).toUpperCase() + name.slice(1)}Pattern`;
        components[componentName] = patternGenerator.generateFrameworkComponent(
          name,
          pattern,
          framework
        );
      });

      usedAssets.push('patterns');
    }

    // 4. Add Emojis
    if (includeEmojis) {
      const domainEmojis = emojiService.getEmojisForDomain(domain);
      assets.emojis = Object.values(domainEmojis).flat();

      // Inject emojis into code
      enhancedCode = emojiService.injectEmojisIntoCode(
        enhancedCode,
        domain,
        { 
          probability: emojiProbability,
          contextAware: true,
          preserveExisting: true 
        }
      );

      usedAssets.push('emojis');
    }

    // Calculate total assets
    const totalAssets = Object.keys(assets.icons).length +
                       Object.keys(assets.illustrations).length +
                       Object.keys(assets.patterns).length +
                       assets.emojis.length;

    return {
      code: enhancedCode,
      assets,
      components,
      metadata: {
        totalAssets,
        assetsUsed: usedAssets,
        domain,
        framework,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('Error enhancing with assets:', error);
    
    // Return fallback with original code
    return {
      code,
      assets: {
        icons: {},
        illustrations: {},
        patterns: {},
        emojis: []
      },
      components: {},
      metadata: {
        totalAssets: 0,
        assetsUsed: [],
        domain,
        framework,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Quick helper to get all assets for a specific domain
 * @param domain - The application domain
 * @returns All available assets for the domain
 */
export async function getAssetsForDomain(domain: string): Promise<{
  icons: Record<string, string>;
  illustrations: Record<string, string>;
  patterns: Record<string, string>;
  emojis: Record<string, string[]>;
}> {
  const iconService = new IconService();
  const illustrationService = new IllustrationService();
  const patternGenerator = new PatternGenerator();
  const emojiService = new EmojiService();

  return {
    icons: iconService.getIconsForDomain(domain),
    illustrations: illustrationService.getIllustrationsForDomain(domain),
    patterns: patternGenerator.getDomainPatterns(domain),
    emojis: emojiService.getEmojisForDomain(domain)
  };
}

/**
 * Search for specific assets
 * @param query - Search query
 * @param type - Asset type to search in
 * @returns Matching assets
 */
export function searchAssets(
  query: string,
  type: 'icons' | 'illustrations' | 'patterns' | 'emojis' | 'all' = 'all'
): Record<string, any> {
  const iconService = new IconService();
  const illustrationService = new IllustrationService();
  const emojiService = new EmojiService();

  const results: Record<string, any> = {};

  if (type === 'icons' || type === 'all') {
    results.icons = iconService.searchIcons(query);
  }

  if (type === 'illustrations' || type === 'all') {
    results.illustrations = illustrationService.searchIllustrations(query);
  }

  if (type === 'emojis' || type === 'all') {
    results.emojis = emojiService.searchEmojis(query);
  }

  return results;
}

/**
 * Generate a single icon component
 * @param name - Icon name
 * @param framework - Target framework
 * @param options - Icon options
 * @returns Icon component code
 */
export function generateIconComponent(
  name: string,
  framework: 'react' | 'vue' | 'angular' | 'html' = 'react',
  options: { size?: number; color?: string; className?: string } = {}
): string {
  const iconService = new IconService();
  return iconService.generateIconComponent(name, framework, options);
}

/**
 * Generate a single illustration component
 * @param category - Illustration category
 * @param name - Illustration name
 * @param framework - Target framework
 * @returns Illustration component code
 */
export function generateIllustrationComponent(
  category: string,
  name: string,
  framework: 'react' | 'vue' | 'html' = 'react'
): string {
  const illustrationService = new IllustrationService();
  return illustrationService.generateIllustrationComponent(category, name, framework);
}

/**
 * Generate pattern CSS or component
 * @param patternName - Pattern name
 * @param patternValue - Pattern value/definition
 * @param framework - Target framework
 * @returns Pattern component or CSS
 */
export function generatePatternComponent(
  patternName: string,
  patternValue: string,
  framework: 'react' | 'vue' | 'angular' | 'html' = 'react'
): string {
  const patternGenerator = new PatternGenerator();
  return patternGenerator.generateFrameworkComponent(patternName, patternValue, framework);
}

/**
 * Add contextual emojis to text content
 * @param text - Text content
 * @param context - Context for emoji selection
 * @param domain - Application domain
 * @returns Text with contextual emojis
 */
export function addContextualEmojis(
  text: string,
  context: string,
  domain: string
): string {
  const emojiService = new EmojiService();
  const emoji = emojiService.generateEmojiForElement('text', domain, context);
  return `${emoji} ${text}`;
}

/**
 * Replace placeholder assets in code
 * @param code - Code with placeholder assets
 * @param domain - Application domain
 * @param framework - Target framework
 * @returns Enhanced code with real assets
 */
export async function replacePlaceholderAssets(
  code: string,
  domain: string,
  framework: 'react' | 'vue' | 'angular' | 'html' = 'html'
): Promise<{ code: string; assetsUsed: string[] }> {
  const result = await enhanceWithAssets(code, {
    domain,
    framework,
    includeIcons: true,
    includeIllustrations: true,
    includePatterns: true,
    includeEmojis: true,
    emojiProbability: 0.4
  });

  return {
    code: result.code,
    assetsUsed: result.metadata.assetsUsed
  };
}

/**
 * Get comprehensive asset bundle for offline use
 * @param domains - Array of domains to include
 * @returns Complete asset bundle
 */
export async function getAssetBundle(
  domains: string[] = ['ecommerce', 'saas', 'landing', 'blog', 'portfolio']
): Promise<Record<string, any>> {
  const bundle: Record<string, any> = {};

  for (const domain of domains) {
    bundle[domain] = await getAssetsForDomain(domain);
  }

  return bundle;
}

/**
 * Validate and optimize assets for production
 * @param assets - Assets to validate
 * @returns Validation results and optimized assets
 */
export function validateAssets(assets: Record<string, any>): {
  valid: boolean;
  errors: string[];
  optimized: Record<string, any>;
} {
  const errors: string[] = [];
  const optimized = { ...assets };

  // Validate SVG icons
  if (assets.icons) {
    Object.entries(assets.icons).forEach(([name, svg]) => {
      if (typeof svg !== 'string' || !svg.includes('<svg')) {
        errors.push(`Invalid icon: ${name}`);
      }
    });
  }

  // Validate patterns
  if (assets.patterns) {
    Object.entries(assets.patterns).forEach(([name, pattern]) => {
      if (typeof pattern !== 'string') {
        errors.push(`Invalid pattern: ${name}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    optimized
  };
}

// Default export with all main functions
export default {
  enhanceWithAssets,
  getAssetsForDomain,
  searchAssets,
  generateIconComponent,
  generateIllustrationComponent,
  generatePatternComponent,
  addContextualEmojis,
  replacePlaceholderAssets,
  getAssetBundle,
  validateAssets,
  
  // Classes for advanced usage
  IconService,
  IllustrationService,
  PatternGenerator,
  EmojiService
};

// Type exports
export type {
  AssetConfig,
  AssetResult,
  PatternOptions,
  GradientOptions,
  EmojiMapping
};