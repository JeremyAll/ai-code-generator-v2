/**
 * Service pour injecter automatiquement les composants animés dans les apps générées
 */

import { ANIMATED_COMPONENTS, ANIMATION_CSS, getAnimatedComponent } from '../templates/animated-components.js';
import { Logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs-extra';

export class ComponentInjector {
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  /**
   * Injecte tous les composants animés dans le projet
   */
  async injectAnimatedComponents(projectPath: string): Promise<Map<string, string>> {
    const injectedFiles = new Map<string, string>();
    
    try {
      this.logger.info('💉 Injection des composants animés...');

      // Créer le dossier components/ui s'il n'existe pas
      const componentsPath = path.join(projectPath, 'components', 'ui');
      await fs.ensureDir(componentsPath);

      // Injecter chaque composant
      for (const [name, code] of Object.entries(ANIMATED_COMPONENTS)) {
        const filePath = path.join('components', 'ui', `${name}.tsx`);
        const fullPath = path.join(projectPath, filePath);
        
        await fs.writeFile(fullPath, code, 'utf-8');
        injectedFiles.set(filePath, code);
        
        this.logger.info(`✅ Composant ${name} injecté`);
      }

      // Créer un fichier index pour exporter tous les composants
      const indexContent = this.generateComponentIndex();
      const indexPath = path.join('components', 'ui', 'index.ts');
      await fs.writeFile(path.join(projectPath, indexPath), indexContent, 'utf-8');
      injectedFiles.set(indexPath, indexContent);

      this.logger.info(`✅ ${injectedFiles.size} fichiers de composants injectés`);
      
      return injectedFiles;

    } catch (error) {
      this.logger.error('❌ Erreur injection composants', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return injectedFiles;
    }
  }

  /**
   * Injecte les animations CSS dans globals.css
   */
  async injectAnimationCSS(projectPath: string): Promise<boolean> {
    try {
      const globalsPath = path.join(projectPath, 'app', 'globals.css');
      
      // Lire le CSS existant
      let existingCSS = '';
      if (await fs.pathExists(globalsPath)) {
        existingCSS = await fs.readFile(globalsPath, 'utf-8');
      }

      // Vérifier si les animations sont déjà présentes
      if (existingCSS.includes('@keyframes fade-up')) {
        this.logger.info('⚡ Animations CSS déjà présentes');
        return true;
      }

      // Ajouter les animations
      const updatedCSS = existingCSS + '\n\n' + ANIMATION_CSS;
      await fs.writeFile(globalsPath, updatedCSS, 'utf-8');
      
      this.logger.info('✅ Animations CSS injectées dans globals.css');
      return true;

    } catch (error) {
      this.logger.error('❌ Erreur injection CSS', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Vérifie et corrige les imports de composants dans les pages
   */
  async fixComponentImports(projectPath: string): Promise<number> {
    let fixedCount = 0;
    
    try {
      const appPath = path.join(projectPath, 'app');
      
      // Parcourir tous les fichiers TSX dans app/
      const files = await this.findTSXFiles(appPath);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        let updated = content;
        
        // Chercher les utilisations de composants sans import
        const componentNames = Object.keys(ANIMATED_COMPONENTS);
        for (const name of componentNames) {
          const regex = new RegExp(`<${name}[\\s>]`, 'g');
          if (regex.test(content)) {
            // Le composant est utilisé, vérifier l'import
            const importRegex = new RegExp(`import.*${name}.*from`);
            if (!importRegex.test(content)) {
              // Ajouter l'import
              const importLine = `import { ${name} } from '@/components/ui/${name}';\n`;
              
              // Insérer après les autres imports ou au début
              const lastImportIndex = content.lastIndexOf('import ');
              if (lastImportIndex !== -1) {
                const lineEnd = content.indexOf('\n', lastImportIndex);
                updated = content.slice(0, lineEnd + 1) + importLine + content.slice(lineEnd + 1);
              } else {
                updated = importLine + content;
              }
              
              fixedCount++;
              this.logger.info(`🔧 Import ajouté pour ${name} dans ${path.basename(file)}`);
            }
          }
        }
        
        if (updated !== content) {
          await fs.writeFile(file, updated, 'utf-8');
        }
      }
      
      this.logger.info(`✅ ${fixedCount} imports corrigés`);
      
    } catch (error) {
      this.logger.error('❌ Erreur correction imports', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    return fixedCount;
  }

  /**
   * Trouve tous les fichiers TSX dans un répertoire
   */
  private async findTSXFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findTSXFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn('⚠️ Erreur parcours répertoire', { dir, error });
    }
    
    return files;
  }

  /**
   * Génère le fichier index pour les composants
   */
  private generateComponentIndex(): string {
    const exports = Object.keys(ANIMATED_COMPONENTS)
      .map(name => `export { ${name} } from './${name}';`)
      .join('\n');
    
    return `// Auto-generated component exports
${exports}

// Types exports
export type ComponentName = ${Object.keys(ANIMATED_COMPONENTS).map(n => `'${n}'`).join(' | ')};
`;
  }

  /**
   * Améliore une page existante avec des composants animés
   */
  async enhancePageWithAnimations(
    pagePath: string, 
    projectPath: string
  ): Promise<boolean> {
    try {
      const fullPath = path.join(projectPath, pagePath);
      
      if (!await fs.pathExists(fullPath)) {
        this.logger.warn(`⚠️ Page ${pagePath} n'existe pas`);
        return false;
      }

      let content = await fs.readFile(fullPath, 'utf-8');
      
      // Remplacer les divs basiques par des Card3D
      content = content.replace(
        /<div className="(.*?)card(.*?)">/g, 
        '<Card3D className="$1card$2">'
      );
      content = content.replace(
        /<\/div>(\s*){\/\* card \*\/}/g, 
        '</Card3D>'
      );

      // Remplacer les boutons basiques par des MagneticButton
      content = content.replace(
        /<button(\s+[^>]*?)className="(.*?)"([^>]*?)>/g,
        '<MagneticButton$1className="$2"$3>'
      );
      content = content.replace(
        /<\/button>/g,
        '</MagneticButton>'
      );

      // Ajouter les imports nécessaires
      const componentsUsed = new Set<string>();
      if (content.includes('Card3D')) componentsUsed.add('Card3D');
      if (content.includes('MagneticButton')) componentsUsed.add('MagneticButton');
      
      if (componentsUsed.size > 0) {
        const imports = Array.from(componentsUsed)
          .map(c => `import { ${c} } from '@/components/ui/${c}';`)
          .join('\n');
        
        // Ajouter les imports en haut du fichier
        if (!content.includes(imports)) {
          const useClientIndex = content.indexOf("'use client'");
          if (useClientIndex !== -1) {
            const afterUseClient = content.indexOf('\n', useClientIndex) + 1;
            content = content.slice(0, afterUseClient) + imports + '\n' + content.slice(afterUseClient);
          } else {
            content = imports + '\n\n' + content;
          }
        }
      }

      await fs.writeFile(fullPath, content, 'utf-8');
      this.logger.info(`✅ Page ${pagePath} améliorée avec animations`);
      
      return true;

    } catch (error) {
      this.logger.error(`❌ Erreur amélioration page ${pagePath}`, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Applique toutes les améliorations à un projet
   */
  async enhanceProject(projectPath: string): Promise<{
    componentsInjected: number;
    cssInjected: boolean;
    importsFixed: number;
    pagesEnhanced: number;
  }> {
    const result = {
      componentsInjected: 0,
      cssInjected: false,
      importsFixed: 0,
      pagesEnhanced: 0
    };

    try {
      // 1. Injecter les composants
      const injected = await this.injectAnimatedComponents(projectPath);
      result.componentsInjected = injected.size;

      // 2. Injecter le CSS
      result.cssInjected = await this.injectAnimationCSS(projectPath);

      // 3. Corriger les imports
      result.importsFixed = await this.fixComponentImports(projectPath);

      // 4. Améliorer les pages principales
      const pagesToEnhance = [
        'app/page.tsx',
        'app/dashboard/page.tsx',
        'app/about/page.tsx'
      ];

      for (const page of pagesToEnhance) {
        if (await this.enhancePageWithAnimations(page, projectPath)) {
          result.pagesEnhanced++;
        }
      }

      this.logger.info('🎉 Projet amélioré avec succès', result);

    } catch (error) {
      this.logger.error('❌ Erreur amélioration projet', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    return result;
  }
}

// Export singleton
export const componentInjector = new ComponentInjector();