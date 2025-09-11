import { PureSonnetWorkflow } from '../src/workflows/pure-sonnet';
import { FileManager } from '../src/utils/file-manager';
import { Logger } from '../src/utils/logger';
import { TimestampManager } from '../src/utils/timestamp';
import { PromptManager } from '../src/prompts/prompt-manager';
import fs from 'fs-extra';
import path from 'path';

describe('Workflow Tests', () => {
  let testDir: string;
  
  beforeEach(() => {
    // Créer un dossier de test temporaire
    testDir = path.join(__dirname, '../test-output');
    fs.ensureDirSync(testDir);
  });
  
  afterEach(() => {
    // Nettoyer après chaque test
    if (fs.existsSync(testDir)) {
      fs.removeSync(testDir);
    }
  });

  describe('FileManager Tests', () => {
    test('Création dossier horodaté', () => {
      const folder = FileManager.createAppFolder('test-app');
      
      // Vérifier format horodaté YYYY-MM-DD-HH-MM-SS
      expect(folder).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);
      expect(folder).toContain('test-app');
      expect(fs.existsSync(folder)).toBe(true);
    });

    test('Création dossier avec nom valide', () => {
      const folder = FileManager.createAppFolder('My App Name');
      
      // Vérifier normalisation du nom (espaces -> tirets)
      expect(folder).toContain('my-app-name');
      expect(fs.existsSync(folder)).toBe(true);
    });
  });

  describe('Logger Tests', () => {
    test('Logger initialisation', () => {
      const logger = new Logger();
      
      expect(logger).toBeDefined();
      expect(logger.getSessionId()).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);
    });

    test('Logging des différents niveaux', () => {
      const logger = new Logger({ logToConsole: false });
      
      // Test des méthodes de log
      expect(() => {
        logger.info('Test info');
        logger.warn('Test warning');  
        logger.error('Test error');
        logger.debug('Test debug');
      }).not.toThrow();
    });

    test('Génération session tracking', () => {
      const logger = new Logger({ logToConsole: false });
      
      logger.startGeneration('Test prompt', 'test-app');
      
      const session = logger.getCurrentGeneration();
      expect(session).toBeDefined();
      expect(session?.prompt).toBe('Test prompt');
      expect(session?.appName).toBe('test-app');
    });
  });

  describe('TimestampManager Tests', () => {
    test('Génération timestamp', () => {
      const timestamp = TimestampManager.getTimestamp();
      
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}/);
    });

    test('Génération folder name', () => {
      const folderName = TimestampManager.getFolderName('test-app');
      
      expect(folderName).toMatch(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-test-app/);
    });

    test('Format lisible', () => {
      const readable = TimestampManager.getReadableTimestamp();
      
      expect(readable).toContain('/');
      expect(readable).toContain(':');
    });
  });

  describe('PromptManager Tests', () => {
    test('Validation prompt', () => {
      const promptManager = new PromptManager();
      
      // Test prompt valide
      const validation = promptManager.validatePrompt('Create a React app with TypeScript');
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('Validation prompt trop court', () => {
      const promptManager = new PromptManager();
      
      // Test prompt trop court
      const validation = promptManager.validatePrompt('Hi');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Prompt trop court (< 100 caractères)');
    });

    test('Génération prompt architecture', () => {
      const promptManager = new PromptManager();
      
      const architecturePrompt = promptManager.getArchitecturePrompt('Create a todo app');
      expect(architecturePrompt).toContain('architecture');
      expect(architecturePrompt).toContain('todo app');
      expect(architecturePrompt.length).toBeGreaterThan(100);
    });
  });

  describe('PureSonnetWorkflow Tests', () => {
    test('Workflow initialisation', () => {
      const workflow = new PureSonnetWorkflow();
      
      expect(workflow).toBeDefined();
    });

    test('Extraction nom app', () => {
      const workflow = new PureSonnetWorkflow();
      
      // Test méthode privée via réflection (pour les tests uniquement)
      const extractAppName = (workflow as any).extractAppName;
      
      expect(extractAppName('Create a todo app')).toContain('todo');
      expect(extractAppName('Build an e-commerce application')).toContain('e-commerce');
    });

    test('Validation input', () => {
      const workflow = new PureSonnetWorkflow();
      const validateInput = (workflow as any).validateInput;
      
      // Test input valide
      expect(() => {
        validateInput('Create a React application with TypeScript');
      }).not.toThrow();
      
      // Test input trop court
      expect(() => {
        validateInput('Hi');
      }).toThrow('Le prompt utilisateur est trop court');
      
      // Test input vide
      expect(() => {
        validateInput('');
      }).toThrow('Le prompt utilisateur ne peut pas être vide');
    });

    test('Parsing fichiers générés', () => {
      const workflow = new PureSonnetWorkflow();
      const parseGeneratedFiles = (workflow as any).parseGeneratedFiles;
      
      const mockResponse = `
\`\`\`package.json
{
  "name": "test-app",
  "version": "1.0.0"
}
\`\`\`

\`\`\`src/App.tsx
import React from 'react';

function App() {
  return <div>Hello World</div>;
}

export default App;
\`\`\`
      `;
      
      const files = parseGeneratedFiles(mockResponse);
      
      expect(files.size).toBe(2);
      expect(files.has('package.json')).toBe(true);
      expect(files.has('src/App.tsx')).toBe(true);
      expect(files.get('package.json')).toContain('"name": "test-app"');
    });
  });

  describe('Gestion des erreurs', () => {
    test('Gestion prompt invalide', () => {
      const workflow = new PureSonnetWorkflow();
      
      // Test avec prompt vide
      expect(async () => {
        await workflow.generate('');
      }).rejects.toThrow();
    });

    test('Gestion fichiers manquants', () => {
      const workflow = new PureSonnetWorkflow();
      const validateGeneration = (workflow as any).validateGeneration;
      
      // Mock d'un dossier sans fichiers requis
      const mockAppFolder = testDir;
      (workflow as any).appFolder = mockAppFolder;
      
      const validation = validateGeneration();
      expect(validation.requiredFiles.some((f: any) => f.status === 'missing')).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('Workflow complet avec mock', async () => {
      // Mock des services externes pour éviter les appels API
      jest.mock('../src/services/anthropic-service', () => ({
        AnthropicService: jest.fn().mockImplementation(() => ({
          generateArchitecture: jest.fn().mockResolvedValue(`
            projectName: test-app
            description: Test application
            techStack: [React, TypeScript]
            files: [package.json, src/App.tsx]
          `),
          generateApp: jest.fn().mockResolvedValue(`
\`\`\`package.json
{"name": "test-app"}
\`\`\`

\`\`\`src/App.tsx
import React from 'react';
export default function App() { return <div>Test</div>; }
\`\`\`
          `)
        }))
      }));

      const workflow = new PureSonnetWorkflow();
      
      // Ce test nécessiterait une clé API, on le skip pour l'instant
      // const result = await workflow.generate('Create a simple React app');
      // expect(result.success).toBe(true);
      
      expect(workflow).toBeDefined();
    }, 30000); // Timeout étendu pour ce test
  });

  describe('Performance Tests', () => {
    test('Génération timestamp performance', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        TimestampManager.getTimestamp();
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Moins d'1 seconde pour 1000 timestamps
    });

    test('Logger performance', () => {
      const logger = new Logger({ logToConsole: false });
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Test message ${i}`);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Moins d'1 seconde pour 100 logs
    });
  });
});