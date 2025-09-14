import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/logger.js';
import { SmartPromptEnricher, UserInput, processUploadedImages, enrichWithVisualContext } from './prompt-enricher.js';
import { ComponentCache } from './component-cache.js';
import { PromptCompressor } from './prompt-compressor.js';
import { getDomainContexts, generateLayoutWrapper } from '../templates/contexts.js';
import { getDomainBusinessComponents } from '../templates/business-components.js';
import { SmartCache } from './smart-cache.js';
import { QualityValidator } from './quality-validator.js';
import { getExtendedDomainTemplate } from '../templates/extended-domains.js';

export class AnthropicService {
  private client: Anthropic;
  private logger: Logger;
  private promptEnricher: SmartPromptEnricher;
  private componentCache: ComponentCache;
  private promptCompressor: PromptCompressor;
  private smartCache: SmartCache;
  private qualityValidator: QualityValidator;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY manquante dans l\'environnement');
    }
    
    this.client = new Anthropic({ 
      apiKey: key,
      timeout: 120 * 1000, // 2 minutes par requête
      maxRetries: 0 // ZÉRO retry pour économiser
    });
    this.logger = new Logger();
    this.promptEnricher = new SmartPromptEnricher();
    this.componentCache = new ComponentCache();
    this.promptCompressor = new PromptCompressor();
    this.smartCache = new SmartCache();
    this.qualityValidator = new QualityValidator();
    this.logger.log('INFO', 'Service Anthropic initialisé avec Phase 5 - Optimisations avancées');
  }
  
  async callClaude(prompt: string, maxTokens: number = 12000): Promise<string> {
    // PROTECTION ABSOLUE - PAS DE RETRY SI > 3000 TOKENS
    if (maxTokens > 3000) {
      this.logger.log('WARN', '⚠️ GROSSE GÉNÉRATION - PAS DE RETRY AUTOMATIQUE');
      
      try {
        // UN SEUL APPEL
        const response = await this.client.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        return response.content[0].type === 'text' ? response.content[0].text : '';
        
      } catch (error: any) {
        // PAS DE RETRY - ÉCHEC DIRECT
        this.logger.log('ERROR', 'Génération échouée - PAS de retry automatique');
        throw error;
      }
    }
    
    // Pour petites requêtes seulement (< 3000 tokens)
    try {
      this.logger.log('INFO', `Appel API Claude - Prompt: ${prompt.substring(0, 100)}...`);
      
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const result = response.content[0].type === 'text' ? response.content[0].text : '';
      this.logger.log('INFO', `Réponse API reçue - Taille: ${result.length} caractères`);
      
      return result;
    } catch (error: any) {
      this.logger.log('ERROR', 'Appel API Claude échoué', error);
      throw new Error(`Erreur API Claude: ${error.message}`);
    }
  }
  
  /**
   * Génère l'architecture avec enrichissement intelligent
   */
  async generateArchitecture(userInput: UserInput | string): Promise<string> {
    try {
      this.logger.log('INFO', 'Génération architecture avec enrichissement intelligent');
      
      let enrichedPrompt: string;
      
      if (typeof userInput === 'string') {
        // Mode legacy pour compatibilité
        enrichedPrompt = `${userInput}\n\nAnalysez ce prompt et générez l'architecture JSON avec détection intelligente du domaine:

DÉTECTION DOMAINE:
- Si mention "saas|dashboard|analytics|metrics|admin|app" → domain: "saas"
- Si mention "ecommerce|boutique|shop|store|vente" → domain: "ecommerce" 
- Si mention "blog|article|cms|news|publication" → domain: "blog"
- Si mention "portfolio|vitrine|agence|personnel" → domain: "portfolio"

FORMAT JSON STRICT:
{
  "metadata": { 
    "name": "nom-application", 
    "domain": "saas|ecommerce|blog|portfolio", 
    "description": "description métier précise" 
  },
  "tech_stack": { "framework": "nextjs", "styling": "tailwindcss", "language": "typescript" },
  "pages_structure": { "public": [{"path": "/", "name": "Homepage"}] },
  "components": ["Button", "Card"],
  "features": ["auth", "dashboard"]
}

RETOURNEZ UNIQUEMENT LE JSON, PAS D'EXPLICATION.`;
      } else {
        // Mode intelligent avec enrichissement
        enrichedPrompt = await this.promptEnricher.enrich(userInput);
        
        // Ajout de la structure JSON demandée
        enrichedPrompt += `\n\nVeuillez générer l'architecture de cette application au format JSON strict:
{
  "metadata": { "name": "nom-app", "domain": "type", "description": "description" },
  "tech_stack": { "framework": "nextjs", "styling": "tailwindcss", "language": "typescript" },
  "pages_structure": { "public": [{"path": "/", "name": "Homepage"}] },
  "components": ["Button", "Card"],
  "features": ["auth", "dashboard"]
}

RETOURNEZ UNIQUEMENT LE JSON, PAS D'EXPLICATION.`;

        // Si images uploadées, traitement visuel
        if (userInput.images && userInput.images.length > 0) {
          const visualContext = await processUploadedImages(userInput.images);
          enrichedPrompt = enrichWithVisualContext(enrichedPrompt, visualContext);
        }
      }

      // Compression intelligente du prompt
      const compressedPrompt = this.promptCompressor.compressArchitecturePrompt(enrichedPrompt);
      const maxTokensStep1 = parseInt(process.env.MAX_TOKENS_STEP1 || '3000');
      // Architecture : 90s timeout
      return await this.callAPI(compressedPrompt, maxTokensStep1);
    } catch (error: any) {
      this.logger.log('ERROR', 'Génération architecture échouée', error);
      throw error;
    }
  }
  
  /**
   * NOUVELLE MÉTHODE : Génération en 3 étapes
   */
  async generateAppInSteps(architecture: any, archResponse?: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const archString = JSON.stringify(architecture, null, 2);
    
    // Détection du style et tech stack
    const style = architecture.design_style || 'modern';
    const tech = architecture.tech_stack?.framework || 'nextjs';
    
    try {
      // PHASE 0: Récupération des composants cachés
      this.logger.log('INFO', '🗃️ Récupération composants cachés...');
      const cachedComponents = this.componentCache.getCachedComponents(style, tech);
      cachedComponents.forEach((content, path) => files.set(path, content));
      
      this.logger.log('INFO', `✨ ${cachedComponents.size} composants récupérés du cache (0 tokens)`);
      
      // ÉTAPE 2.1 : Structure de base (2-3 min)
      this.logger.log('INFO', '📦 Étape 2.1 : Génération structure de base...');
      const baseFiles = await this.generateStep2_1_Base(archString, style, tech);
      baseFiles.forEach((content, path) => files.set(path, content));
      
      // PHASE 3 : STATE MANAGEMENT - Génération automatique des contextes
      this.logger.log('INFO', '🔄 Phase 3 : Génération contextes React automatiques...');
      
      // Parse le JSON de l'architecture directement depuis la réponse
      let fullArchitecture;
      if (archResponse) {
        try {
          const cleanResponse = archResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          fullArchitecture = JSON.parse(cleanResponse);
          this.logger.log('DEBUG', `Architecture JSON parsée: domaine = ${fullArchitecture.metadata?.domain}`);
        } catch (error) {
          this.logger.log('WARN', 'Impossible de parser l\'architecture JSON, utilisation structure de base');
          fullArchitecture = architecture;
        }
      } else {
        fullArchitecture = architecture;
      }
      
      const contextFiles = this.generateDomainContexts(fullArchitecture);
      contextFiles.forEach((content, path) => files.set(path, content));
      this.logger.log('INFO', `✅ ${contextFiles.size} contextes générés pour domaine ${fullArchitecture.metadata?.domain || 'app'}`);
      
      // PHASE 4 : COMPOSANTS MÉTIER - Génération automatique des composants avec logique
      this.logger.log('INFO', '🎯 Phase 4 : Génération composants métier automatiques...');
      const businessFiles = this.generateDomainBusinessComponents(fullArchitecture);
      businessFiles.forEach((content, path) => files.set(path, content));
      this.logger.log('INFO', `✅ ${businessFiles.size} composants métier générés pour domaine ${fullArchitecture.metadata?.domain || 'app'}`);
      
      // PHASE 5 : TEMPLATES ÉTENDUS - Génération composants avancés par domaine
      this.logger.log('INFO', '🚀 Phase 5 : Génération templates domaines étendus...');
      const extendedFiles = await this.generateExtendedDomainComponents(
        fullArchitecture.metadata?.domain || 'app',
        fullArchitecture.metadata?.name || 'Generated App'
      );
      extendedFiles.forEach((content, path) => files.set(path, content));
      this.logger.log('INFO', `✅ ${extendedFiles.size} templates étendus générés pour domaine ${fullArchitecture.metadata?.domain || 'app'}`);
      
      // Délai de 2s entre appels API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ÉTAPE 2.2 : Composants UI custom uniquement (2-3 min) 
      this.logger.log('INFO', '🎨 Étape 2.2 : Génération composants custom...');
      
      // Filtrage: on ne génère que les composants non-cachés
      const requiredComponents = this.extractRequiredComponents(archString);
      const componentsToGenerate = this.componentCache.filterComponentsToGenerate(requiredComponents, style, tech);
      
      // ÉTAPE 2.2 : Réactivée avec optimisations anti-timeout
      if (componentsToGenerate.length > 0) {
        // Limite à 4 composants max, génération en batch si nécessaire
        const maxComponents = Math.min(componentsToGenerate.length, 4);
        const safeComponents = componentsToGenerate.slice(0, maxComponents);
        this.logger.log('INFO', `🎨 Génération de ${safeComponents.length} composants optimisés...`);
        
        try {
          const componentFiles = await this.generateStep2_2_Components(archString, style, tech, safeComponents);
          componentFiles.forEach((content, path) => files.set(path, content));
          this.logger.log('INFO', `🔧 ${safeComponents.length} composants custom générés avec succès`);
        } catch (error) {
          this.logger.log('WARN', '⚠️ Étape 2.2 timeout - continuons avec la base');
        }
      } else {
        this.logger.log('INFO', '✅ Tous les composants disponibles en cache');
      }
      
      // Délai de 2s entre appels API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ÉTAPE 2.3 : Réactivée avec optimisations
      this.logger.log('INFO', '📄 Étape 2.3 : Génération pages spécifiques optimisées...');
      try {
        const pageFiles = await this.generateStep2_3_Pages(archString, architecture);
        pageFiles.forEach((content, path) => files.set(path, content));
        this.logger.log('INFO', `📄 ${pageFiles.size} pages spécifiques générées avec succès`);
      } catch (error) {
        this.logger.log('WARN', '⚠️ Étape 2.3 timeout - continuons sans pages custom');
      }
      
      this.logger.log('INFO', `✅ Application complète générée : ${files.size} fichiers`);
      return files;
      
    } catch (error: any) {
      this.logger.log('ERROR', 'Échec génération multi-étapes', error);
      throw error;
    }
  }

  /**
   * ÉTAPE 2.1 : Structure de base
   */
  private async generateStep2_1_Base(architecture: string, style: string, tech: string): Promise<Map<string, string>> {
    this.logger.log('INFO', '🔧 Génération FICHIER par FICHIER (anti-troncature)');
    
    const files = new Map<string, string>();
    const archObj = JSON.parse(architecture);
    const appName = archObj.metadata?.name || 'app';
    const domain = archObj.metadata?.domain || 'web';
    
    try {
      // 1. PACKAGE.JSON - 500 tokens max
      this.logger.log('DEBUG', 'Génération package.json...');
      const pkgPrompt = `Génère UNIQUEMENT le contenu de package.json pour Next.js 14 avec:
- name: "${appName}"
- Dépendances: next, react, typescript, tailwindcss, lucide-react
- Scripts: dev, build, start, lint

RETOURNE UNIQUEMENT LE JSON, PAS DE MARKDOWN:`;
      
      const pkgContent = await this.callAPI(pkgPrompt, 500);
      files.set('package.json', this.cleanJSONContent(pkgContent));
      
      // Délai inter-appels
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. LAYOUT.TSX - 1800 tokens max (augmenté pour éviter troncature)
      this.logger.log('DEBUG', 'Génération app/layout.tsx...');
      const layoutPrompt = `Génère UNIQUEMENT le contenu de app/layout.tsx avec:
- import './globals.css' et import { Metadata } from 'next'
- import { Providers } from '../components/Providers'
- Metadata pour "${appName}" ${domain}
- Navigation globale (navbar) avec liens vers pages principales
- Footer avec informations de base
- Structure responsive avec Tailwind CSS
- Export default RootLayout avec <Providers>{children}</Providers> dans le body
- Tout le contenu (nav, main, footer) doit être wrappé dans <Providers>

RETOURNE UNIQUEMENT LE CODE TSX, PAS DE MARKDOWN:`;
      
      const layoutContent = await this.callAPI(layoutPrompt, 1800);
      files.set('app/layout.tsx', this.cleanCodeContent(layoutContent, 'layout', 'app', 'tsx'));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. GLOBALS.CSS - 1000 tokens max (augmenté pour éviter troncature)
      this.logger.log('DEBUG', 'Génération app/globals.css...');
      const cssPrompt = `Génère UNIQUEMENT le contenu de app/globals.css avec:
- @tailwind base;
- @tailwind components;
- @tailwind utilities;
- Styles custom ${style} pour ${domain}

RETOURNE UNIQUEMENT LE CSS, PAS DE MARKDOWN:`;
      
      const cssContent = await this.callAPI(cssPrompt, 1000);
      files.set('app/globals.css', this.cleanCodeContent(cssContent, 'globals', 'app', 'css'));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. HOMEPAGE avec NAVIGATION - 2000 tokens max (augmenté pour éviter troncature)
      this.logger.log('DEBUG', 'Génération app/page.tsx...');
      const homePrompt = `Génère UNIQUEMENT le contenu de app/page.tsx pour ${domain} ${appName}:
- 'use client'
- import Link from 'next/link'
- Export default function HomePage
- Hero section avec titre "${appName}"
- Section avec liens vers pages principales (utilise Link)
- 2-3 sections avec contenu ${domain}
- Images Unsplash ${domain}
- Call-to-action vers pages importantes
- Tailwind CSS moderne et responsive

RETOURNE UNIQUEMENT LE CODE TSX, PAS DE MARKDOWN:`;
      
      const homeContent = await this.callAPI(homePrompt, 2000);
      files.set('app/page.tsx', this.cleanCodeContent(homeContent, 'homepage', 'app', 'tsx'));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. TAILWIND CONFIG - 800 tokens max (augmenté pour éviter troncature)
      this.logger.log('DEBUG', 'Génération tailwind.config.js...');
      const tailwindPrompt = `Génère UNIQUEMENT le contenu de tailwind.config.js:
- content: ["./app/**/*.{js,ts,jsx,tsx}"]
- Configuration standard Next.js 14

RETOURNE UNIQUEMENT LE JS, PAS DE MARKDOWN:`;
      
      const tailwindContent = await this.callAPI(tailwindPrompt, 800);
      files.set('tailwind.config.js', this.cleanCodeContent(tailwindContent, 'tailwind', 'config', 'js'));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 6. POSTCSS CONFIG - Hardcodé (évite erreur exports vs module.exports)
      this.logger.log('DEBUG', 'Génération postcss.config.js...');
      files.set('postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);
      
      // 7. README.MD - Généré automatiquement
      this.logger.log('DEBUG', 'Génération README.md...');
      files.set('README.md', `# ${appName}

Application ${domain} générée avec App Generator.

## Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

## Technologies

- Next.js 14
- TypeScript
- Tailwind CSS
- React

## Structure

- \`app/\` - Pages Next.js App Router
- \`components/\` - Composants réutilisables
- \`public/\` - Assets statiques

## Démarrage rapide

1. Installez les dépendances: \`npm install\`
2. Lancez le serveur de développement: \`npm run dev\`
3. Ouvrez [http://localhost:3000](http://localhost:3000)

Généré par [App Generator](https://github.com/your-repo/app-generator).
`);
      
      this.logger.log('INFO', `✅ ${files.size} fichiers critiques générés séparément`);
      
    } catch (error) {
      this.logger.log('ERROR', 'Erreur génération fichier par fichier:', error);
      // Fallback sur templates hardcodés si échec
      this.logger.log('WARN', '🔄 Fallback sur templates hardcodés...');
      return this.generateFallbackFiles(appName, domain);
    }
    
    // GARANTIES finales
    this.ensureTailwindConfigFiles(files);
    this.ensureCSSIntegration(files);
    
    return files;
  }

  /**
   * Nettoie le contenu JSON (enlève markdown, etc.)
   */
  private cleanJSONContent(content: string): string {
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    content = content.trim();
    
    // Vérifier que c'est du JSON valide
    try {
      JSON.parse(content);
      return content;
    } catch {
      this.logger.log('WARN', 'JSON invalide, tentative de réparation...');
      // Simple repair: assurer que ça commence par { et finit par }
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return content.substring(start, end + 1);
      }
      throw new Error('JSON non réparable');
    }
  }

  /**
   * Génère des fichiers fallback hardcodés en cas d'échec complet
   */
  private generateFallbackFiles(appName: string, domain: string): Map<string, string> {
    const files = new Map<string, string>();
    
    // Package.json fallback
    files.set('package.json', `{
  "name": "${appName}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.5.2",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.290.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "autoprefixer": "^10.0.1",
    "postcss": "^8.4.0"
  }
}`);
    
    // Layout fallback
    files.set('app/layout.tsx', `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${appName}',
  description: '${domain} application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}`);
    
    // CSS fallback
    files.set('app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

.gradient-text {
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}`);
    
    // Homepage fallback
    files.set('app/page.tsx', `'use client'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6 gradient-text">
            ${appName}
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Plateforme ${domain} moderne et innovante
          </p>
          <img 
            src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=400&fit=crop"
            alt="${appName}"
            className="w-full max-w-2xl mx-auto rounded-lg shadow-2xl animate-fadeIn"
          />
        </div>
      </div>
    </div>
  )
}`);
    
    // Tailwind config fallback
    files.set('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`);
    
    // PostCSS config fallback
    files.set('postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);
    
    this.logger.log('INFO', '📦 Fichiers fallback hardcodés générés');
    return files;
  }

  /**
   * GARANTIE CRITQUE : S'assurer que les fichiers de configuration Tailwind sont présents
   */
  private ensureTailwindConfigFiles(files: Map<string, string>): void {
    // tailwind.config.js
    if (!files.has('tailwind.config.js')) {
      this.logger.log('WARN', 'Fichier tailwind.config.js manquant, génération automatique...');
      files.set('tailwind.config.js', `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.8s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      }
    },
  },
  plugins: [],
}`);
    }

    // postcss.config.js
    if (!files.has('postcss.config.js')) {
      this.logger.log('WARN', 'Fichier postcss.config.js manquant, génération automatique...');
      files.set('postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);
    }
  }

  /**
   * GARANTIE CSS : S'assurer que globals.css et layout.tsx sont corrects
   */
  private ensureCSSIntegration(files: Map<string, string>): void {
    // Garantir globals.css avec @tailwind directives
    if (!files.has('app/globals.css')) {
      this.logger.log('WARN', 'Fichier app/globals.css manquant, génération automatique...');
      files.set('app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Variables CSS globales */
:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

/* Reset et base */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`);
    } else {
      // Vérifier que @tailwind directives sont présentes
      let css = files.get('app/globals.css')!;
      if (!css.includes('@tailwind base')) {
        this.logger.log('WARN', 'Ajout @tailwind directives manquantes...');
        css = `@tailwind base;
@tailwind components;
@tailwind utilities;

${css}`;
        files.set('app/globals.css', css);
      }
    }

    // Garantir layout.tsx avec import globals.css
    if (!files.has('app/layout.tsx')) {
      this.logger.log('WARN', 'Fichier app/layout.tsx manquant, génération automatique...');
      files.set('app/layout.tsx', `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Generated App',
  description: 'AI Generated Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Generated App</h1>
              </div>
            </div>
          </div>
        </nav>
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  )
}`);
    } else {
      // Vérifier que l'import globals.css est présent
      let layout = files.get('app/layout.tsx')!;
      if (!layout.includes("import './globals.css'")) {
        this.logger.log('WARN', 'Ajout import globals.css manquant...');
        // Insérer après les autres imports
        const importMatch = layout.match(/import.*from.*\n/g);
        if (importMatch) {
          const lastImport = importMatch[importMatch.length - 1];
          layout = layout.replace(lastImport, lastImport + "import './globals.css'\n");
        } else {
          layout = "import './globals.css'\n" + layout;
        }
        files.set('app/layout.tsx', layout);
      }
    }
  }

  /**
   * ÉTAPE 2.2 : Composants UI Premium avec animations (SOLUTION OPUS OPTIMISÉE)
   */
  private async generateStep2_2_Components(architecture: string, style: string, tech: string, componentsToGenerate: string[] = []): Promise<Map<string, string>> {
    // PROMPT OPUS ULTRA-OPTIMISÉ - Force les 4 composants
    const prompt = `RETOURNE UNIQUEMENT ce JSON (rien d'autre):
{
  "components/ui/Button.tsx": "[CODE_COMPLET_BUTTON]",
  "components/ui/Card.tsx": "[CODE_COMPLET_CARD]",
  "components/ui/AnimatedCounter.tsx": "[CODE_COMPLET_COUNTER]",
  "components/ui/HeroParallax.tsx": "[CODE_COMPLET_HERO]"
}

REMPLACE chaque [CODE_COMPLET_X] par du code React TypeScript complet:

Button: hover:scale-105 + ripple effect + glow animation
Card: backdrop-blur + 3D perspective + hover rotation
Counter: useEffect smooth counting animation
Hero: parallax scrolling + gradient background

COMMENCE DIRECTEMENT PAR { sans aucun texte avant.`;

    try {
      this.logger.log('DEBUG', `Prompt premium (${prompt.length} chars): ${prompt.substring(0, 200)}...`);
      
      // Step 2.2 : 120s timeout, garde 6000 tokens pour composants
      const response = await this.callAPI(prompt, 6000);
      this.logger.log('DEBUG', `Réponse Claude (${response.length} chars): ${response.substring(0, 200)}...`);
      
      // PARSING ROBUSTE D'OPUS
      let cleanResponse = response.trim();
      
      // Si la réponse commence par du texte, on cherche le JSON
      if (!cleanResponse.startsWith('{')) {
        const jsonStart = cleanResponse.indexOf('{');
        if (jsonStart !== -1) {
          cleanResponse = cleanResponse.substring(jsonStart);
        }
      }
      
      // Si la réponse se termine mal, on cherche la dernière accolade
      if (!cleanResponse.endsWith('}')) {
        const lastBrace = cleanResponse.lastIndexOf('}');
        if (lastBrace !== -1) {
          cleanResponse = cleanResponse.substring(0, lastBrace + 1);
        }
      }
      
      this.logger.log('DEBUG', `JSON nettoyé (${cleanResponse.length} chars): ${cleanResponse.substring(0, 200)}...`);
      
      // Parse direct sans chercher les backticks
      const files = new Map<string, string>();
      try {
        const parsed = JSON.parse(cleanResponse);
        for (const [path, content] of Object.entries(parsed)) {
          if (typeof content === 'string' && content.length > 0) {
            files.set(path, content);
          }
        }
      } catch (parseError) {
        // Si le parsing échoue, on essaie d'extraire le JSON des backticks
        const jsonMatch = cleanResponse.match(/```json\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          for (const [path, content] of Object.entries(parsed)) {
            if (typeof content === 'string' && content.length > 0) {
              files.set(path, content);
            }
          }
        } else {
          throw parseError;
        }
      }
      
      // VALIDATION POST-PARSING STRICTE POUR 4 COMPOSANTS
      const expectedComponents = [
        'components/ui/Button.tsx',
        'components/ui/Card.tsx', 
        'components/ui/AnimatedCounter.tsx',
        'components/ui/HeroParallax.tsx'
      ];
      
      let validComponents = 0;
      for (const component of expectedComponents) {
        if (files.has(component)) {
          const content = files.get(component)!;
          if (content.includes('export') && content.length > 100) {
            validComponents++;
          } else {
            this.logger.log('WARN', `Composant ${component} trop court ou invalide`);
          }
        } else {
          this.logger.log('WARN', `Composant manquant: ${component}`);
        }
      }
      
      this.logger.log('INFO', `${validComponents}/4 composants premium valides générés`);
      
      // Si moins de 2 composants valides, on passe en fallback
      if (validComponents < 2) {
        this.logger.log('WARN', `Seulement ${validComponents}/4 composants valides - Fallback activé`);
        throw new Error('Pas assez de composants valides générés');
      }
      
      // Si on a récupéré des fichiers, on a réussi !
      if (files.size > 0) {
        this.logger.log('INFO', `✅ ${files.size} composants premium générés`);
        this.cacheGeneratedComponents(files, style, tech);
        return files;
      }
      
      throw new Error('Aucun composant généré');
      
    } catch (error) {
      this.logger.log('WARN', 'Fallback sur composants avec animations premium');
      
      // FALLBACK PREMIUM D'OPUS - Garde les animations !
      const fallbackFiles = new Map<string, string>();
      
      fallbackFiles.set('components/ui/Button.tsx', `import React from 'react';

export default function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
    >
      {children}
    </button>
  );
}`);
      
      fallbackFiles.set('components/ui/Card.tsx', `import React from 'react';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 border border-white/20">
      {children}
    </div>
  );
}`);
      
      fallbackFiles.set('components/ui/AnimatedCounter.tsx', `import React, { useState, useEffect } from 'react';

export default function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className="text-4xl font-bold tabular-nums">{count.toLocaleString()}</span>;
}`);
      
      fallbackFiles.set('components/ui/HeroParallax.tsx', `import React, { useEffect, useState } from 'react';

export default function HeroParallax({ title, subtitle }: { title: string; subtitle: string }) {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600"
        style={{ transform: \`translateY(\${scrollY * 0.5}px)\` }}
      />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4 animate-fade-in">{title}</h1>
          <p className="text-2xl opacity-90">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}`);
      
      return fallbackFiles;
    }
  }

  /**
   * ÉTAPE 2.3 : Pages spécifiques du domaine (VERSION FICHIER-PAR-FICHIER ANTI-FALLBACK)
   */
  private async generateStep2_3_Pages(architecture: string, archObj: any): Promise<Map<string, string>> {
    // Récupérer les pages publiques depuis l'architecture (priorité aux pages high/medium)
    const allPublicPages = archObj.pages_structure?.public || [];
    const pages = allPublicPages.filter((page: any) => 
      page.priority === 'high' || page.priority === 'medium'
    ).slice(0, 4); // Limiter à 4 pages max pour éviter timeouts
    
    const domain = archObj.metadata?.domain || 'app';
    const appName = archObj.metadata?.name || 'App';
    
    this.logger.log('INFO', '🔧 Génération PAGES par FICHIER (anti-fallback)');
    this.logger.log('DEBUG', `📋 Pages trouvées: ${pages.length}`, { pages: pages.slice(0, 3), domain });
    
    if (pages.length === 0) {
      this.logger.log('WARN', '⚠️ Aucune page définie dans l\'architecture - vérification structure...');
      this.logger.log('DEBUG', 'Structure complète:', { pages_structure: archObj.pages_structure });
    }
    
    const pageFiles = new Map<string, string>();
    
    // Générer chaque page individuellement (comme Step 2.1)
    const maxPages = Math.min(pages.length, 6); // Max 6 pages pour éviter timeouts
    
    for (let i = 0; i < maxPages; i++) {
      const page = pages[i];
      const pageName = page.name || this.capitalize(page.path.replace('/', ''));
      const pagePath = `app${page.path}/page.tsx`;
      
      // Images spécifiques au domaine
      const domainImages = this.getDomainImages(domain);
      
      // Créer la liste des autres pages pour navigation contextuelle
      const otherPages = pages.filter((p: any, idx: number) => idx !== i).slice(0, 3);
      const navLinks = otherPages.map((p: any) => `${p.name || this.capitalize(p.path.replace('/', ''))}: ${p.path}`).join(', ');

      const prompt = `Génère une page ${pageName} complète pour app ${domain} avec Next.js + TypeScript.

Exigences:
- 'use client' en première ligne
- import Link from 'next/link'
- export default function ${pageName}Page() 
- Header noir avec titre "${pageName.toUpperCase()}"
- Navigation contextuelle avec liens vers: ${navLinks}
- Contenu principal contextuel au ${domain}
- 2-3 images Unsplash: ${domainImages.slice(0,2).join(', ')}
- Boutons d'action vers autres pages appropriées
- Style moderne avec Tailwind CSS
- Code complet et syntaxiquement correct

RETOURNE UNIQUEMENT le code TypeScript complet, sans markdown.`;

      try {
        this.logger.log('INFO', `📡 Appel API page ${pageName} (max 1200 tokens)...`);
        const content = await this.callAPI(prompt, 1200);
        const cleanContent = this.cleanCodeContent(content, pageName, domain, 'tsx');
        pageFiles.set(pagePath, cleanContent);
        this.logger.log('INFO', `✅ Page ${pageName} générée (${cleanContent.length} chars)`);
        
        // Délai entre pages pour éviter rate limiting
        if (i < maxPages - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        this.logger.log('WARN', `⚠️ Échec API page ${pageName}, utilisation fallback`);
        // Fallback simple si génération échoue
        pageFiles.set(pagePath, this.generateFallbackPage(pageName, domain));
      }
    }
    
    this.logger.log('INFO', `✅ ${pageFiles.size} pages générées individuellement`);
    return pageFiles;
  }

  /**
   * Méthodes utilitaires pour Step 2.3
   */
  private getDomainImages(domain: string): string[] {
    const domainImageMap: { [key: string]: string[] } = {
      'e-commerce': [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ],
      'saas': [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ],
      'portfolio': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
      ]
    };

    return domainImageMap[domain] || domainImageMap['e-commerce'];
  }

  private getPageDescription(pageName: string, domain: string): string {
    const descriptions: { [key: string]: { [key: string]: string } } = {
      'e-commerce': {
        'Products': 'Découvrez notre collection exclusive de produits premium',
        'Cart': 'Votre panier et gestion de commandes',
        'Checkout': 'Finalisation sécurisée de votre commande',
        'Profile': 'Gérez votre profil et vos préférences'
      },
      'saas': {
        'Dashboard': 'Tableau de bord analytics et métriques',
        'Settings': 'Configuration et paramètres système',
        'Users': 'Gestion des utilisateurs et permissions'
      }
    };

    return descriptions[domain]?.[pageName] || `Page ${pageName} pour votre application ${domain}`;
  }

  private generateFallbackPage(pageName: string, domain: string): string {
    const domainImages = this.getDomainImages(domain);
    return `'use client';
import Link from 'next/link';

export default function ${pageName}Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            ${pageName.toUpperCase()}
          </h1>
          <p className="text-xl text-gray-300">
            ${this.getPageDescription(pageName, domain)}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/" className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200">
              Accueil
            </Link>
            <Link href="/dashboard" className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <img 
              src="${domainImages[0]}" 
              alt="${pageName} image 1" 
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Section 1</h3>
              <p className="text-gray-600 mb-4">Contenu principal ${pageName}</p>
              <Link href="/" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 inline-block">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }

  private cleanCodeContent(content: string, pageName?: string, domain?: string, fileType?: string): string {
    // Nettoyer le contenu de code généré
    let cleaned = content.trim();
    
    // Supprimer les balises markdown
    cleaned = cleaned.replace(/```typescript/g, '');
    cleaned = cleaned.replace(/```tsx/g, '');
    cleaned = cleaned.replace(/```css/g, '');
    cleaned = cleaned.replace(/```javascript/g, '');
    cleaned = cleaned.replace(/```/g, '');
    
    // Nettoyage spécifique selon le type
    if (fileType !== 'css') {
      // S'assurer qu'on commence par 'use client' ou export
      if (!cleaned.startsWith("'use client'") && !cleaned.startsWith('export') && !cleaned.startsWith('import')) {
        // Chercher le début du vrai contenu
        const exportMatch = cleaned.match(/(('use client'|export|import)[\s\S]*)/);
        if (exportMatch) {
          cleaned = exportMatch[1];
        }
      }
    } else {
      // Pour CSS, chercher @tailwind ou :root
      if (!cleaned.startsWith('@tailwind') && !cleaned.startsWith(':root')) {
        const cssMatch = cleaned.match(/(@tailwind|:root)[\s\S]*/);
        if (cssMatch) {
          cleaned = cssMatch[0];
        }
      }
    }
    
    // Vérifier si le code est complet (detect truncation) - MODE INTELLIGENT
    const isDebugMode = process.env.DISABLE_TRUNCATION_CHECK === 'true';
    const isTruncated = this.isCodeTruncated(cleaned, fileType);
    const isSmartMode = true; // Mode intelligent par défaut
    
    if (!isDebugMode && isTruncated && (!isSmartMode || this.isReallyTruncated(cleaned, fileType))) {
      this.logger.log('WARN', `⚠️ Code tronqué détecté (${fileType || 'unknown'}), utilisation du fallback`);
      this.logger.log('DEBUG', `Code vérifié (${cleaned.length} chars): ${cleaned.substring(0, 200)}...`);
      return this.generateFallbackContent(cleaned, pageName, domain, fileType);
    } else if (isDebugMode) {
      this.logger.log('DEBUG', `⚠️ Détection de troncature désactivée (mode debug)`);
    } else if (isTruncated && isSmartMode) {
      this.logger.log('DEBUG', `⚠️ Code potentiellement tronqué mais semble valide (mode smart) - ${fileType}`);
    }
    
    return cleaned;
  }

  private isCodeTruncated(code: string, fileType?: string): boolean {
    // Détection spécifique selon le type de fichier
    switch (fileType) {
      case 'css':
        return this.isCSSTruncated(code);
      case 'tsx':
      case 'jsx':
        return this.isTSXTruncated(code);
      case 'js':
        return this.isJSTruncated(code);
      default:
        return this.isTSXTruncated(code); // Par défaut, validation TSX
    }
  }

  private isCSSTruncated(code: string): boolean {
    // Vérifier les accolades CSS
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return true;
    }
    
    // Vérification plus souple : si le CSS contient au moins @tailwind ou du CSS valide
    const hasBasicStructure = code.includes('@tailwind') || 
                              code.includes(':root') || 
                              code.includes('body') ||
                              (code.includes('{') && code.includes('}') && code.length > 50);
    
    if (!hasBasicStructure) {
      return true;
    }
    
    // Vérifier que le code n'est pas tronqué au milieu d'une règle
    const lines = code.trim().split('\n');
    const lastLine = lines[lines.length - 1].trim();
    
    // Signes de troncature au milieu d'une règle CSS
    if (lastLine.endsWith(':') || lastLine.endsWith(',') || 
        (lastLine.includes('{') && !lastLine.includes('}'))) {
      return true;
    }
    
    return false;
  }

  private isTSXTruncated(code: string): boolean {
    const trimmedCode = code.trim();
    
    // Compter les accolades
    const openBraces = (trimmedCode.match(/\{/g) || []).length;
    const closeBraces = (trimmedCode.match(/\}/g) || []).length;
    
    // Si les accolades ne matchent pas, le code est probablement tronqué
    if (openBraces !== closeBraces) {
      return true;
    }
    
    // Vérifier les parenthèses JSX
    const openParens = (trimmedCode.match(/\(/g) || []).length;
    const closeParens = (trimmedCode.match(/\)/g) || []).length;
    
    if (openParens !== closeParens) {
      return true;
    }
    
    // Vérification plus souple de la structure de base
    const hasBasicStructure = trimmedCode.includes('export') || 
                              trimmedCode.includes('function') || 
                              trimmedCode.includes('const ') ||
                              trimmedCode.includes('return');
                              
    if (!hasBasicStructure) {
      return true;
    }
    
    // Vérifier que le code se termine proprement (plus souple)
    const lines = trimmedCode.split('\n');
    const lastLine = lines[lines.length - 1].trim();
    
    // Signes évidents de troncature
    if (lastLine.endsWith(',') || lastLine.endsWith('=') || 
        lastLine.endsWith('&&') || lastLine.endsWith('||') ||
        lastLine.endsWith('<') || lastLine.endsWith('(')) {
      return true;
    }
    
    return false;
  }

  private isJSTruncated(code: string): boolean {
    const trimmedCode = code.trim();
    
    // Vérifier les accolades
    const openBraces = (trimmedCode.match(/\{/g) || []).length;
    const closeBraces = (trimmedCode.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return true;
    }
    
    // Vérification plus souple des exports
    const hasValidExport = trimmedCode.includes('module.exports') || 
                           trimmedCode.includes('export') ||
                           trimmedCode.includes('exports') ||
                           (trimmedCode.includes('{') && trimmedCode.includes('}'));
    
    if (!hasValidExport) {
      return true;
    }
    
    // Vérifier que le code ne se termine pas brutalement
    const lines = trimmedCode.split('\n');
    const lastLine = lines[lines.length - 1].trim();
    
    // Signes de troncature
    if (lastLine.endsWith(',') || lastLine.endsWith(':') || 
        lastLine.endsWith('=') || lastLine.endsWith('{')) {
      return true;
    }
    
    return false;
  }

  /**
   * Détection STRICTE de troncature - seulement les vrais cas
   */
  private isReallyTruncated(code: string, fileType?: string): boolean {
    const trimmedCode = code.trim();
    
    // Tests très stricts - seulement les cas évidents
    switch (fileType) {
      case 'css':
        // CSS vraiment tronqué
        const openBraces = (trimmedCode.match(/\{/g) || []).length;
        const closeBraces = (trimmedCode.match(/\}/g) || []).length;
        
        // Accepter si les accolades matchent et que c'est pas vide
        if (openBraces === closeBraces && trimmedCode.length > 100) {
          return false;
        }
        
        // Vraie troncature si se termine par ces patterns
        return trimmedCode.endsWith(':') || 
               trimmedCode.endsWith(',') || 
               (openBraces !== closeBraces && Math.abs(openBraces - closeBraces) > 1);
        
      case 'tsx':
      case 'jsx':
        // TSX vraiment tronqué
        const jsxOpenBraces = (trimmedCode.match(/\{/g) || []).length;
        const jsxCloseBraces = (trimmedCode.match(/\}/g) || []).length;
        
        // Si accolades équilibrées et contient du TSX valide
        if (jsxOpenBraces === jsxCloseBraces && 
            (trimmedCode.includes('export') || trimmedCode.includes('function')) &&
            trimmedCode.length > 200) {
          return false;
        }
        
        // Vraie troncature
        return trimmedCode.endsWith('<') || 
               trimmedCode.endsWith('(') ||
               trimmedCode.endsWith('=') ||
               (jsxOpenBraces !== jsxCloseBraces && Math.abs(jsxOpenBraces - jsxCloseBraces) > 2);
        
      case 'js':
        // JS vraiment tronqué
        const jsOpenBraces = (trimmedCode.match(/\{/g) || []).length;
        const jsCloseBraces = (trimmedCode.match(/\}/g) || []).length;
        
        // Si accolades OK et contient export
        if (jsOpenBraces === jsCloseBraces && 
            (trimmedCode.includes('module.exports') || trimmedCode.includes('export')) &&
            trimmedCode.length > 50) {
          return false;
        }
        
        return trimmedCode.endsWith(':') ||
               trimmedCode.endsWith('=') ||
               (jsOpenBraces !== jsCloseBraces && Math.abs(jsOpenBraces - jsCloseBraces) > 1);
        
      default:
        return false; // Par défaut, pas tronqué
    }
  }

  private generateFallbackContent(originalContent: string, pageName?: string, domain?: string, fileType?: string): string {
    this.logger.log('WARN', `Génération fallback pour ${fileType} (${pageName || 'unknown'})`);
    
    switch (fileType) {
      case 'css':
        return this.generateFallbackCSS();
      case 'tsx':
        if (pageName === 'layout') {
          return this.generateFallbackLayout(domain || 'app');
        } else if (pageName === 'homepage') {
          return this.generateFallbackHomePage(domain || 'app');
        } else {
          return this.generateFallbackPage(pageName || 'Page', domain || 'app');
        }
      case 'js':
        if (pageName === 'tailwind') {
          return this.generateFallbackTailwindConfig();
        }
        return originalContent;
      default:
        return this.generateFallbackPage(pageName || 'Page', domain || 'app');
    }
  }

  private generateFallbackCSS(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
  --accent: #f59e0b;
  --accent-foreground: #ffffff;
  --background: #ffffff;
  --foreground: #0f172a;
  --muted: #f8fafc;
  --muted-foreground: #64748b;
  --border: #e2e8f0;
  --input: #f1f5f9;
  --ring: #2563eb;
  --radius: 0.5rem;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--foreground);
  background: var(--background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}`;
  }

  private generateFallbackLayout(domain: string): string {
    return `import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '../components/Providers'

export const metadata: Metadata = {
  title: '${domain} App',
  description: 'Application moderne avec Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold text-gray-900">
                    ${domain}
                  </a>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                  <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Accueil
                  </a>
                  <a href="/about" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    À propos
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-gray-50 border-t">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500">© 2024 ${domain}. Tous droits réservés.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}`;
  }

  private generateFallbackHomePage(domain: string): string {
    return `'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              ${domain}
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Bienvenue sur notre application moderne et performante.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/about" className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                En Savoir Plus
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}`;
  }

  private generateFallbackTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#f1f5f9",
      },
    },
  },
  plugins: [],
}`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Appel API avec gestion d'erreur
   */
  private async callAPI(prompt: string, maxTokens: number = 4000): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.logger.log('INFO', `📡 Appel API (max ${maxTokens} tokens)...`);
      
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log('INFO', `✅ Réponse reçue en ${duration}s`);
      
      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
        
    } catch (error: any) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log('ERROR', `❌ Échec API après ${duration}s`, error);
      throw error;
    }
  }

  /**
   * Parser la réponse JSON en Map de fichiers
   */
  private parseFilesFromResponse(response: string): Map<string, string> {
    const files = new Map<string, string>();
    
    try {
      this.logger.log('DEBUG', `Réponse complète (${response.length} chars), derniers 200 chars: ${response.substring(response.length - 200)}`);
      
      const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        // Essayons avec une regex plus permissive
        const altMatch = response.match(/```json\s*\n([\s\S]*)/);
        if (altMatch) {
          this.logger.log('WARN', 'Réponse JSON sans fermeture propre, tentative de parsing quand même');
          let content = altMatch[1].trim();
          if (content.endsWith('```')) {
            content = content.slice(0, -3);
          }
          const filesObj = JSON.parse(content);
          for (const [path, fileContent] of Object.entries(filesObj)) {
            if (typeof fileContent === 'string') {
              files.set(path, fileContent);
            }
          }
          this.logger.log('INFO', `📦 ${files.size} fichiers parsés (format alternatif)`);
          return files;
        }
        
        this.logger.log('ERROR', `Réponse brute qui ne correspond pas au format JSON: ${response.substring(0, 500)}...`);
        throw new Error('Format de réponse invalide');
      }
      
      const filesObj = JSON.parse(jsonMatch[1]);
      
      for (const [path, content] of Object.entries(filesObj)) {
        if (typeof content === 'string') {
          files.set(path, content);
        }
      }
      
      this.logger.log('INFO', `📦 ${files.size} fichiers parsés`);
      return files;
      
    } catch (error) {
      this.logger.log('ERROR', 'Erreur parsing réponse', error);
      throw error;
    }
  }

  async generateApp(prompt: string): Promise<string> {
    // Méthode legacy maintenue pour compatibilité
    try {
      this.logger.log('INFO', 'Génération application avec Claude');
      
      const developmentPrompt = `${prompt}\n\nVeuillez générer le code complet de cette application. 
Formatez la réponse avec des blocs de code pour chaque fichier:
\`\`\`filename.ext
contenu du fichier
\`\`\`

Incluez tous les fichiers nécessaires (HTML, CSS, JS, package.json, README.md).`;

      const maxTokensStep2 = parseInt(process.env.MAX_TOKENS_STEP2 || '12000');
      return await this.callClaude(developmentPrompt, maxTokensStep2);
    } catch (error: any) {
      this.logger.log('ERROR', 'Génération application échouée', error);
      throw error;
    }
  }
  
  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('INFO', 'Test de connexion API Claude');
      
      const response = await this.callClaude('Répondez simplement "OK" pour tester la connexion.', 100);
      const isConnected = response.toLowerCase().includes('ok');
      
      this.logger.log('INFO', `Test connexion: ${isConnected ? 'SUCCÈS' : 'ÉCHEC'}`);
      return isConnected;
    } catch (error: any) {
      this.logger.log('ERROR', 'Test de connexion échoué', error);
      return false;
    }
  }

  /**
   * Extraction des composants requis depuis l'architecture
   */
  private extractRequiredComponents(architecture: string): string[] {
    // Analyse basique des composants mentionnés dans l'architecture
    const defaultComponents = ['button', 'card', 'modal', 'form', 'table'];
    
    // TODO: Analyse plus intelligente basée sur le domaine métier
    // if (architecture.includes('ecommerce')) return ['button', 'card', 'cart', 'product'];
    // if (architecture.includes('dashboard')) return ['chart', 'table', 'widget'];
    
    return defaultComponents;
  }

  /**
   * Cache les composants nouvellement générés
   */
  private cacheGeneratedComponents(files: Map<string, string>, style: string, tech: string): void {
    for (const [filePath, code] of files) {
      if (filePath.includes('components/ui/')) {
        const componentName = filePath.split('/').pop()?.replace('.tsx', '').toLowerCase() || '';
        
        this.componentCache.setComponent({
          name: componentName,
          code: code,
          style: style,
          tech: tech,
          version: '1.0.0'
        });
      }
    }
  }

  /**
   * PHASE 3 : Génération automatique des contextes React par domaine
   */
  private generateDomainContexts(architecture: any): Map<string, string> {
    const files = new Map<string, string>();
    const domain = architecture.metadata?.domain || 'app';
    
    this.logger.log('DEBUG', `Détection domaine brut: ${domain}`);
    
    // Récupérer les templates de contextes pour ce domaine
    const domainTemplate = getDomainContexts(domain);
    
    if (!domainTemplate) {
      this.logger.log('WARN', `Aucun template de contexte trouvé pour domaine: ${domain}`);
      this.logger.log('DEBUG', 'Domaines supportés: ecommerce, saas, portfolio');
      return files;
    }

    this.logger.log('INFO', `📋 Template trouvé pour domaine: ${domain} -> ${domainTemplate.providers.length} providers`);

    // Générer tous les fichiers de contexte
    domainTemplate.contexts.forEach(context => {
      files.set(context.filePath, context.code);
      this.logger.log('DEBUG', `Contexte généré: ${context.name} -> ${context.filePath}`);
    });

    // Générer le fichier Providers.tsx qui regroupe tous les providers
    const providersCode = generateLayoutWrapper(domainTemplate.providers);
    files.set('components/Providers.tsx', providersCode);
    this.logger.log('DEBUG', 'Fichier Providers.tsx généré');

    return files;
  }

  /**
   * PHASE 4 : Génération automatique des composants métier par domaine
   */
  private generateDomainBusinessComponents(architecture: any): Map<string, string> {
    const files = new Map<string, string>();
    const domain = architecture.metadata?.domain || 'app';
    
    this.logger.log('DEBUG', `Détection domaine pour composants métier: ${domain}`);
    
    // Récupérer les templates de composants métier pour ce domaine
    const businessTemplate = getDomainBusinessComponents(domain);
    
    if (!businessTemplate) {
      this.logger.log('WARN', `Aucun template de composant métier trouvé pour domaine: ${domain}`);
      this.logger.log('DEBUG', 'Domaines métier supportés: ecommerce, saas, portfolio');
      return files;
    }

    this.logger.log('INFO', `🎯 Template métier trouvé pour domaine: ${domain} -> ${businessTemplate.components.length} composants`);

    // Créer le dossier business s'il n'existe pas
    const businessFolder = 'components/business/';

    // Générer tous les composants métier
    businessTemplate.components.forEach(component => {
      files.set(component.filePath, component.code);
      this.logger.log('DEBUG', `Composant métier généré: ${component.name} -> ${component.filePath}`);
      this.logger.log('DEBUG', `  └─ Contextes utilisés: [${component.contexts.join(', ')}]`);
    });

    // Générer un fichier d'index pour faciliter les imports
    const indexContent = businessTemplate.components
      .map(component => `export { ${component.name} } from './${component.name}';`)
      .join('\n') + '\n';
    
    files.set('components/business/index.ts', indexContent);
    this.logger.log('DEBUG', 'Fichier index des composants métier généré');

    return files;
  }

  // ============================================================================
  // PHASE 5 - MÉTHODES OPTIMISATIONS AVANCÉES
  // ============================================================================

  /**
   * Phase 5.1 - Cache intelligent avec prédiction
   */
  private async generateWithSmartCache(
    type: 'component' | 'page' | 'config' | 'domain',
    key: string,
    domain: string,
    generator: () => Promise<string>
  ): Promise<string> {
    // Vérifier le cache d'abord
    const cached = this.smartCache.get(type, key, domain);
    if (cached) {
      this.logger.log('DEBUG', `📋 Cache HIT: ${type}/${key}`);
      return cached as string;
    }

    // Générer le contenu
    const content = await generator();
    
    // Mettre en cache
    this.smartCache.set(type, key, content, domain);
    
    // Prédiction proactive
    this.smartCache.predictAndPreload(domain, key);
    
    return content;
  }

  /**
   * Phase 5.2 - Validation automatique et auto-fixes
   */
  async validateAndFixGeneration(appPath: string): Promise<{
    score: number;
    issues: number;
    fixesApplied: number;
  }> {
    this.logger.log('INFO', '🔍 Phase 5.2: Validation et auto-correction...');
    
    try {
      // 1. Validation complète
      const validation = await this.qualityValidator.validateApplication(appPath);
      
      // 2. Application des auto-fixes
      const fixesApplied = await this.qualityValidator.applyAutoFixes(
        appPath,
        validation.autoFixes
      );

      // 3. Re-validation après fixes
      const finalValidation = await this.qualityValidator.validateApplication(appPath);

      this.logger.log('INFO', `✅ Validation Phase 5.2: Score ${finalValidation.score}/100, ${fixesApplied} corrections appliquées`);

      return {
        score: finalValidation.score,
        issues: finalValidation.issues.length,
        fixesApplied
      };

    } catch (error) {
      this.logger.log('WARN', `Erreur validation Phase 5.2: ${error}`);
      return { score: 0, issues: 0, fixesApplied: 0 };
    }
  }

  /**
   * Phase 5.3 - Templates domaines étendus
   */
  private async generateExtendedDomainComponents(
    domain: string, 
    appName: string
  ): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    this.logger.log('INFO', '🎯 Phase 5.3: Génération templates domaines étendus...');
    
    // Récupérer le template étendu
    const extendedTemplate = getExtendedDomainTemplate(domain);
    
    if (!extendedTemplate) {
      this.logger.log('DEBUG', `Pas de template étendu pour domaine: ${domain}`);
      return files;
    }

    // Génération des contextes étendus
    if (extendedTemplate.contexts) {
      for (const context of extendedTemplate.contexts) {
        const content = await this.generateWithSmartCache(
          'domain',
          `${domain}-${context.name}`,
          domain,
          () => Promise.resolve(context.content)
        );
        files.set(context.file, content);
        this.logger.log('DEBUG', `✅ Contexte étendu: ${context.name}`);
      }
    }

    // Génération des composants étendus
    if (extendedTemplate.components) {
      for (const component of extendedTemplate.components) {
        const content = await this.generateWithSmartCache(
          'component',
          `${domain}-${component.name}`,
          domain,
          () => Promise.resolve(component.content)
        );
        files.set(component.file, content);
        this.logger.log('DEBUG', `✅ Composant étendu: ${component.name}`);
      }
    }

    this.logger.log('INFO', `🎯 Phase 5.3: ${files.size} fichiers étendus générés`);
    return files;
  }

  /**
   * Phase 5.4 - Optimisation des performances
   */
  private optimizeGeneration(): void {
    this.logger.log('INFO', '⚡ Phase 5.4: Optimisation performances...');
    
    // 1. Optimiser le cache
    this.smartCache.optimize();
    
    // 2. Métriques du cache
    const metrics = this.smartCache.getMetrics();
    this.logger.log('INFO', `📊 Cache: ${metrics.hitRate}% hit rate, ${metrics.compressionRatio * 100}% compression`);
    
    // 3. Nettoyer les ressources
    if (metrics.memoryUsage > 10 * 1024 * 1024) { // > 10MB
      this.smartCache.invalidate();
      this.logger.log('INFO', '🧹 Cache nettoyé (limite mémoire)');
    }
  }

  /**
   * Sauvegarde Phase 5 - Cache persistant
   */
  savePhase5Cache(): void {
    try {
      this.smartCache.saveToDisk();
      this.logger.log('INFO', '💾 Cache Phase 5 sauvegardé');
    } catch (error) {
      this.logger.log('WARN', `Erreur sauvegarde cache: ${error}`);
    }
  }

  /**
   * Métriques Phase 5
   */
  getPhase5Metrics(): {
    cacheMetrics: any;
    validationEnabled: boolean;
    extendedTemplates: number;
    optimizationsActive: boolean;
  } {
    return {
      cacheMetrics: this.smartCache.getMetrics(),
      validationEnabled: true,
      extendedTemplates: getExtendedDomainTemplate('saas') ? Object.keys(getExtendedDomainTemplate('saas') || {}).length : 0,
      optimizationsActive: true
    };
  }
}