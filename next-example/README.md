# 🚀 BAML Next.js Streaming API Example

> Exemple complet d'intégration de l'API streaming BAML avec Next.js App Router

## ⚡ Quick Start

### 1. Installation

```bash
cd next-example
npm install
```

### 2. Configuration

Créer `.env.local` :

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Démarrer le serveur

```bash
npm run dev
```

Ouvrir http://localhost:3000

## 🎯 API Route Usage

### Route disponible : `/api/generate`

**POST** avec body JSON :
```json
{
  "prompt": "Create a React todo app with hooks"
}
```

### Mode Rapide (Haiku)

Ajouter header `x-fast-mode: true` pour génération rapide (~5-10s) :

```javascript
fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-fast-mode': 'true'
  },
  body: JSON.stringify({
    prompt: 'Create a simple React button component'
  })
})
```

### Mode Production (Sonnet)

Par défaut, utilise Sonnet pour génération complète (~30-60s) :

```javascript
fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Create a complete e-commerce website with cart and checkout'
  })
})
```

## 📡 Streaming Response

L'API retourne un **Server-Sent Events (SSE)** stream :

```javascript
const response = await fetch('/api/generate', { /* ... */ });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);

      if (data === '[DONE]') {
        // Stream terminé
        break;
      }

      try {
        const parsed = JSON.parse(data);
        console.log('Chunk:', parsed.chunk);
      } catch (e) {
        // Ignorer les chunks non-JSON
      }
    }
  }
}
```

## 🧪 Tests

### Test de l'API depuis baml-test :

```bash
cd ../baml-test
npm run test:nextjs
```

### Test interactif :

1. Démarrer Next.js : `npm run dev`
2. Ouvrir : http://localhost:3000
3. Utiliser l'interface de test intégrée

## 📊 Configuration des Modèles

### Haiku (Mode Rapide)
- **Tokens max** : 2,000
- **Temps** : 5-10 secondes
- **Usage** : Prototypes, tests, composants simples
- **Coût** : ~10x moins cher

### Sonnet (Mode Production)
- **Tokens max** : 8,000
- **Temps** : 30-60 secondes
- **Usage** : Applications complètes
- **Qualité** : Production-ready

### Sonnet-4 (Mode Comprehensive)
- **Tokens max** : 12,000
- **Temps** : 60-120 secondes
- **Usage** : Applications enterprise
- **Fonctionnalités** : TypeScript, tests, architecture avancée

## 🔧 Architecture

```
next-example/
├── app/
│   ├── api/generate/route.js    # API Route SSE
│   ├── layout.js               # Layout Next.js
│   └── page.js                 # Page d'accueil
├── src/
│   └── streaming-handler.js     # Handler streaming optimisé
└── package.json
```

## 🎨 Interface de Test

L'exemple inclut une interface web complète pour tester l'API avec :

- ✅ Sélection mode rapide/production
- 📡 Streaming en temps réel
- 📊 Métriques (durée, chunks, vitesse)
- 📄 JSON output formaté
- ⚠️ Gestion d'erreurs

## ⚡ Performance

### Mode Rapide (Haiku)
- **Latence** : 500ms premier chunk
- **Débit** : 50-100 tokens/seconde
- **Total** : 5-10 secondes

### Mode Production (Sonnet)
- **Latence** : 1-2s premier chunk
- **Débit** : 100-200 tokens/seconde
- **Total** : 30-60 secondes

## 🚨 Gestion d'Erreurs

L'API gère automatiquement :

- ❌ **Clé API manquante**
- ⏱️ **Timeouts** (30s par modèle)
- 🔄 **Retry automatique** (3 tentatives)
- 📡 **Connexion perdue**
- 🧩 **JSON invalide**

## 🔐 Sécurité

- ✅ API key côté serveur uniquement
- ✅ Validation des inputs
- ✅ Rate limiting recommandé
- ✅ CORS configuré

## 📈 Monitoring

Logs automatiques :
- 📊 Durée par requête
- 🔢 Nombre de chunks
- ⚠️ Erreurs avec stack trace
- 📱 Mode utilisé (fast/production)

---

**🚀 Prêt pour production avec monitoring complet !**

Pour questions : voir documentation BAML dans le repository principal.