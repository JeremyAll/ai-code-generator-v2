# App Generator Workflow 🚀

Système organisé de génération d'applications avec Claude Sonnet 4.

## 📋 Description

Générateur d'applications IA avec organisation automatique, horodatage et maintenance intégrée. Transforme vos idées en applications complètes en quelques minutes.

## 🚀 Installation

```bash
# Cloner et installer les dépendances
cd app-generator
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

### Variables d'environnement requises

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Votre clé API Anthropic
MAX_REQUESTS_PER_MINUTE=60    # Limite requêtes/minute
MAX_GENERATIONS_PER_DAY=50    # Limite générations/jour
MAX_DAILY_COST=50.00          # Coût maximum/jour
```

## 💻 Utilisation

### Mode CLI Interactif

```bash
npm run cli
# ou
npx appgen generate
```

Interface guidée avec options :
- ✅ Choix du framework (React, Next.js, Vue, Svelte)
- ✅ Niveau de complexité (Simple, Moyenne, Complexe)
- ✅ Animations premium (Oui/Non)
- ✅ Mode sombre (Oui/Non)

### Mode Direct

```bash
npx appgen generate --prompt "clone uber eats avec React et TypeScript"
```

## 📁 Structure du projet

```
app-generator/
├── src/
│   ├── workflows/          # Logique principale du workflow
│   │   ├── pure-sonnet.ts  # Workflow principal Claude
│   │   └── types.ts        # Types TypeScript
│   ├── prompts/            # Templates de prompts
│   │   ├── step1-architect.ts  # Prompt architecte
│   │   └── step2-developer.ts  # Prompt développeur
│   ├── utils/              # Utilitaires
│   │   ├── file-manager.ts # Gestion des fichiers
│   │   ├── logger.ts       # Système de logs
│   │   └── timestamp.ts    # Utilitaires de temps
│   └── config/
│       └── api-config.ts   # Configuration API
├── generated-apps/         # Applications générées (gitignore)
├── logs/                   # Logs de génération (gitignore partiel)
├── prompts/history/        # Historique des prompts
└── scripts/                # Scripts de gestion
    ├── clean.js           # Nettoyage automatique
    ├── backup.js          # Sauvegarde
    └── reset.js           # Reset complet
```

## 🎯 Utilisation

### Génération d'application

```bash
# Générer une nouvelle application
npm run generate my-app "Description de l'app" "Create a todo app with React and TypeScript"

# Ou directement avec node
node src/workflows/pure-sonnet.js my-app "Description" "Create a chat application"
```

### Scripts de gestion

```bash
# Nettoyer les générations anciennes (7+ jours)
npm run clean:old

# Nettoyer toutes les générations
npm run clean:all

# Créer une sauvegarde
npm run backup

# Voir les logs en temps réel
npm run logs

# Reset complet avec confirmation
npm run reset
```

## 🔧 Scripts avancés

### Nettoyage personnalisé

```bash
# Nettoyer les fichiers de plus de 14 jours
node scripts/clean.js --days=14

# Aperçu sans suppression
node scripts/clean.js --dry-run

# Mode verbeux
node scripts/clean.js --days=3 --verbose
```

### Sauvegarde avancée

```bash
# Sauvegarde compressée
node scripts/backup.js --compress

# Répertoire de sortie personnalisé
node scripts/backup.js --output ./mes-sauvegardes

# Dossiers spécifiques uniquement
node scripts/backup.js --include generated-apps,logs
```

### Reset avec options

```bash
# Reset forcé sans confirmation
node scripts/reset.js --force

# Reset sans sauvegarde
node scripts/reset.js --no-backup --force

# Reset incluant l'historique des prompts
node scripts/reset.js --reset-prompts
```

## 🏗️ Workflow de génération

### Étape 1 : Architecture
- Analyse du prompt utilisateur
- Conception de l'architecture technique
- Définition de la stack technologique
- Structure des fichiers et dépendances

### Étape 2 : Développement  
- Implémentation complète du code
- Génération de tous les fichiers
- Configuration des dépendances
- Code production-ready

### Étape 3 : Finalisation
- Sauvegarde des fichiers générés
- Logging des résultats
- Historique des prompts
- Structure de projet complète

## 📊 Monitoring

### Logs en temps réel
```bash
# Suivre les logs de génération
tail -f logs/generations/latest.log

# Suivre les erreurs
tail -f logs/errors/errors.log

# Ou via npm
npm run logs
npm run logs:errors
```

### Analyse des générations
- Logs horodatés avec session ID
- Durée d'exécution de chaque étape
- Métriques d'utilisation des tokens
- Historique complet des prompts

## 🔐 Sécurité

- Variables d'environnement pour les clés API
- Logs sans informations sensibles
- Fichiers de configuration exclus du git
- Validation des paramètres d'entrée

## 🚨 Gestion des erreurs

- Retry automatique sur les erreurs temporaires
- Logs détaillés des échecs
- Sauvegarde de l'état avant erreur
- Messages d'erreur explicites

## 🆘 Troubleshooting

### Erreurs Communes

#### "ANTHROPIC_API_KEY manquante"
```bash
# Vérifier .env
cat .env | grep ANTHROPIC_API_KEY
# Ajouter la clé si manquante
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

#### "Rate limit exceeded"
```bash
# Vérifier usage actuel
npx appgen stats
# Attendre reset ou augmenter limites dans .env
```

#### "Erreur de compilation TypeScript"
```bash
# Vérifier configuration
npx tsc --noEmit
# Corriger erreurs puis relancer
```

#### Tailwind CSS ne se charge pas
```bash
# Installer packages corrects
npm uninstall @tailwindcss/postcss
npm install -D tailwindcss postcss autoprefixer

# Vérifier postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### Génération incomplète
```bash
# Augmenter MAX_TOKENS dans .env (12000 minimum)
export MAX_TOKENS=12000
# Vérifier les logs pour erreurs API
npx appgen logs
# Utiliser mode --verbose pour plus de détails
npx appgen generate --verbose --prompt "votre prompt"
```

#### Espace disque plein
```bash
# Nettoyer anciennes générations
npm run clean:all

# Ou garder seulement 3 derniers jours
npx appgen clean --days 3

# Vérifier espace utilisé
npx appgen stats
```

#### API Rate Limit atteint
```bash
# Vérifier logs d'erreurs pour détails
cat logs/errors/errors.log

# Attendre reset quotidien (affiché dans stats)
npx appgen stats

# Réduire MAX_TOKENS si nécessaire
export MAX_TOKENS=8000
```

#### Application générée ne démarre pas
```bash
# Aller dans le dossier généré
cd generated-apps/[votre-app]/

# Installer les dépendances
npm install

# Vérifier le package.json
cat package.json

# Lancer en mode dev
npm run dev
```

#### Erreurs de permissions sur Windows
```bash
# Lancer en tant qu'administrateur ou
# Utiliser PowerShell au lieu de cmd
powershell
npx appgen generate
```

### Debug Mode

```bash
# Activer logs debug
export LOG_LEVEL=DEBUG
npx appgen generate --prompt "test"

# Ou mode verbose pour une génération
npx appgen generate --verbose --prompt "votre prompt"
```

### Vérification Santé Système

```bash
# Test connexion API
node -e "
const { AnthropicService } = require('./dist/services/anthropic-service.js');
new AnthropicService().testConnection().then(console.log);
"

# Vérifier versions Node.js
node --version  # Doit être >= 16
npm --version

# Vérifier espace disque
df -h  # Linux/Mac
dir   # Windows

# Test génération simple
npx appgen generate --prompt "simple counter app" --verbose
```

### Logs et Diagnostics

```bash
# Voir logs en temps réel
npx appgen logs -f

# Voir seulement les erreurs
npx appgen logs | grep ERROR

# Nettoyer logs anciens
rm -rf logs/generations/*.log

# Générer rapport de diagnostic
npx appgen stats > diagnostic.txt
```

## 📈 Optimisations

### Performance
- Génération asynchrone
- Cache des prompts fréquents  
- Parallélisation des tâches fichiers
- Nettoyage automatique de l'espace disque

### Maintenance
- Scripts de nettoyage automatisés
- Sauvegarde incrémentale
- Monitoring de l'espace disque
- Archivage des anciennes générations

## 🛠️ Développement

### Ajout de nouveaux workflows
1. Créer un nouveau fichier dans `src/workflows/`
2. Implémenter l'interface `WorkflowContext`
3. Ajouter les prompts correspondants
4. Mettre à jour les scripts npm

### Personnalisation des prompts
- Modifier `src/prompts/step1-architect.ts`
- Ajuster `src/prompts/step2-developer.ts`
- Tester avec différents types de projets

### Configuration avancée
```typescript
// src/config/api-config.ts
export const config = {
  maxRetries: 3,
  timeoutMs: 60000,
  batchSize: 10,
  // ...
};
```

## 📋 Prérequis système

- Node.js 16+
- npm ou yarn
- Clé API Anthropic Claude
- 2GB d'espace disque libre minimum

## 🤝 Support

Pour les problèmes ou suggestions :
1. Vérifier les logs d'erreur
2. Consulter la configuration
3. Tester avec un prompt simple
4. Créer une issue avec les détails

---

**⚡ Prêt à générer ? Lancez votre première application !**

```bash
npm run generate my-first-app "Test app" "Create a simple counter app with React"
```