import { Logger } from '../utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

export interface CachedComponent {
  name: string;
  code: string;
  style: string; // modern, minimal, playful, corporate, glassmorphism
  tech: string;  // nextjs, react, vue, etc
  version: string;
  dependencies?: string[];
}

export class ComponentCache {
  private logger: Logger;
  private cachePath: string;
  private cache: Map<string, CachedComponent> = new Map();

  constructor() {
    this.logger = new Logger();
    this.cachePath = path.join(process.cwd(), 'cache', 'components');
    this.ensureCacheDir();
    this.loadCache();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cachePath)) {
      fs.mkdirSync(this.cachePath, { recursive: true });
      this.logger.log('INFO', 'Cache directory created');
    }
  }

  private loadCache(): void {
    try {
      const cacheFile = path.join(this.cachePath, 'components-cache.json');
      if (fs.existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        this.cache = new Map(Object.entries(data));
        this.logger.log('INFO', `Cache loaded: ${this.cache.size} components`);
      } else {
        // Initialize with common components
        this.initializeDefaultCache();
      }
    } catch (error) {
      this.logger.log('ERROR', 'Failed to load cache', error);
      this.initializeDefaultCache();
    }
  }

  private initializeDefaultCache(): void {
    const defaultComponents = this.getDefaultComponents();
    defaultComponents.forEach(comp => {
      const key = this.getCacheKey(comp.name, comp.style, comp.tech);
      this.cache.set(key, comp);
    });
    this.saveCache();
    this.logger.log('INFO', 'Default cache initialized');
  }

  private saveCache(): void {
    try {
      const cacheFile = path.join(this.cachePath, 'components-cache.json');
      const cacheData = Object.fromEntries(this.cache);
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      this.logger.log('ERROR', 'Failed to save cache', error);
    }
  }

  private getCacheKey(name: string, style: string, tech: string): string {
    return `${name}-${style}-${tech}`;
  }

  /**
   * Vérifie si un composant est disponible en cache
   */
  hasComponent(name: string, style: string, tech: string): boolean {
    const key = this.getCacheKey(name, style, tech);
    return this.cache.has(key);
  }

  /**
   * Récupère un composant du cache
   */
  getComponent(name: string, style: string, tech: string): CachedComponent | null {
    const key = this.getCacheKey(name, style, tech);
    return this.cache.get(key) || null;
  }

  /**
   * Ajoute un composant au cache
   */
  setComponent(component: CachedComponent): void {
    const key = this.getCacheKey(component.name, component.style, component.tech);
    this.cache.set(key, component);
    this.saveCache();
    this.logger.log('INFO', `Component cached: ${key}`);
  }

  /**
   * Filtre les composants à générer (exclut ceux en cache)
   */
  filterComponentsToGenerate(requiredComponents: string[], style: string, tech: string): string[] {
    return requiredComponents.filter(name => !this.hasComponent(name, style, tech));
  }

  /**
   * Récupère tous les composants cachés pour un style/tech donné
   */
  getCachedComponents(style: string, tech: string): Map<string, string> {
    const components = new Map<string, string>();
    
    for (const [key, component] of this.cache) {
      if (component.style === style && component.tech === tech) {
        const fileName = this.getComponentFileName(component.name);
        components.set(fileName, component.code);
      }
    }

    this.logger.log('INFO', `Retrieved ${components.size} cached components for ${style}/${tech}`);
    return components;
  }

  private getComponentFileName(componentName: string): string {
    const componentMap: { [key: string]: string } = {
      'navbar': 'components/ui/Navbar.tsx',
      'footer': 'components/ui/Footer.tsx', 
      'button': 'components/ui/Button.tsx',
      'card': 'components/ui/Card.tsx',
      'modal': 'components/ui/Modal.tsx',
      'form': 'components/ui/Form.tsx',
      'table': 'components/ui/Table.tsx',
      'sidebar': 'components/ui/Sidebar.tsx',
      'hero': 'components/ui/Hero.tsx',
      'auth-form': 'components/auth/AuthForm.tsx',
      'loading': 'components/ui/Loading.tsx'
    };

    return componentMap[componentName] || `components/ui/${componentName.charAt(0).toUpperCase() + componentName.slice(1)}.tsx`;
  }

  /**
   * Composants par défaut pour initialiser le cache
   */
  private getDefaultComponents(): CachedComponent[] {
    return [
      {
        name: 'navbar',
        style: 'modern',
        tech: 'nextjs',
        version: '1.0.0',
        code: `'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-xl text-gray-900">
            Logo
          </Link>
          <div className="hidden md:flex space-x-8">
            <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              Login
            </Link>
            <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}`
      },
      {
        name: 'button',
        style: 'modern',
        tech: 'nextjs',
        version: '1.0.0',
        code: `import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;`
      },
      {
        name: 'loading',
        style: 'modern',
        tech: 'nextjs',
        version: '1.0.0',
        code: `export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
}`
      }
    ];
  }

  /**
   * Statistiques du cache
   */
  getCacheStats(): { total: number; byStyle: Record<string, number>; byTech: Record<string, number> } {
    const stats = {
      total: this.cache.size,
      byStyle: {} as Record<string, number>,
      byTech: {} as Record<string, number>
    };

    for (const component of this.cache.values()) {
      stats.byStyle[component.style] = (stats.byStyle[component.style] || 0) + 1;
      stats.byTech[component.tech] = (stats.byTech[component.tech] || 0) + 1;
    }

    return stats;
  }
}