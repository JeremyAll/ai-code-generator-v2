import { AppArchitecture } from '../workflows/types.js';

export function architectPrompt(userPrompt: string, projectName: string): string {
  return `# ÉTAPE 1 : ARCHITECTE - ANALYSE EXHAUSTIVE

Tu analyses un prompt utilisateur et génères une architecture PRÉCISE et ADAPTÉE.

**Prompt utilisateur :** ${userPrompt}

## ANALYSE CONTEXTUELLE

Détermine avec précision :
1. **Scope demandé** : landing (5-8 pages) | dashboard (interface app) | full_app (15+ pages) | platform (30+ pages)
2. **Domaine principal** : Identifie parmi la liste exhaustive ci-dessous
3. **Utilisateurs cibles** : B2C, B2B, B2B2C, interne, mixte
4. **Complexité souhaitée** : simple, medium, complex, enterprise

## DOMAINES EXHAUSTIFS

\`\`\`yaml
# Business & SaaS
- saas_analytics      # Dashboards, KPIs, rapports
- saas_productivity   # Gestion projets, tâches, workflow
- saas_communication  # Chat, video, collaboration
- saas_crm           # Relation client, ventes, pipeline
- saas_hrtech        # RH, recrutement, paie, talents

# Commerce & Marketplace  
- ecommerce_b2c      # Boutique en ligne classique
- ecommerce_b2b      # Wholesale, commandes pro
- marketplace_goods   # Multi-vendeurs produits
- marketplace_services # Services, freelances, gigs
- marketplace_rental  # Location (immobilier, véhicules)

# Finance & Legal
- fintech_banking    # Néobanque, comptes, cartes
- fintech_payment    # Paiements, facturation, checkout
- fintech_trading    # Investissement, crypto, bourse
- fintech_lending    # Prêts, crédit, crowdfunding
- legaltech_contracts # Contrats, signatures, documents
- legaltech_compliance # Conformité, RGPD, audit

# Santé & Bien-être
- health_medical     # Cliniques, hôpitaux, consultations
- health_wellness    # Bien-être, fitness, nutrition
- health_mental      # Santé mentale, thérapie, méditation
- health_pharma      # Pharmacie, médicaments, ordonnances

# Éducation & Formation
- edtech_school      # Scolaire, CP-Terminale
- edtech_higher      # Universitaire, grandes écoles
- edtech_professional # Formation pro, certifications
- edtech_skills      # Compétences, langues, hobbies

# Industries spécifiques
- proptech           # Immobilier (gestion, location, vente)
- insurtech          # Assurances (auto, santé, vie)
- agritech           # Agriculture, fermes, supply chain
- logistics          # Transport, livraison, tracking
- manufacturing      # Production, maintenance, qualité
- hospitality        # Hôtels, restaurants, tourisme

# Media & Entertainment
- content_streaming  # Video, musique, podcasts
- content_publishing # Blog, news, magazines
- content_creation   # Créateurs, influenceurs, artistes
- gaming            # Jeux, esports, communautés

# Social & Community
- social_network     # Réseaux sociaux, feed, stories
- social_dating      # Rencontres, matching
- social_events      # Événements, meetups, billetterie
- community_forum    # Forums, discussions, Q&A

# Services professionnels
- agency_marketing   # Marketing, pub, digital
- agency_design      # Design, UX, branding
- consulting         # Conseil, audit, stratégie
- freelance_platform # Freelances, missions, talents
\`\`\`

## GÉNÉRATION D'ARCHITECTURE ADAPTÉE

\`\`\`yaml
# ARCHITECTURE APP
metadata:
  name: [nom intelligent et mémorable]
  domain: [domaine exact de la liste ci-dessus]
  scope: [landing|dashboard|full_app|platform]
  platform: [web|mobile|desktop|pwa]
  users: [description précise des utilisateurs]
  problem_solved: [le problème résolu clairement]
  value_proposition: [la promesse unique]

pages_structure:
  # SI scope = landing (5-8 pages marketing)
  # SI scope = dashboard (10-15 pages app)
  # SI scope = full_app (15-25 pages)
  # SI scope = platform (25+ pages multi-acteurs)
  
  public:
    - path: /
      name: [Nom explicite]
      purpose: [Objectif précis]
      priority: high|medium|low
    # Continue avec TOUTES les pages nécessaires

interactions:
  # Interactions SPÉCIFIQUES au domaine
  - type: [gamification|realtime|collaboration|automation]
    elements: [liste précise des éléments]
    wow_factor: [ce qui impressionnera]

data_schema:
  # Entités RÉALISTES pour ce domaine
  entities:
    - name: [Entity]
      fields: [champs pertinents]
      sample_count: [nombre d'exemples à générer]
  
  sample_data:
    # Données ULTRA-RÉALISTES du secteur
    - entity: [Entity]
      examples:
        - [exemple 1 crédible et détaillé]
        - [exemple 2 différent et réaliste]
        - [exemple 3 varié]

design_spec:
  # Style adapté au domaine ET aux users
  mood: [playful|professional|minimal|bold|elegant|technical|medical|luxurious]
  primary: "#[hex approprié au secteur]"
  secondary: "#[hex complémentaire]"
  accent: "#[hex pour CTAs]"
  
  visual_style:
    - animations: [subtle|moderate|rich|dramatic]
    - spacing: [compact|comfortable|spacious]
    - corners: [sharp|rounded|pill]
    - shadows: [none|subtle|prominent|dramatic]
    - gradients: [none|subtle|vibrant|animated]

special_features:
  # 3-5 features "WOW" spécifiques au domaine
  - name: [Feature innovante contextuelle]
    description: [Comment ça marche]
    impact: [Pourquoi c'est impressionnant]

technical_requirements:
  # Spécificités techniques si mentionnées
  - responsive: [mobile_first|desktop_first|adaptive]
  - theme: [light_only|dark_only|both|auto]
  - accessibility: [basic|AA|AAA]
  - seo: [basic|optimized|critical]
  - performance: [standard|optimized|critical]
\`\`\`

## RÈGLES D'ANTICIPATION

1. **Si "landing" dans le prompt** → scope: landing (5-8 pages max)
2. **Si "dashboard" dans le prompt** → scope: dashboard (focus interface)
3. **Si "app" ou "plateforme"** → scope: full_app ou platform
4. **Si domaine ambigu** → choisir le plus proche et adapter
5. **Si features non mentionnées** → ajouter 3 wow_features du secteur
6. **Si design non précisé** → déduire du domaine et des users

NE GÉNÈRE QUE LE YAML. Sois EXHAUSTIF sur les pages et les features.`;
}

export function parseArchitectureResponse(response: string): AppArchitecture {
  try {
    // Nettoyer la réponse pour extraire le YAML
    let yamlContent = response;
    
    // Supprimer les marqueurs de code markdown si présents
    yamlContent = yamlContent.replace(/```yaml\n?/g, '').replace(/```\n?/g, '');
    
    // Extraire les sections principales via regex pour parsing manuel
    // Car nous n'avons pas de parser YAML, on fait du parsing manuel simple
    
    const extractSection = (content: string, sectionName: string) => {
      const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n\\w+:|$)`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : '';
    };

    // Extraire les métadonnées
    const metadataSection = extractSection(yamlContent, 'metadata');
    const nameMatch = metadataSection.match(/name:\\s*(.+)/);
    const domainMatch = metadataSection.match(/domain:\\s*(.+)/);
    const scopeMatch = metadataSection.match(/scope:\\s*(.+)/);
    const platformMatch = metadataSection.match(/platform:\\s*(.+)/);
    const usersMatch = metadataSection.match(/users:\\s*(.+)/);
    const problemMatch = metadataSection.match(/problem_solved:\\s*(.+)/);
    const valueMatch = metadataSection.match(/value_proposition:\\s*(.+)/);

    // Extraire la structure des pages (parsing basique)
    const pagesSection = extractSection(yamlContent, 'pages_structure');
    const pathMatches = pagesSection.match(/path:\\s*(.+)/g) || [];
    const nameMatches = pagesSection.match(/name:\\s*(.+)/g) || [];
    const purposeMatches = pagesSection.match(/purpose:\\s*(.+)/g) || [];
    
    const fileStructure = pathMatches.map((pathMatch, index) => {
      const path = pathMatch.replace('path:', '').trim();
      const name = nameMatches[index] ? nameMatches[index].replace('name:', '').trim() : 'Page';
      const purpose = purposeMatches[index] ? purposeMatches[index].replace('purpose:', '').trim() : 'Page component';
      
      return {
        path: path.startsWith('/') ? `pages${path}.tsx` : `pages/${path}.tsx`,
        type: 'file' as const,
        description: `${name}: ${purpose}`
      };
    });

    // Extraire les technologies (déduction basique)
    const techStack = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'];
    if (response.includes('dashboard') || response.includes('analytics')) {
      techStack.push('Chart.js', 'Recharts');
    }
    if (response.includes('realtime') || response.includes('chat')) {
      techStack.push('Socket.io', 'WebSockets');
    }
    if (response.includes('payment') || response.includes('fintech')) {
      techStack.push('Stripe', 'Payment APIs');
    }

    // Construire l'architecture
    const architecture: AppArchitecture = {
      projectName: nameMatch ? nameMatch[1].trim() : 'Generated App',
      description: problemMatch ? problemMatch[1].trim() : 'AI Generated Application',
      techStack,
      fileStructure: [
        { path: 'app/', type: 'directory', description: 'Next.js app directory' },
        { path: 'app/layout.tsx', type: 'file', description: 'Root layout with navigation' },
        { path: 'app/page.tsx', type: 'file', description: 'Homepage with hero section' },
        { path: 'app/globals.css', type: 'file', description: 'Global styles with animations' },
        { path: 'components/', type: 'directory', description: 'Reusable UI components' },
        { path: 'components/ui/', type: 'directory', description: 'Premium UI components' },
        { path: 'lib/', type: 'directory', description: 'Utility functions and helpers' },
        ...fileStructure
      ],
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.4.0',
        '@types/react': '^18.0.0',
        '@types/node': '^20.0.0',
        'lucide-react': '^0.344.0'
      },
      scripts: {
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint',
        'type-check': 'tsc --noEmit'
      }
    };

    return architecture;

  } catch (error) {
    console.warn('Erreur parsing architecture, utilisation de la structure par défaut:', error);
    
    // Structure par défaut en cas d'erreur
    return {
      projectName: 'Generated App',
      description: 'AI Generated Application with Premium Features',
      techStack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      fileStructure: [
        { path: 'app/', type: 'directory', description: 'Next.js app directory' },
        { path: 'app/layout.tsx', type: 'file', description: 'Root layout' },
        { path: 'app/page.tsx', type: 'file', description: 'Homepage' },
        { path: 'app/globals.css', type: 'file', description: 'Global styles' },
        { path: 'components/ui/', type: 'directory', description: 'UI components' }
      ],
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.4.0'
      },
      scripts: {
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start'
      }
    };
  }
}