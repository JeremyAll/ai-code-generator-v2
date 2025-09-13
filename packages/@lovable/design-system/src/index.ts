// Core design system components
export { DesignSystemGenerator, type DesignSystem, type ColorPalette, type Typography, type SpacingScale, type RadiusScale, type ShadowScale, type AnimationConfig, type Breakpoints } from './design-generator';
export { CSSGenerator } from './css-generator';
export { TailwindConfigGenerator } from './tailwind-config-generator';

// Theme presets and utilities
export { 
  themePresets, 
  industryColors, 
  typographyCombinations,
  getPresetsByDomain,
  getPresetsByStyle,
  getPresetByName,
  getAllPresetNames,
  getRandomPreset,
  type ThemePreset 
} from './theme-presets';

/**
 * Main helper function to generate a complete design system
 * @param domain - The application domain (e.g., 'ecommerce', 'saas', 'landing', 'blog')
 * @param style - The design style ('modern', 'classic', 'minimal', 'bold')
 * @param primaryColor - Optional primary color override (hex format)
 * @param presetName - Optional preset name to use instead of domain/style
 * @returns Complete design system with CSS, Tailwind config, and design tokens
 */
export function generateDesignSystem(
  domain: string,
  style: 'modern' | 'classic' | 'minimal' | 'bold' = 'modern',
  primaryColor?: string,
  presetName?: string
) {
  const generator = new DesignSystemGenerator();
  
  // Use preset if provided, otherwise generate from domain/style
  let designSystem;
  if (presetName && themePresets[presetName]) {
    const preset = themePresets[presetName];
    designSystem = generator.generate(
      domain, 
      preset.style, 
      primaryColor || preset.primaryColor
    );
  } else {
    designSystem = generator.generate(domain, style, primaryColor);
  }
  
  const cssGenerator = new CSSGenerator();
  const css = cssGenerator.generateCSS(designSystem);
  
  const tailwindGenerator = new TailwindConfigGenerator();
  const tailwindConfig = tailwindGenerator.generate(designSystem);
  
  return {
    designSystem,
    css,
    tailwindConfig,
    metadata: {
      domain,
      style: presetName ? themePresets[presetName].style : style,
      primaryColor: primaryColor || (presetName ? themePresets[presetName].primaryColor : undefined),
      preset: presetName,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

/**
 * Generate a design system from a preset name
 * @param presetName - Name of the preset to use
 * @param primaryColorOverride - Optional primary color override
 * @returns Complete design system based on the preset
 */
export function generateFromPreset(presetName: string, primaryColorOverride?: string) {
  const preset = themePresets[presetName];
  if (!preset) {
    throw new Error(`Preset "${presetName}" not found. Available presets: ${getAllPresetNames().join(', ')}`);
  }
  
  // Extract domain from preset name (e.g., 'ecommerce-modern' -> 'ecommerce')
  const domain = presetName.split('-')[0];
  
  return generateDesignSystem(
    domain,
    preset.style,
    primaryColorOverride || preset.primaryColor,
    presetName
  );
}

/**
 * Generate multiple design variations for comparison
 * @param domain - The application domain
 * @param primaryColor - Optional primary color
 * @returns Array of design systems with different styles
 */
export function generateDesignVariations(domain: string, primaryColor?: string) {
  const styles: Array<'modern' | 'classic' | 'minimal' | 'bold'> = ['modern', 'classic', 'minimal', 'bold'];
  
  return styles.map(style => ({
    style,
    ...generateDesignSystem(domain, style, primaryColor)
  }));
}

/**
 * Get recommended presets for a specific domain
 * @param domain - The application domain
 * @returns Array of recommended preset names
 */
export function getRecommendedPresets(domain: string): string[] {
  return getAllPresetNames().filter(name => 
    name.toLowerCase().includes(domain.toLowerCase())
  );
}

/**
 * Validate a design system configuration
 * @param designSystem - The design system to validate
 * @returns Validation result with any issues found
 */
export function validateDesignSystem(designSystem: DesignSystem) {
  const issues: string[] = [];
  
  // Check color contrast ratios
  if (!designSystem.colors.primary || !designSystem.colors.background) {
    issues.push('Missing primary color or background color');
  }
  
  // Check typography scale
  if (!designSystem.typography.fontSize.base) {
    issues.push('Missing base font size');
  }
  
  // Check spacing scale
  if (!designSystem.spacing[4]) {
    issues.push('Missing base spacing unit');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Export design system as various formats
 * @param designSystem - The design system to export
 * @returns Object with different export formats
 */
export function exportDesignSystem(designSystem: DesignSystem) {
  const cssGenerator = new CSSGenerator();
  const tailwindGenerator = new TailwindConfigGenerator();
  
  return {
    css: cssGenerator.generateCSS(designSystem),
    tailwindConfig: tailwindGenerator.generate(designSystem),
    json: JSON.stringify(designSystem, null, 2),
    scss: generateSCSSVariables(designSystem),
    js: `export const designSystem = ${JSON.stringify(designSystem, null, 2)};`,
    ts: `import type { DesignSystem } from '@lovable/design-system';\n\nexport const designSystem: DesignSystem = ${JSON.stringify(designSystem, null, 2)};`
  };
}

/**
 * Generate SCSS variables from design system
 * @param designSystem - The design system
 * @returns SCSS variables string
 */
function generateSCSSVariables(designSystem: DesignSystem): string {
  let scss = '// Design System Variables\n\n';
  
  // Colors
  scss += '// Colors\n';
  Object.entries(designSystem.colors.primary).forEach(([shade, value]) => {
    scss += `$color-primary-${shade}: ${value};\n`;
  });
  
  // Typography
  scss += '\n// Typography\n';
  Object.entries(designSystem.typography.fontSize).forEach(([size, value]) => {
    scss += `$text-${size}: ${value};\n`;
  });
  
  // Spacing
  scss += '\n// Spacing\n';
  Object.entries(designSystem.spacing).forEach(([key, value]) => {
    const varName = key === '0.5' ? '0_5' : key;
    scss += `$space-${varName}: ${value};\n`;
  });
  
  return scss;
}

// Default export
export default {
  generateDesignSystem,
  generateFromPreset,
  generateDesignVariations,
  getRecommendedPresets,
  validateDesignSystem,
  exportDesignSystem,
  DesignSystemGenerator,
  CSSGenerator,
  TailwindConfigGenerator,
  themePresets
};