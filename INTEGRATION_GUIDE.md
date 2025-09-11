# 🏖️ WebContainer Preview Integration Guide

Ce guide explique comment intégrer les **WebContainers** pour des previews instantanées comme Lovable/StackBlitz.

## 🎯 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Generator  │───▶│  Preview Service │───▶│  WebContainer   │
│  (Anthropic)    │    │  (Integration)   │    │  (Browser)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Installation & Setup

### 1. Dépendances installées ✅

```bash
# WebContainer API déjà installé
cd packages/@lovable/sandbox
pnpm install  # @webcontainer/api inclus
```

### 2. Structure créée ✅

```
packages/@lovable/sandbox/
├── src/
│   ├── webcontainer-service.ts     # Service WebContainer
│   ├── sandbox-manager.ts          # Gestionnaire multi-sandbox
│   ├── preview-component.tsx       # Composant React
│   ├── docker-fallback.ts          # Fallback Docker
│   └── index.ts                    # Exports principaux
└── README.md                       # Documentation
```

## 🔧 Utilisation

### A. Génération avec Preview (Backend)

```typescript
import { PreviewIntegrationService } from '@lovable/generator/services/preview-integration';

const previewService = new PreviewIntegrationService();

// Générer une app avec preview instantanée
const result = await previewService.generateWithPreview(
  'Create a dashboard with charts',
  { framework: 'react' }
);

console.log('Live preview:', result.previewUrl);
// → http://localhost:3000 (WebContainer URL)
```

### B. Composant React (Frontend)

```tsx
import { PreviewComponent } from '@lovable/sandbox';

function GeneratedAppPreview({ generatedFiles }) {
  return (
    <div className="h-screen w-full">
      <PreviewComponent
        files={generatedFiles}
        onReady={(url) => console.log('Preview ready:', url)}
        onError={(error) => console.error('Preview failed:', error)}
      />
    </div>
  );
}
```

### C. Intégration complète

```typescript
// Dans votre workflow principal
import { PureSonnetWorkflow } from './workflows/pure-sonnet';
import { PreviewIntegrationService } from './services/preview-integration';

class EnhancedGenerator extends PureSonnetWorkflow {
  private preview = new PreviewIntegrationService();
  
  async generateWithLivePreview(prompt: string) {
    // 1. Générer avec IA
    const app = await super.generateApp(prompt);
    
    // 2. Créer preview instantanée
    const preview = await this.preview.generateWithPreview(prompt);
    
    return {
      ...app,
      previewUrl: preview.previewUrl,
      isLive: true
    };
  }
}
```

## 🌐 Configuration Web UI

### 1. Headers CORS (Important!)

WebContainer nécessite l'isolation cross-origin:

```javascript
// next.config.js ou serveur web
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};
```

### 2. Page d'exemple

```tsx
// apps/web/pages/preview.tsx
import { useState } from 'react';
import { PreviewComponent } from '@lovable/sandbox';

export default function PreviewPage() {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState(new Map());
  
  const generateApp = async () => {
    // Appeler votre API de génération
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
    
    const result = await response.json();
    setFiles(new Map(Object.entries(result.files)));
  };
  
  return (
    <div className="h-screen flex">
      {/* Panel de contrôle */}
      <div className="w-1/3 p-4 border-r">
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your app..."
          className="w-full h-32 p-2 border rounded"
        />
        <button onClick={generateApp} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Generate & Preview
        </button>
      </div>
      
      {/* Preview live */}
      <div className="flex-1">
        {files.size > 0 && (
          <PreviewComponent files={files} />
        )}
      </div>
    </div>
  );
}
```

## 🧪 Tests

### Test local (Backend)
```bash
cd packages/@lovable/generator
node tests/test-preview-integration.js
```

### Test WebContainer (Browser requis)
```bash
cd apps/web
npm run dev
# Ouvrir http://localhost:3000/preview
```

## ⚠️ Limitations & Solutions

### WebContainer (Browser uniquement)
```typescript
// Détection environnement
if (typeof window !== 'undefined') {
  // Utiliser WebContainer
  const container = new WebContainerService();
} else {
  // Fallback Docker
  const container = new DockerSandbox();
}
```

### Performance
- Cache les containers pour réutilisation
- Cleanup automatique après inactivité
- Hot reload intelligent (fichiers modifiés uniquement)

## 🎯 Roadmap

- [x] ✅ WebContainer API integration
- [x] ✅ React Preview Component  
- [x] ✅ AI Generator integration
- [ ] 🔄 Web UI integration
- [ ] 🔄 Real-time collaboration
- [ ] 🔄 Multi-framework support (Vue, Svelte)
- [ ] 🔄 Advanced templates

## 🤝 Contributing

Cette intégration fait partie du monorepo Lovable. Pour contribuer:

1. Fork le repo: https://github.com/JeremyAll/ai-code-generator-v2
2. Créer une branche: `git checkout -b feature/preview-enhancement`
3. Commit: `git commit -m "feat: add preview feature"`
4. Push & PR

## 🏁 Status

**✅ READY FOR BROWSER TESTING**

L'intégration WebContainer est complète et prête pour les tests dans un environnement web avec les bons headers CORS configurés.