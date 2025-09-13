import { describe, it, expect } from 'vitest';
import { generateDesignSystem, generateFromPreset, generateDesignVariations, validateDesignSystem, exportDesignSystem } from './index';

describe('Design System API', () => {
  describe('generateDesignSystem', () => {
    it('should generate complete design system', () => {
      const result = generateDesignSystem('ecommerce', 'modern', '#f59e0b');
      
      expect(result).toHaveProperty('designSystem');
      expect(result).toHaveProperty('css');
      expect(result).toHaveProperty('tailwindConfig');
      expect(result).toHaveProperty('metadata');
    });

    it('should include metadata', () => {
      const result = generateDesignSystem('saas', 'minimal');
      
      expect(result.metadata).toHaveProperty('domain', 'saas');
      expect(result.metadata).toHaveProperty('style', 'minimal');
      expect(result.metadata).toHaveProperty('generatedAt');
      expect(result.metadata).toHaveProperty('version');
    });

    it('should generate valid CSS', () => {
      const result = generateDesignSystem('blog', 'classic');
      
      expect(result.css).toContain(':root');
      expect(result.css).toContain('--color-primary');
      expect(result.css).toContain('.btn');
      expect(result.css).toContain('@keyframes');
    });

    it('should generate valid Tailwind config', () => {
      const result = generateDesignSystem('portfolio', 'bold');
      
      expect(result.tailwindConfig).toContain('module.exports');
      expect(result.tailwindConfig).toContain('content');
      expect(result.tailwindConfig).toContain('theme');
      expect(result.tailwindConfig).toContain('extend');
    });
  });

  describe('generateFromPreset', () => {
    it('should generate from existing preset', () => {
      const result = generateFromPreset('ecommerce-modern');
      
      expect(result.metadata.preset).toBe('ecommerce-modern');
      expect(result.metadata.domain).toBe('ecommerce');
    });

    it('should throw error for invalid preset', () => {
      expect(() => {
        generateFromPreset('invalid-preset');
      }).toThrow('Preset "invalid-preset" not found');
    });

    it('should allow primary color override', () => {
      const customColor = '#ff0000';
      const result = generateFromPreset('saas-professional', customColor);
      
      expect(result.designSystem.colors.primary['500']).toBe(customColor);
    });
  });

  describe('generateDesignVariations', () => {
    it('should generate all style variations', () => {
      const variations = generateDesignVariations('landing');
      
      expect(variations).toHaveLength(4);
      expect(variations.map(v => v.style)).toEqual(['modern', 'classic', 'minimal', 'bold']);
    });

    it('should use custom primary color for all variations', () => {
      const customColor = '#123456';
      const variations = generateDesignVariations('dashboard', customColor);
      
      variations.forEach(variation => {
        expect(variation.designSystem.colors.primary['500']).toBe(customColor);
      });
    });
  });

  describe('validateDesignSystem', () => {
    it('should validate valid design system', () => {
      const { designSystem } = generateDesignSystem('ecommerce');
      const validation = validateDesignSystem(designSystem);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect missing colors', () => {
      const invalidSystem = {
        colors: {},
        typography: { fontSize: { base: '16px' } },
        spacing: { 4: '8px' }
      } as any;
      
      const validation = validateDesignSystem(invalidSystem);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Missing primary color or background color');
    });
  });

  describe('exportDesignSystem', () => {
    it('should export in multiple formats', () => {
      const { designSystem } = generateDesignSystem('blog');
      const exports = exportDesignSystem(designSystem);
      
      expect(exports).toHaveProperty('css');
      expect(exports).toHaveProperty('tailwindConfig');
      expect(exports).toHaveProperty('json');
      expect(exports).toHaveProperty('scss');
      expect(exports).toHaveProperty('js');
      expect(exports).toHaveProperty('ts');
    });

    it('should generate valid JSON export', () => {
      const { designSystem } = generateDesignSystem('saas');
      const exports = exportDesignSystem(designSystem);
      
      expect(() => JSON.parse(exports.json)).not.toThrow();
    });

    it('should generate SCSS variables', () => {
      const { designSystem } = generateDesignSystem('portfolio');
      const exports = exportDesignSystem(designSystem);
      
      expect(exports.scss).toContain('$color-primary');
      expect(exports.scss).toContain('$text-base');
      expect(exports.scss).toContain('$space-');
    });
  });
});