# 🧪 FULL SYSTEM TEST - 12 DAYS VALIDATION

## Comment lancer le test complet

### 1. Prérequis
- ✅ Supabase configuré avec les vraies clés dans `.env`
- ✅ Base de données initialisée avec `database.sql`
- ✅ Next.js server en fonctionnement sur localhost:3000

### 2. Lancement du test

```bash
# Aller dans apps/web
cd apps/web

# Lancer le test complet
pnpm test:system
```

### 3. Ce que le test valide

**🔍 Validation des composants (Jour 1-10)**
- ✅ Generator - Génération d'applications
- ✅ Image Service - Intégration d'images Unsplash
- ✅ Assets Service - Icônes et illustrations
- ✅ Design System - Systèmes de design
- ✅ Testing Service - Tests automatisés

**🎯 Test de génération directe**
- Appel direct au générateur sans API
- Validation des fichiers générés
- Vérification du blueprint et preview

**👤 Création d'utilisateur de test**
- Création automatique dans Supabase
- Attribution de 10 crédits
- Génération de token d'authentification

**🤖 Test API de génération (Jour 12)**
- 3 prompts différents (e-commerce, SaaS, landing)
- Validation de l'authentification
- Vérification de la déduction de crédits
- Contrôle des fichiers générés

**📁 Test CRUD des projets**
- Liste des projets utilisateur
- Récupération d'un projet spécifique
- Validation des données stockées

**🧹 Nettoyage automatique**
- Suppression de l'utilisateur de test

### 4. Test API simple

```bash
# Test rapide de l'API (sans auth - doit retourner erreur 401)
pnpm test:api
```

### 5. Résultats attendus

```
🚀 FULL SYSTEM TEST - 12 DAYS VALIDATION
==================================================

🔍 Validating individual components...
✅ Generator
✅ Image Service
✅ Assets Service
✅ Design System
✅ Testing Service

🎯 Testing direct generator (without API)...
✅ Direct generation successful!
   Files generated: 8
   Has blueprint: true
   Has preview URL: true
   index.html size: 2847 characters
   Has React code: true

📧 Creating test user...
✅ Test user created: test-1736752847123@example.com
   Password: TestPassword123!

🤖 Testing generation API...

📝 Testing: "Create a modern e-commerce site for sneakers"
✅ Generation successful!
   Project ID: uuid-here
   Files count: 12
   Blueprint: Present

📁 Testing projects CRUD...
📋 Listing projects...
✅ Found 1 projects
📄 Getting project uuid-here...
✅ Project retrieved successfully
   Name: Generated App
   Domain: ecommerce

==================================================
🏁 TEST COMPLETE

🧹 Cleaning up test user...
```

### 6. En cas d'erreur

**❌ Failed to create user**
- Vérifier la configuration Supabase
- Vérifier les permissions service_role

**❌ Generation failed**
- Vérifier les clés API Anthropic et Unsplash
- Contrôler les logs du serveur Next.js

**❌ Component import failed**
- Vérifier que tous les packages sont installés
- Relancer `pnpm install` à la racine

## 🎉 Succès attendu

Si tous les tests passent ✅, cela confirme que :
- Les 12 jours de développement sont validés
- Le générateur d'applications est fonctionnel
- L'intégration Supabase fonctionne
- Les API routes sont opérationnelles
- Le système complet est prêt à l'emploi !