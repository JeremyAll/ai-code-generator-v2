import { EventEmitter } from 'events';
import Anthropic from '@anthropic-ai/sdk';
import { UnsplashService } from './unsplash-service.js';

export class StreamingGenerator extends EventEmitter {
  constructor(apiKey) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      timeout: 30000  // 30s par ÉTAPE, pas pour tout
    });
    this.unsplash = new UnsplashService();
  }

  async generate(userPrompt, metadata = {}) {
    const steps = [
      { name: 'analyze', weight: 10 },
      { name: 'architecture', weight: 20 },
      { name: 'pages', weight: 20 },
      { name: 'components', weight: 20 },
      { name: 'state', weight: 15 },
      { name: 'api', weight: 10 },
      { name: 'images', weight: 5 }
    ];

    let result = {
      prompt: userPrompt,
      metadata,
      timestamp: Date.now()
    };

    let totalProgress = 0;

    // ÉTAPE PAR ÉTAPE - Chaque étape est indépendante
    for (const step of steps) {
      try {
        this.emit('progress', {
          step: step.name,
          progress: totalProgress,
          message: `Processing ${step.name}...`
        });

        switch (step.name) {
          case 'analyze':
            result.analysis = await this.analyzePrompt(userPrompt);
            break;

          case 'architecture':
            result.architecture = await this.generateArchitecture(
              userPrompt,
              result.analysis
            );
            break;

          case 'pages':
            result.pages = await this.generatePages(
              result.architecture
            );
            break;

          case 'components':
            result.components = await this.generateComponents(
              result.architecture,
              result.pages
            );
            break;

          case 'state':
            result.state = await this.generateStateManagement(
              result.architecture
            );
            break;

          case 'api':
            result.api = await this.generateAPI(
              result.architecture
            );
            break;

          case 'images':
            result.images = await this.fetchImages(
              result.analysis
            );
            break;
        }

        totalProgress += step.weight;

        this.emit('progress', {
          step: step.name,
          progress: totalProgress,
          message: `Completed ${step.name}`
        });

        // Petit délai pour éviter rate limiting
        await this.sleep(500);

      } catch (error) {
        console.error(`Step ${step.name} failed:`, error);

        // On continue même si une étape échoue
        result[step.name] = {
          error: error.message,
          fallback: this.getFallback(step.name)
        };
      }
    }

    // Assembler le résultat final
    return this.assembleResult(result);
  }

  async analyzePrompt(prompt) {
    // Prompt COURT et FOCALISÉ pour analyse
    const response = await this.client.messages.create({
      model: 'claude-3-haiku-20240307',  // Modèle RAPIDE pour analyse
      max_tokens: 500,
      temperature: 0.3,
      system: 'Analyze the user request. Output JSON only.',
      messages: [{
        role: 'user',
        content: `Analyze this app request:
"${prompt}"

Return JSON:
{
  "type": "ecommerce|saas|landing|dashboard",
  "product": "what is being sold/offered",
  "audience": "target users",
  "features": ["key features needed"],
  "complexity": "simple|medium|complex"
}`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  async generateArchitecture(prompt, analysis) {
    // Architecture génération - 2000 tokens max
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,  // PETIT chunk
      temperature: 0.7,
      system: 'Generate app architecture. JSON only.',
      messages: [{
        role: 'user',
        content: `Create architecture for: ${analysis.type} - ${analysis.product}
Features: ${analysis.features.join(', ')}

Return JSON:
{
  "name": "app name",
  "structure": {
    "pages": ["list of pages needed"],
    "components": ["list of components"],
    "contexts": ["state contexts needed"],
    "apis": ["api endpoints needed"]
  },
  "tech": {
    "framework": "Next.js",
    "styling": "Tailwind",
    "state": "Context API"
  }
}`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  async generatePages(architecture) {
    const pages = [];

    // Générer 3-4 pages à la fois pour éviter timeout
    const pageGroups = this.chunkArray(architecture.structure.pages, 3);

    for (const group of pageGroups) {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.7,
        system: 'Generate page implementations. JSON only.',
        messages: [{
          role: 'user',
          content: `Generate these pages: ${group.join(', ')}
App: ${architecture.name}

For each page return:
{
  "name": "page name",
  "path": "/path",
  "components": ["components used"],
  "layout": "layout HTML structure",
  "seo": { "title": "", "description": "" }
}`
        }]
      });

      const generated = JSON.parse(response.content[0].text);
      pages.push(...(Array.isArray(generated) ? generated : [generated]));

      await this.sleep(1000); // Éviter rate limit
    }

    return pages;
  }

  async generateComponents(architecture, pages) {
    // Similaire aux pages, par chunks
    const allComponents = [...new Set(
      pages.flatMap(p => p.components)
    )];

    const componentGroups = this.chunkArray(allComponents, 5);
    const components = [];

    for (const group of componentGroups) {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.7,
        system: 'Generate React components. JSON only.',
        messages: [{
          role: 'user',
          content: `Generate components: ${group.join(', ')}

Return array of:
{
  "name": "ComponentName",
  "props": ["prop1", "prop2"],
  "hooks": ["useState", "useEffect"],
  "dependencies": ["other components"]
}`
        }]
      });

      const generated = JSON.parse(response.content[0].text);
      components.push(...(Array.isArray(generated) ? generated : [generated]));
    }

    return components;
  }

  async generateStateManagement(architecture) {
    // State management en une seule requête courte
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.7,
      system: 'Generate state management. JSON only.',
      messages: [{
        role: 'user',
        content: `Create contexts for: ${architecture.name}
Needed: ${architecture.structure.contexts.join(', ')}

Return array of contexts with structure.`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  async generateAPI(architecture) {
    // API routes - requête simple
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.7,
      system: 'Generate API routes. JSON only.',
      messages: [{
        role: 'user',
        content: `Create API for: ${architecture.name}
Endpoints: ${architecture.structure.apis.join(', ')}`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  async fetchImages(analysis) {
    try {
      const keywords = this.getImageKeywords(analysis);
      const images = {};

      for (const [category, keyword] of Object.entries(keywords)) {
        images[category] = await this.unsplash.searchImages(keyword, 3);
      }

      return images;
    } catch (error) {
      console.warn('Images fetch failed:', error);
      return {};
    }
  }

  getImageKeywords(analysis) {
    const base = {
      hero: `${analysis.product} hero banner`,
      products: `${analysis.product} collection`,
      about: `${analysis.type} business`
    };

    return base;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getFallback(stepName) {
    const fallbacks = {
      pages: [{ name: 'Home', path: '/' }],
      components: [{ name: 'Header' }, { name: 'Footer' }],
      state: [{ name: 'AppContext' }],
      api: [{ path: '/api/health', method: 'GET' }],
      images: {}
    };

    return fallbacks[stepName] || null;
  }

  assembleResult(result) {
    // Assembler tous les morceaux en structure finale
    return {
      projectType: result.analysis?.type || 'ecommerce',
      name: result.architecture?.name || 'MyApp',
      pages: result.pages || [],
      components: result.components || [],
      contexts: result.state || [],
      apiRoutes: result.api || [],
      images: result.images || {},
      designSystem: this.generateDesignSystem(result.analysis),
      metadata: {
        generatedAt: Date.now(),
        prompt: result.prompt,
        analysis: result.analysis
      }
    };
  }

  generateDesignSystem(analysis) {
    // Design system basé sur l'analyse
    const themes = {
      ecommerce: {
        colors: { primary: '#000000', secondary: '#ffffff' },
        typography: { fontFamily: 'Inter' }
      },
      saas: {
        colors: { primary: '#4F46E5', secondary: '#10B981' },
        typography: { fontFamily: 'Inter' }
      }
    };

    return themes[analysis?.type] || themes.ecommerce;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}