/**
 * Test WORKFLOW COMPLET - Architecture + 3 étapes de génération
 */

import { config } from 'dotenv';
import { AnthropicService } from './dist/services/anthropic-service.js';
import { Logger } from './dist/utils/logger.js';
import { FileManager } from './dist/utils/file-manager.js';
import { TimestampManager } from './dist/utils/timestamp.js';
import fs from 'fs-extra';
import path from 'path';

// Charger .env
config();

async function testCompleteWorkflow() {
  const logger = new Logger();
  const sessionId = TimestampManager.getTimestamp();
  
  try {
    logger.info('🚀 TEST WORKFLOW COMPLET avec 3 ÉTAPES');
    const prompt = "créer un site e-commerce de sneakers streetwear avec drops exclusifs";
    logger.info('📝 Prompt:', { prompt });
    
    const service = new AnthropicService();
    const startTime = Date.now();
    
    // =================
    // ÉTAPE 1 : ARCHITECTURE
    // =================
    logger.info('🏗️ ÉTAPE 1 : Génération architecture...');
    const archStart = Date.now();
    
    const architecture = await service.generateArchitecture(prompt);
    const archTime = Date.now() - archStart;
    
    logger.info(`✅ Architecture générée en ${Math.round(archTime/1000)}s (${Math.round(architecture.length/1000)}KB)`);
    
    // Parse architecture pour JSON
    let archObj;
    const jsonStart = architecture.indexOf('{');
    if (jsonStart === -1) {
      logger.error('❌ Pas de JSON dans l\'architecture');
      return;
    }
    
    try {
      const jsonEnd = architecture.lastIndexOf('}') + 1;
      const jsonStr = architecture.substring(jsonStart, jsonEnd);
      archObj = JSON.parse(jsonStr);
      
      logger.info('📋 Architecture parsée:', {
        name: archObj.metadata?.name || 'N/A',
        domain: archObj.metadata?.domain || 'N/A',
        pages: archObj.pages_structure?.public?.length || 0
      });
    } catch (parseError) {
      logger.error('❌ Erreur parsing architecture:', parseError.message);
      logger.info('📄 Architecture brute:', architecture.substring(0, 500));
      return;
    }
    
    // Créer dossier app
    const appName = archObj.metadata?.name?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || `sneakers-app-${sessionId}`;
    const appPath = FileManager.createAppFolder(appName);
    logger.info('📁 App créée:', { appPath });
    
    // =================
    // ÉTAPE 2.1 : STRUCTURE BASE
    // =================
    logger.info('📦 ÉTAPE 2.1 : Génération structure de base...');
    const step1Start = Date.now();
    
    try {
      const baseFiles = await service.generateStep2_1_Base(
        JSON.stringify(archObj),
        'moderne',
        'typescript'
      );
      const step1Time = Date.now() - step1Start;
      
      logger.info(`✅ Step 2.1 réussie en ${Math.round(step1Time/1000)}s (${baseFiles.size} fichiers)`);
      
      // Vérifications critiques
      const hasPackageJson = baseFiles.has('package.json');
      const hasLayout = baseFiles.has('app/layout.tsx');
      const hasCSS = baseFiles.has('app/globals.css');
      
      logger.info('🔍 Vérifications Step 2.1:', {
        packageJson: hasPackageJson,
        layout: hasLayout,
        css: hasCSS
      });
      
      if (hasCSS) {
        const cssContent = baseFiles.get('app/globals.css');
        const hasTailwind = cssContent.includes('@tailwind');
        logger.info(`🎨 CSS valide: ${hasTailwind}`);
      }
      
      if (hasLayout) {
        const layoutContent = baseFiles.get('app/layout.tsx');
        const importCSS = layoutContent.includes('./globals.css');
        logger.info(`🔗 Layout importe CSS: ${importCSS}`);
      }
      
      // Sauvegarder Step 2.1
      for (const [filepath, content] of baseFiles) {
        const fullPath = path.join(appPath, filepath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
      }
      
      logger.info('💾 Fichiers Step 2.1 sauvegardés');
      
    } catch (error) {
      logger.error('❌ ÉCHEC Step 2.1:', {
        error: error.message,
        prompt: 'Structure de base Next.js...',
        response: error.response?.substring(0, 500) || 'Pas de réponse'
      });
      
      // Continue malgré l'erreur
    }
    
    // =================
    // ÉTAPE 2.2 : COMPOSANTS
    // =================
    logger.info('🎨 ÉTAPE 2.2 : Génération composants...');
    const step2Start = Date.now();
    
    try {
      const componentFiles = await service.generateStep2_2_Components(
        JSON.stringify(archObj),
        'moderne streetwear',
        'typescript',
        ['ProductCard', 'HeroSection', 'CartButton', 'DropCountdown']
      );
      const step2Time = Date.now() - step2Start;
      
      logger.info(`✅ Step 2.2 réussie en ${Math.round(step2Time/1000)}s (${componentFiles.size} composants)`);
      
      // Vérifications composants
      let hasAnimations = false;
      for (const [filepath, content] of componentFiles) {
        if (content.includes('animate-') || content.includes('transition-') || content.includes('@keyframes')) {
          hasAnimations = true;
          break;
        }
      }
      
      logger.info('🎯 Composants avec animations:', hasAnimations);
      
      // Sauvegarder composants
      for (const [filepath, content] of componentFiles) {
        const fullPath = path.join(appPath, filepath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
      }
      
      logger.info('💾 Composants sauvegardés');
      
    } catch (error) {
      logger.error('❌ ÉCHEC Step 2.2:', {
        error: error.message,
        response: error.response?.substring(0, 500) || 'Pas de réponse'
      });
      
      // Si erreur JSON, suggérer réduction tokens
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        logger.warn('💡 SUGGESTION: Réduire tokens Step 2.2 à 3000 (au lieu de 6000)');
      }
    }
    
    // =================
    // ÉTAPE 2.3 : PAGES
    // =================
    logger.info('📄 ÉTAPE 2.3 : Génération pages spécifiques...');
    const step3Start = Date.now();
    
    try {
      const pageFiles = await service.generateStep2_3_Pages(
        JSON.stringify(archObj),
        archObj
      );
      const step3Time = Date.now() - step3Start;
      
      logger.info(`✅ Step 2.3 réussie en ${Math.round(step3Time/1000)}s (${pageFiles.size} pages)`);
      
      // Vérifier images Unsplash
      let hasUnsplashImages = false;
      for (const [filepath, content] of pageFiles) {
        if (content.includes('unsplash.com') || content.includes('images.unsplash')) {
          hasUnsplashImages = true;
          break;
        }
      }
      
      logger.info('🖼️ Pages avec images Unsplash:', hasUnsplashImages);
      
      // Vérifier personnalisation sneakers
      let hasPersonalization = false;
      for (const [filepath, content] of pageFiles) {
        const lower = content.toLowerCase();
        if (lower.includes('sneaker') || lower.includes('streetwear') || lower.includes('drop')) {
          hasPersonalization = true;
          break;
        }
      }
      
      logger.info('🎯 Personnalisation sneakers:', hasPersonalization);
      
      // Sauvegarder pages
      for (const [filepath, content] of pageFiles) {
        const fullPath = path.join(appPath, filepath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
      }
      
      logger.info('💾 Pages sauvegardées');
      
    } catch (error) {
      logger.error('❌ ÉCHEC Step 2.3:', {
        error: error.message,
        response: error.response?.substring(0, 500) || 'Pas de réponse'
      });
      
      // Si erreur JSON, suggérer réduction tokens
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        logger.warn('💡 SUGGESTION: Réduire tokens Step 2.3 à 3000 (au lieu de 4000)');
      }
    }
    
    // =================
    // RÉSULTATS FINAUX
    // =================
    const totalTime = Date.now() - startTime;
    const totalMinutes = Math.round(totalTime / 60000 * 10) / 10;
    
    logger.info('🎉 WORKFLOW COMPLET TERMINÉ !', {
      totalDuration: `${totalMinutes} minutes`,
      appPath,
      nextSteps: 'cd ' + appPath + ' && npm install && npm run dev'
    });
    
    // Instructions finales
    logger.info('📋 VÉRIFICATIONS MANUELLES:');
    logger.info('1. cd ' + appPath);
    logger.info('2. npm install');
    logger.info('3. npm run dev');
    logger.info('4. Vérifier que le CSS se charge (pas de page blanche)');
    logger.info('5. Vérifier le thème streetwear et les animations');
    
  } catch (error) {
    logger.error('❌ Erreur workflow complet:', error);
  }
}

testCompleteWorkflow().catch(console.error);