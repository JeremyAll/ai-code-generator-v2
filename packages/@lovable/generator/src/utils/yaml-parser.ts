import * as yaml from 'yaml';
import { Logger } from './logger.js';

export interface ArchitectureSpec {
  projectName: string;
  description: string;
  techStack: string[];
  framework: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  files: string[];
  structure: {
    directories: string[];
    components?: string[];
    services?: string[];
    utils?: string[];
  };
  features: string[];
  requirements: {
    node?: string;
    npm?: string;
    ports?: number[];
  };
}

export class YamlParser {
  private static logger = new Logger();

  static parseArchitecture(yamlContent: string): ArchitectureSpec {
    try {
      this.logger.log('DEBUG', 'Parsing YAML architecture content');
      
      // Nettoyer le contenu YAML (enlever les balises markdown si présentes)
      const cleanContent = this.cleanYamlContent(yamlContent);
      
      // Parser le YAML
      const parsed = yaml.parse(cleanContent);
      
      if (!parsed) {
        throw new Error('Contenu YAML vide ou invalide');
      }

      // Valider et normaliser la structure
      const architecture = this.validateAndNormalize(parsed);
      
      this.logger.log('DEBUG', `Architecture parsée: ${architecture.projectName} avec ${architecture.files.length} fichiers`);
      
      return architecture;
      
    } catch (error) {
      this.logger.log('ERROR', 'Erreur parsing YAML architecture', error);
      throw new Error(`Erreur de parsing YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static generateArchitectureYaml(architecture: ArchitectureSpec): string {
    try {
      this.logger.log('DEBUG', 'Génération YAML pour architecture');
      
      const yamlContent = yaml.stringify(architecture, {
        indent: 2,
        lineWidth: 120
      });

      this.logger.log('DEBUG', 'YAML généré avec succès');
      
      return yamlContent;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur YAML';
      this.logger.log('ERROR', 'Erreur génération YAML', { error: errorMsg });
      throw new Error(`Conversion YAML échouée: ${errorMsg}`);
    }
  }

  private static cleanYamlContent(content: string): string {
    // Enlever les balises markdown si présentes
    let cleaned = content.replace(/^```(?:yaml|yml)?\s*\n/gm, '');
    cleaned = cleaned.replace(/^```\s*$/gm, '');
    
    // Enlever les lignes vides en début/fin
    cleaned = cleaned.trim();
    
    // Vérifier qu'il reste du contenu
    if (!cleaned) {
      throw new Error('Contenu YAML vide après nettoyage');
    }
    
    return cleaned;
  }

  private static validateAndNormalize(parsed: any): ArchitectureSpec {
    const errors: string[] = [];
    
    // Validation des champs requis
    if (!parsed.projectName || typeof parsed.projectName !== 'string') {
      errors.push('projectName manquant ou invalide');
    }
    
    if (!parsed.description || typeof parsed.description !== 'string') {
      errors.push('description manquante ou invalide');
    }

    if (errors.length > 0) {
      throw new Error(`Validation échouée: ${errors.join(', ')}`);
    }

    // Normalisation avec valeurs par défaut
    const architecture: ArchitectureSpec = {
      projectName: parsed.projectName,
      description: parsed.description,
      techStack: this.normalizeArray(parsed.techStack, []),
      framework: parsed.framework || 'vanilla',
      dependencies: this.normalizeDependencies(parsed.dependencies),
      devDependencies: this.normalizeDependencies(parsed.devDependencies),
      scripts: this.normalizeObject(parsed.scripts, {}),
      files: this.normalizeArray(parsed.files, []),
      structure: this.normalizeStructure(parsed.structure),
      features: this.normalizeArray(parsed.features, []),
      requirements: this.normalizeRequirements(parsed.requirements)
    };

    // Validation finale
    this.validateNormalizedArchitecture(architecture);

    return architecture;
  }

  private static normalizeArray(value: any, defaultValue: string[]): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    return defaultValue;
  }

  private static normalizeObject(value: any, defaultValue: Record<string, string>): Record<string, string> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const normalized: Record<string, string> = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof key === 'string' && typeof val === 'string') {
          normalized[key] = val;
        }
      }
      return normalized;
    }
    return defaultValue;
  }

  private static normalizeDependencies(value: any): Record<string, string> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const normalized: Record<string, string> = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof key === 'string') {
          // Normaliser les versions
          const version = typeof val === 'string' ? val : String(val);
          normalized[key] = this.normalizeVersion(version);
        }
      }
      return normalized;
    }
    return {};
  }

  private static normalizeVersion(version: string): string {
    // Nettoyer et valider les versions
    const cleaned = version.trim();
    
    // Ajouter ^ si pas de préfixe de version
    if (/^\d+\.\d+\.\d+$/.test(cleaned)) {
      return `^${cleaned}`;
    }
    
    // Retourner tel quel pour les autres formats (^, ~, >=, etc.)
    return cleaned;
  }

  private static normalizeStructure(value: any): ArchitectureSpec['structure'] {
    const defaultStructure = {
      directories: [],
      components: [],
      services: [],
      utils: []
    };

    if (!value || typeof value !== 'object') {
      return defaultStructure;
    }

    return {
      directories: this.normalizeArray(value.directories, []),
      components: this.normalizeArray(value.components, []),
      services: this.normalizeArray(value.services, []),
      utils: this.normalizeArray(value.utils, [])
    };
  }

  private static normalizeRequirements(value: any): ArchitectureSpec['requirements'] {
    const defaultRequirements = {};

    if (!value || typeof value !== 'object') {
      return defaultRequirements;
    }

    const requirements: ArchitectureSpec['requirements'] = {};

    if (value.node && typeof value.node === 'string') {
      requirements.node = value.node;
    }

    if (value.npm && typeof value.npm === 'string') {
      requirements.npm = value.npm;
    }

    if (value.ports && Array.isArray(value.ports)) {
      requirements.ports = value.ports.filter((port: any) => 
        typeof port === 'number' && port > 0 && port < 65536
      );
    }

    return requirements;
  }

  private static validateNormalizedArchitecture(architecture: ArchitectureSpec): void {
    const warnings: string[] = [];

    // Vérifications de cohérence
    if (architecture.files.length === 0) {
      warnings.push('Aucun fichier spécifié dans l\'architecture');
    }

    if (architecture.techStack.length === 0) {
      warnings.push('Aucune technologie spécifiée');
    }

    if (Object.keys(architecture.dependencies).length === 0 && 
        Object.keys(architecture.devDependencies).length === 0) {
      warnings.push('Aucune dépendance spécifiée');
    }

    // Logger les avertissements
    if (warnings.length > 0) {
      this.logger.log('WARN', 'Avertissements architecture:', warnings);
    }

    // Vérifications critiques
    const errors: string[] = [];

    if (architecture.projectName.length < 2) {
      errors.push('Nom de projet trop court');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(architecture.projectName)) {
      errors.push('Nom de projet contient des caractères invalides');
    }

    if (errors.length > 0) {
      throw new Error(`Erreurs validation architecture: ${errors.join(', ')}`);
    }
  }

  static extractCodeBlocks(yamlContent: string): { language: string; content: string }[] {
    const codeBlocks: { language: string; content: string }[] = [];
    
    try {
      const architecture = this.parseArchitecture(yamlContent);
      
      // Rechercher des blocs de code dans la description ou les features
      const textFields = [
        architecture.description,
        ...architecture.features
      ];

      for (const text of textFields) {
        const blocks = this.extractCodeBlocksFromText(text);
        codeBlocks.push(...blocks);
      }

      this.logger.log('DEBUG', `${codeBlocks.length} blocs de code extraits`);
      
    } catch (error) {
      this.logger.log('ERROR', 'Erreur extraction code blocks', error);
    }

    return codeBlocks;
  }

  private static extractCodeBlocksFromText(text: string): { language: string; content: string }[] {
    const blocks: { language: string; content: string }[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        content: match[2].trim()
      });
    }

    return blocks;
  }

  static mergeArchitectures(base: ArchitectureSpec, override: Partial<ArchitectureSpec>): ArchitectureSpec {
    return {
      projectName: override.projectName || base.projectName,
      description: override.description || base.description,
      techStack: [...base.techStack, ...(override.techStack || [])],
      framework: override.framework || base.framework,
      dependencies: { ...base.dependencies, ...override.dependencies },
      devDependencies: { ...base.devDependencies, ...override.devDependencies },
      scripts: { ...base.scripts, ...override.scripts },
      files: [...base.files, ...(override.files || [])],
      structure: {
        directories: [...base.structure.directories, ...(override.structure?.directories || [])],
        components: [...(base.structure.components || []), ...(override.structure?.components || [])],
        services: [...(base.structure.services || []), ...(override.structure?.services || [])],
        utils: [...(base.structure.utils || []), ...(override.structure?.utils || [])]
      },
      features: [...base.features, ...(override.features || [])],
      requirements: { ...base.requirements, ...override.requirements }
    };
  }
}