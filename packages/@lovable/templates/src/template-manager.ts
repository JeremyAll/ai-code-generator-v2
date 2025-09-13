import * as fs from 'fs-extra';
import * as path from 'path';

export interface Template {
  name: string;
  description: string;
  category: string;
  framework: string;
  features: string[];
  structure: {
    pages: string[];
    components: string[];
  };
  files?: Map<string, string>;
}

export class TemplateManager {
  private templates: Map<string, Template> = new Map();
  private templatesDir: string;
  
  constructor() {
    // Find templates directory from monorepo root
    this.templatesDir = path.resolve(process.cwd(), '../../../templates');
    this.loadTemplates();
  }
  
  private async loadTemplates() {
    console.log('📚 Loading templates...');
    
    try {
      const categories = await fs.readdir(this.templatesDir);
      
      for (const category of categories) {
        const categoryPath = path.join(this.templatesDir, category);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          const templateFile = path.join(categoryPath, 'base-template.json');
          
          if (await fs.pathExists(templateFile)) {
            const template = await fs.readJson(templateFile);
            this.templates.set(`${category}-base`, template);
            console.log(`  ✅ Loaded: ${template.name}`);
          }
        }
      }
      
      console.log(`📚 Total templates loaded: ${this.templates.size}`);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }
  
  getTemplate(name: string): Template | undefined {
    return this.templates.get(name);
  }
  
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }
  
  getTemplatesByCategory(category: string): Template[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
  
  findBestTemplate(userPrompt: string): Template | null {
    const prompt = userPrompt.toLowerCase();
    
    // Keywords mapping
    const categoryKeywords = {
      saas: ['saas', 'subscription', 'dashboard', 'billing', 'admin'],
      ecommerce: ['shop', 'store', 'product', 'cart', 'ecommerce', 'sell'],
      landing: ['landing', 'marketing', 'homepage', 'startup'],
      blog: ['blog', 'article', 'post', 'content', 'cms'],
      dashboard: ['dashboard', 'analytics', 'admin', 'panel', 'metrics']
    };
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.filter(k => prompt.includes(k)).length;
      
      if (score > highestScore) {
        highestScore = score;
        const templates = this.getTemplatesByCategory(category);
        bestMatch = templates[0] || null;
      }
    }
    
    console.log(`🎯 Best template match: ${bestMatch?.name || 'None'}`);
    return bestMatch;
  }
  
  async generateFromTemplate(template: Template, customizations: any = {}) {
    console.log(`🏗️ Generating from template: ${template.name}`);
    
    const files = new Map<string, string>();
    
    // Generate package.json
    files.set('package.json', JSON.stringify({
      name: customizations.name || 'generated-app',
      version: '1.0.0',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      },
      dependencies: this.getDependencies(template)
    }, null, 2));
    
    // Generate pages
    for (const page of template.structure.pages) {
      const pageCode = await this.generatePage(page, template, customizations);
      files.set(`src/pages/${page}.tsx`, pageCode);
    }
    
    // Generate components
    for (const component of template.structure.components) {
      const componentCode = await this.generateComponent(component, template);
      files.set(`src/components/${component}.tsx`, componentCode);
    }
    
    console.log(`✅ Generated ${files.size} files from template`);
    return files;
  }
  
  private getDependencies(template: Template): Record<string, string> {
    const base = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    };
    
    if (template.framework === 'nextjs') {
      base['next'] = '^14.0.0';
    }
    
    if (template.features.includes('authentication')) {
      base['next-auth'] = '^4.24.0';
    }
    
    if (template.features.includes('subscription-billing')) {
      base['stripe'] = '^14.0.0';
    }
    
    return base;
  }
  
  private async generatePage(name: string, template: Template, customizations: any): Promise<string> {
    // Basic page template
    return `
import React from 'react';

export default function ${this.capitalize(name)}Page() {
  return (
    <div className="min-h-screen">
      <h1 className="text-4xl font-bold">${customizations.title || name}</h1>
      {/* Generated from ${template.name} template */}
    </div>
  );
}`;
  }
  
  private async generateComponent(name: string, template: Template): Promise<string> {
    return `
import React from 'react';

export const ${name} = () => {
  return (
    <div className="${name.toLowerCase()}">
      {/* ${name} Component */}
    </div>
  );
};

export default ${name};`;
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}