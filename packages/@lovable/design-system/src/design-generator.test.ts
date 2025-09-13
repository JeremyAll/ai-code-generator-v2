import { describe, it, expect } from 'vitest';
import { DesignSystemGenerator } from './design-generator';

describe('DesignSystemGenerator', () => {
  const generator = new DesignSystemGenerator();

  describe('generate', () => {
    it('should generate a complete design system', () => {
      const result = generator.generate('ecommerce', 'modern', '#f59e0b');
      
      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('typography');
      expect(result).toHaveProperty('spacing');
      expect(result).toHaveProperty('borderRadius');
      expect(result).toHaveProperty('shadows');
      expect(result).toHaveProperty('animations');
      expect(result).toHaveProperty('breakpoints');
    });

    it('should use provided primary color', () => {
      const customColor = '#ff6b35';
      const result = generator.generate('saas', 'modern', customColor);
      
      expect(result.colors.primary['500']).toBe(customColor);
    });

    it('should use default color when none provided', () => {
      const result = generator.generate('saas', 'modern');
      
      expect(result.colors.primary['500']).toBe('#3b82f6'); // Default SaaS color
    });

    it('should generate different styles', () => {
      const modern = generator.generate('ecommerce', 'modern');
      const minimal = generator.generate('ecommerce', 'minimal');
      
      // Minimal should have smaller spacing base
      expect(minimal.spacing['4']).not.toBe(modern.spacing['4']);
    });
  });

  describe('color palette generation', () => {
    it('should generate complete primary color scale', () => {
      const result = generator.generate('ecommerce', 'modern', '#f59e0b');
      
      const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      shades.forEach(shade => {
        expect(result.colors.primary).toHaveProperty(shade);
        expect(result.colors.primary[shade as keyof typeof result.colors.primary]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should include semantic colors', () => {
      const result = generator.generate('ecommerce');
      
      expect(result.colors.semantic).toHaveProperty('success');
      expect(result.colors.semantic).toHaveProperty('warning');
      expect(result.colors.semantic).toHaveProperty('error');
      expect(result.colors.semantic).toHaveProperty('info');
    });
  });

  describe('typography generation', () => {
    it('should generate domain-specific fonts', () => {
      const ecommerce = generator.generate('ecommerce');
      const blog = generator.generate('blog');
      
      expect(ecommerce.typography.fontFamily.heading).toBe('Poppins');
      expect(blog.typography.fontFamily.heading).toBe('Merriweather');
    });

    it('should include complete font scale', () => {
      const result = generator.generate('saas');
      
      expect(result.typography.fontSize).toHaveProperty('xs');
      expect(result.typography.fontSize).toHaveProperty('base');
      expect(result.typography.fontSize).toHaveProperty('xl');
      expect(result.typography.fontSize).toHaveProperty('5xl');
    });
  });

  describe('spacing generation', () => {
    it('should generate spacing scale based on style', () => {
      const modern = generator.generate('ecommerce', 'modern');
      const minimal = generator.generate('ecommerce', 'minimal');
      
      // Modern uses 8px base, minimal uses 4px base
      expect(modern.spacing['4']).toBe('8px');
      expect(minimal.spacing['4']).toBe('4px');
    });
  });

  describe('border radius generation', () => {
    it('should generate different radius scales by style', () => {
      const modern = generator.generate('ecommerce', 'modern');
      const minimal = generator.generate('ecommerce', 'minimal');
      
      expect(minimal.borderRadius.base).toBe('4px');
      expect(modern.borderRadius.base).toBe('8px');
    });
  });
});