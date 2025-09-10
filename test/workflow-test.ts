import { PureSonnetWorkflow } from '../src/workflows/pure-sonnet';
import { Logger } from '../src/utils/logger';
import path from 'path';
import fs from 'fs';

interface TestCase {
  name: string;
  prompt: string;
  expectedFiles: string[];
  shouldSucceed: boolean;
}

class WorkflowTester {
  private logger: Logger;
  private testResults: Array<{
    testName: string;
    success: boolean;
    duration: number;
    error?: string;
    generatedPath?: string;
  }>;

  constructor() {
    this.logger = new Logger();
    this.testResults = [];
  }

  async runAllTests(): Promise<void> {
    this.logger.log('INFO', '=== DÉBUT DES TESTS WORKFLOW ===');
    
    const testCases: TestCase[] = [
      {
        name: 'Application Todo Simple',
        prompt: 'Créer une application todo simple avec HTML, CSS et JavaScript vanilla',
        expectedFiles: ['index.html', 'style.css', 'script.js', 'package.json', 'README.md'],
        shouldSucceed: true
      },
      {
        name: 'API REST Node.js',
        prompt: 'Générer une API REST avec Node.js et Express pour gérer des utilisateurs',
        expectedFiles: ['server.js', 'package.json', 'README.md'],
        shouldSucceed: true
      },
      {
        name: 'Prompt Trop Court',
        prompt: 'App',
        expectedFiles: [],
        shouldSucceed: false
      },
      {
        name: 'Application React',
        prompt: 'Créer une application React moderne avec TypeScript pour un système de gestion de tâches',
        expectedFiles: ['src/App.tsx', 'src/components', 'package.json', 'tsconfig.json'],
        shouldSucceed: true
      }
    ];

    for (const testCase of testCases) {
      await this.runSingleTest(testCase);
    }

    this.generateTestReport();
  }

  private async runSingleTest(testCase: TestCase): Promise<void> {
    this.logger.log('INFO', `--- Test: ${testCase.name} ---`);
    const startTime = Date.now();

    try {
      const workflow = new PureSonnetWorkflow();
      const result = await workflow.generate(testCase.prompt);
      const duration = Date.now() - startTime;

      if (testCase.shouldSucceed) {
        if (result.success) {
          // Vérifier les fichiers attendus
          const filesCheck = this.validateExpectedFiles(result.path!, testCase.expectedFiles);
          
          this.testResults.push({
            testName: testCase.name,
            success: filesCheck.success,
            duration,
            error: filesCheck.success ? undefined : filesCheck.error,
            generatedPath: result.path
          });

          this.logger.log('INFO', `✅ Test réussi: ${testCase.name} (${duration}ms)`);
        } else {
          this.testResults.push({
            testName: testCase.name,
            success: false,
            duration,
            error: `Workflow a échoué: ${result.error?.message || 'Erreur inconnue'}`
          });

          this.logger.log('ERROR', `❌ Test échoué: ${testCase.name} - ${result.error?.message}`);
        }
      } else {
        // Test censé échouer
        if (!result.success) {
          this.testResults.push({
            testName: testCase.name,
            success: true,
            duration,
            error: undefined
          });

          this.logger.log('INFO', `✅ Test réussi (échec attendu): ${testCase.name}`);
        } else {
          this.testResults.push({
            testName: testCase.name,
            success: false,
            duration,
            error: 'Le test aurait dû échouer mais a réussi'
          });

          this.logger.log('ERROR', `❌ Test échoué: ${testCase.name} - devrait avoir échoué`);
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName: testCase.name,
        success: testCase.shouldSucceed ? false : true,
        duration,
        error: error.message
      });

      if (testCase.shouldSucceed) {
        this.logger.log('ERROR', `❌ Exception dans test: ${testCase.name}`, error);
      } else {
        this.logger.log('INFO', `✅ Exception attendue dans test: ${testCase.name}`);
      }
    }
  }

  private validateExpectedFiles(generatedPath: string, expectedFiles: string[]): { success: boolean; error?: string } {
    if (!fs.existsSync(generatedPath)) {
      return { success: false, error: 'Dossier généré inexistant' };
    }

    const missingFiles: string[] = [];
    
    for (const expectedFile of expectedFiles) {
      const filePath = path.join(generatedPath, expectedFile);
      
      if (!fs.existsSync(filePath)) {
        // Pour les dossiers, vérifier s'ils contiennent des fichiers
        if (!expectedFile.includes('.')) {
          try {
            const stats = fs.statSync(filePath);
            if (!stats.isDirectory()) {
              missingFiles.push(expectedFile);
            }
          } catch {
            missingFiles.push(expectedFile);
          }
        } else {
          missingFiles.push(expectedFile);
        }
      }
    }

    if (missingFiles.length > 0) {
      return { 
        success: false, 
        error: `Fichiers manquants: ${missingFiles.join(', ')}` 
      };
    }

    return { success: true };
  }

  private generateTestReport(): void {
    const successfulTests = this.testResults.filter(r => r.success);
    const failedTests = this.testResults.filter(r => !r.success);
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = Math.round(totalDuration / this.testResults.length);

    const report = `
# Rapport de Tests Workflow

## Résumé
- **Tests exécutés**: ${this.testResults.length}
- **Réussis**: ${successfulTests.length}
- **Échoués**: ${failedTests.length}
- **Taux de réussite**: ${Math.round((successfulTests.length / this.testResults.length) * 100)}%
- **Durée totale**: ${totalDuration}ms
- **Durée moyenne**: ${averageDuration}ms

## Détail des Tests

### Tests Réussis ✅
${successfulTests.map(t => `- **${t.testName}** (${t.duration}ms)${t.generatedPath ? ` - ${t.generatedPath}` : ''}`).join('\n')}

### Tests Échoués ❌
${failedTests.map(t => `- **${t.testName}** (${t.duration}ms): ${t.error || 'Erreur inconnue'}`).join('\n')}

## Recommandations

${failedTests.length === 0 
  ? '🎉 Tous les tests sont passés! Le workflow fonctionne correctement.' 
  : `⚠️ ${failedTests.length} test(s) ont échoué. Vérifiez les erreurs ci-dessus.`}

---
*Rapport généré le ${new Date().toISOString()}*
`;

    // Sauvegarder le rapport
    const reportPath = path.join(process.cwd(), 'test-results', `workflow-test-${Date.now()}.md`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);

    this.logger.log('INFO', '=== RAPPORT DE TESTS ===');
    this.logger.log('INFO', report);
    this.logger.log('INFO', `Rapport sauvegardé: ${reportPath}`);
  }

  async runSingleTestByName(testName: string): Promise<void> {
    const testCases: TestCase[] = [
      {
        name: 'Application Todo Simple',
        prompt: 'Créer une application todo simple avec HTML, CSS et JavaScript vanilla',
        expectedFiles: ['index.html', 'style.css', 'script.js', 'package.json', 'README.md'],
        shouldSucceed: true
      },
      {
        name: 'API REST Node.js',
        prompt: 'Générer une API REST avec Node.js et Express pour gérer des utilisateurs',
        expectedFiles: ['server.js', 'package.json', 'README.md'],
        shouldSucceed: true
      }
    ];

    const testCase = testCases.find(t => t.name === testName);
    if (!testCase) {
      this.logger.log('ERROR', `Test non trouvé: ${testName}`);
      return;
    }

    await this.runSingleTest(testCase);
    this.generateTestReport();
  }

  async validateDependencies(): Promise<boolean> {
    this.logger.log('INFO', '=== VALIDATION DES DÉPENDANCES ===');
    
    const requiredModules = [
      'fs',
      'path', 
      'yaml'
    ];

    const missingModules: string[] = [];

    for (const module of requiredModules) {
      try {
        require.resolve(module);
        this.logger.log('DEBUG', `✅ Module ${module} disponible`);
      } catch {
        missingModules.push(module);
        this.logger.log('ERROR', `❌ Module ${module} manquant`);
      }
    }

    if (missingModules.length > 0) {
      this.logger.log('ERROR', `Modules manquants: ${missingModules.join(', ')}`);
      return false;
    }

    this.logger.log('INFO', '✅ Toutes les dépendances sont disponibles');
    return true;
  }
}

// Interface CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const tester = new WorkflowTester();

  if (args.length === 0) {
    // Exécuter tous les tests
    tester.validateDependencies().then(valid => {
      if (valid) {
        return tester.runAllTests();
      } else {
        console.error('❌ Validation des dépendances échouée');
        process.exit(1);
      }
    }).catch(error => {
      console.error('❌ Erreur lors des tests:', error);
      process.exit(1);
    });
  } else if (args[0] === '--single' && args[1]) {
    // Exécuter un test spécifique
    tester.runSingleTestByName(args[1]).catch(error => {
      console.error('❌ Erreur lors du test:', error);
      process.exit(1);
    });
  } else if (args[0] === '--validate') {
    // Valider uniquement les dépendances
    tester.validateDependencies().then(valid => {
      process.exit(valid ? 0 : 1);
    });
  } else {
    console.log(`
Usage:
  node workflow-test.js                    # Exécuter tous les tests
  node workflow-test.js --single <name>    # Exécuter un test spécifique
  node workflow-test.js --validate         # Valider les dépendances uniquement

Tests disponibles:
  - "Application Todo Simple"
  - "API REST Node.js"
`);
  }
}

export { WorkflowTester };