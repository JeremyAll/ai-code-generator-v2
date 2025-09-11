import { SandboxManager } from '@lovable/sandbox';
import type { GeneratedApp } from '../types/project.js';

export class PreviewIntegrationService {
  private sandboxManager = new SandboxManager();
  private activePreviews = new Map<string, string>(); // projectId -> previewUrl

  /**
   * Génère une app et crée immédiatement une preview live
   */
  async generateWithPreview(
    prompt: string, 
    options: { framework?: 'react' | 'vue' | 'svelte' } = {}
  ) {
    console.log('🤖 Generating app with instant preview...');
    
    try {
      // 1. Générer l'app avec le workflow existant
      const generatedApp = await this.generateApp(prompt, options);
      
      // 2. Convertir les fichiers pour WebContainer
      const files = this.convertToWebContainerFiles(generatedApp);
      
      // 3. Créer la preview instantanée
      const sandboxId = `gen-${Date.now()}`;
      const sandbox = await this.sandboxManager.createSandbox(sandboxId, files);
      
      // 4. Sauvegarder l'URL de preview
      this.activePreviews.set(generatedApp.id, sandbox.previewUrl);
      
      console.log(`✅ App generated with live preview: ${sandbox.previewUrl}`);
      
      return {
        ...generatedApp,
        previewUrl: sandbox.previewUrl,
        sandboxId,
        isLive: true
      };
      
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      // Fallback: générer sans preview
      const app = await this.generateApp(prompt, options);
      return { ...app, isLive: false };
    }
  }
  
  /**
   * Met à jour une preview existante avec de nouveaux fichiers
   */
  async updatePreview(projectId: string, updatedFiles: Map<string, string>) {
    try {
      console.log(`🔄 Updating preview for project: ${projectId}`);
      await this.sandboxManager.updateSandbox(projectId, updatedFiles);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update preview: ${error}`);
      return false;
    }
  }
  
  /**
   * Convertit une app générée en fichiers WebContainer
   */
  private convertToWebContainerFiles(app: GeneratedApp): Map<string, string> {
    const files = new Map<string, string>();
    
    // Structure de base React/Vite
    files.set('package.json', JSON.stringify({
      name: app.name || 'generated-app',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'lucide-react': '^0.263.1', // Icons
        ...(app.dependencies || {})
      },
      devDependencies: {
        'vite': '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        'typescript': '^5.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0'
      }
    }, null, 2));
    
    // Vite config
    files.set('vite.config.js', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000,
    host: true
  }
});`);
    
    // Index.html
    files.set('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${app.name || 'Generated App'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`);
    
    // Entry point
    files.set('src/main.jsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);
    
    // App principal (depuis les fichiers générés)
    const appContent = app.files?.find(f => f.path.includes('App.'))?.content;
    if (appContent) {
      files.set('src/App.jsx', appContent);
    } else {
      // Fallback si pas de fichier App trouvé
      files.set('src/App.jsx', this.generateFallbackApp(app));
    }
    
    // Autres fichiers générés
    app.files?.forEach(file => {
      if (!file.path.includes('App.') && !file.path.includes('package.json')) {
        const webPath = file.path.startsWith('src/') ? file.path : `src/${file.path}`;
        files.set(webPath, file.content);
      }
    });
    
    return files;
  }
  
  /**
   * App de fallback si la génération échoue partiellement
   */
  private generateFallbackApp(app: GeneratedApp): string {
    return `
import React from 'react';
import { Heart, Code, Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="text-purple-500 w-8 h-8" />
            <h1 className="text-4xl font-bold text-gray-800">
              ${app.name || 'Generated App'}
            </h1>
            <Sparkles className="text-purple-500 w-8 h-8" />
          </div>
          <p className="text-gray-600 text-lg">
            Generated with Lovable AI ✨
          </p>
        </header>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code className="text-blue-500 w-6 h-6" />
            <h2 className="text-2xl font-semibold text-gray-800">
              Live Preview Ready!
            </h2>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p>🚀 Your app is running in a WebContainer</p>
            <p>⚡ Changes will update in real-time</p>
            <p>🌐 Powered by browser-based Node.js</p>
          </div>
          
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-green-500 w-5 h-5" />
              <span className="font-medium text-green-800">
                Preview Status: Live ✅
              </span>
            </div>
            <p className="text-sm text-green-700">
              This preview updates automatically when you modify the code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}`;
  }
  
  /**
   * Génère une app (utilise le workflow existant)
   * À remplacer par l'intégration avec PureSonnetWorkflow
   */
  private async generateApp(prompt: string, options: any): Promise<GeneratedApp> {
    // TODO: Intégrer avec le workflow existant
    // const workflow = new PureSonnetWorkflow();
    // return await workflow.generate(prompt, options);
    
    // Mock pour l'instant
    return {
      id: `mock-${Date.now()}`,
      name: 'Mock Generated App',
      files: [
        {
          path: 'src/App.jsx',
          content: 'export default function App() { return <div>Hello World!</div>; }'
        }
      ]
    };
  }
  
  /**
   * Nettoie les previews inactives
   */
  async cleanup() {
    for (const [projectId] of this.activePreviews) {
      await this.sandboxManager.destroySandbox(projectId);
    }
    this.activePreviews.clear();
  }
}