import { Logger } from '../utils/logger.js';

export class PromptCompressor {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger();
  }

  /**
   * Compression intelligente des prompts pour économiser tokens
   */
  compress(prompt: string): string {
    let compressed = prompt;
    
    // Phase 1: Remplacements verbaux -> abréviations techniques
    const verbalReplacements = [
      ['Génère une application complète avec', 'App avec'],
      ['Crée une application', 'App'],
      ['Développe les fichiers suivants', 'Fichiers:'],
      ['avec les fonctionnalités suivantes', 'Features:'],
      ['Implémente les composants', 'Composants:'],
      ['Ajoute les dépendances nécessaires', 'Deps:'],
      ['Utilise les meilleures pratiques', 'Best practices'],
      ['Assure-toi que le code soit', 'Code:'],
      ['responsive et accessible', 'responsive+a11y'],
      ['TypeScript strict mode', 'TS strict'],
      ['avec validation côté client et serveur', '+validation'],
      ['gestion d\'erreurs robuste', '+error handling'],
      ['animations fluides et modernes', '+animations'],
      ['optimisé pour les performances', '+perf optimized']
    ];

    // Phase 2: Structures répétitives -> formats abrégés  
    const structuralReplacements = [
      ['```json\\n{', '{'],
      ['```typescript\\n', ''],
      ['```tsx\\n', ''],
      ['```\\n', ''],
      ['FORMAT DE RÉPONSE:\\n- ', 'Format: '],
      ['IMPORTANT: ', '⚠️ '],
      ['ATTENTION: ', '⚠️ '],
      ['GÉNÉRER UNIQUEMENT', 'ONLY:'],
      ['avec le format suivant', 'format:']
    ];

    // Phase 3: Compression technique spécialisée
    const technicalReplacements = [
      ['Next.js 14 avec App Router', 'Next.js 14+App Router'],
      ['TypeScript strict mode activé', 'TS strict'],
      ['Tailwind CSS avec custom design system', 'Tailwind+design system'],
      ['Prisma avec PostgreSQL', 'Prisma+Postgres'],
      ['NextAuth.js v5 avec providers multiples', 'NextAuth v5'],
      ['shadcn/ui + Radix primitives', 'shadcn+Radix'],
      ['React Hook Form + Yup', 'RHF+Yup'],
      ['Redux Toolkit + RTK Query', 'RTK+Query']
    ];

    // Phase 4: Templates de code -> références
    const codeTemplateReplacements = [
      ['interface Props extends', 'interface Props:'],
      ['export default function', 'export function'],
      ['const [state, setState] = useState', 'const [state, set] = useState'],
      ['className="', 'cls="'],
      ['onClick={() => {', 'onClick={() =>'],
      ['useEffect\\(\\(\\) => \\{', 'useEffect(() =>']
    ];

    // Application séquentielle des compressions
    [verbalReplacements, structuralReplacements, technicalReplacements, codeTemplateReplacements]
      .forEach(replacements => {
        replacements.forEach(([from, to]) => {
          compressed = compressed.replace(new RegExp(from, 'g'), to);
        });
      });

    // Phase 5: Compression whitespace intelligente (garde la lisibilité)
    compressed = compressed
      .replace(/\n\n\n+/g, '\n\n') // Max 2 newlines
      .replace(/  +/g, ' ')        // Multiple spaces -> single
      .replace(/\n /g, '\n')       // Leading spaces après newline
      .trim();

    // Calcul des économies
    const originalTokens = this.estimateTokens(prompt);
    const compressedTokens = this.estimateTokens(compressed);
    const savings = ((originalTokens - compressedTokens) / originalTokens * 100).toFixed(1);

    this.logger.log('INFO', `Prompt compressed: ${originalTokens} → ${compressedTokens} tokens (${savings}% saved)`);

    return compressed;
  }

  /**
   * Estimation approximative du nombre de tokens
   * Règle: ~1 token = 4 caractères pour l'anglais, ~1 token = 3 caractères pour le français
   */
  private estimateTokens(text: string): number {
    // Détection langue approximative
    const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'avec', 'pour', 'une', 'un'].filter(word => 
      text.toLowerCase().includes(word)
    );
    const isFrench = frenchWords.length > 3;
    
    const avgCharsPerToken = isFrench ? 3 : 4;
    return Math.ceil(text.length / avgCharsPerToken);
  }

  /**
   * Compression spécifique aux prompts d'architecture (Step 1)
   */
  compressArchitecturePrompt(prompt: string): string {
    let compressed = this.compress(prompt);

    // Compressions spécifiques architecture
    const archReplacements = [
      ['générer l\'architecture de cette application au format YAML', 'Generate YAML architecture'],
      ['avec les sections suivantes:', 'Sections:'],
      ['- name: nom de l\'application', '- name'],
      ['- description: description courte', '- desc'],
      ['- framework: framework recommandé', '- framework'],
      ['- files: liste des fichiers principaux', '- files'],
      ['- dependencies: dépendances nécessaires', '- deps'],
      ['- structure: arborescence des dossiers', '- structure']
    ];

    archReplacements.forEach(([from, to]) => {
      compressed = compressed.replace(new RegExp(from, 'g'), to);
    });

    return compressed;
  }

  /**
   * Compression spécifique aux prompts de génération de code (Step 2)
   */
  compressCodePrompt(prompt: string, step: 'base' | 'components' | 'pages'): string {
    let compressed = this.compress(prompt);

    const codeReplacements: { [key: string]: [string, string][] } = {
      base: [
        ['GÉNÈRE UNIQUEMENT CES 4 FICHIERS DE BASE', 'Generate 4 base files:'],
        ['package.json avec toutes les dépendances', 'package.json+deps'],
        ['app/layout.tsx avec navigation de base', 'layout.tsx+nav'],
        ['app/page.tsx avec hero section simple', 'page.tsx+hero'],
        ['app/globals.css avec Tailwind et animations', 'globals.css+animations']
      ],
      components: [
        ['GÉNÈRE CES COMPOSANTS PREMIUM', 'Generate components:'],
        ['Bouton magnétique avec effet hover', 'Magnetic button+hover'],
        ['Card 3D avec perspective', '3D Card+perspective'],
        ['Compteur animé', 'Animated counter'],
        ['Section hero avec parallax', 'Hero+parallax']
      ],
      pages: [
        ['GÉNÈRE uniquement ces pages avec données réalistes', 'Generate pages+realistic data:'],
        ['créant les pages spécifiques', 'creating specific pages'],
        ['avec données réalistes et cohérentes', '+realistic data']
      ]
    };

    const replacements = codeReplacements[step] || [];
    replacements.forEach(([from, to]) => {
      compressed = compressed.replace(new RegExp(from, 'g'), to);
    });

    return compressed;
  }

  /**
   * Dictionnaire de composants fréquents pour références ultra-courtes
   */
  private getComponentShorthands(): Record<string, string> {
    return {
      'components/ui/Button.tsx': 'btn',
      'components/ui/Card.tsx': 'card', 
      'components/ui/Modal.tsx': 'modal',
      'components/ui/Form.tsx': 'form',
      'components/ui/Table.tsx': 'table',
      'components/ui/Navbar.tsx': 'nav',
      'components/ui/Footer.tsx': 'footer',
      'components/ui/Sidebar.tsx': 'sidebar',
      'app/layout.tsx': 'layout',
      'app/page.tsx': 'home',
      'app/globals.css': 'styles'
    };
  }

  /**
   * Statistiques de compression
   */
  getCompressionStats(originalPrompt: string, compressedPrompt: string) {
    const originalTokens = this.estimateTokens(originalPrompt);
    const compressedTokens = this.estimateTokens(compressedPrompt);
    const savings = originalTokens - compressedTokens;
    const percentage = (savings / originalTokens * 100).toFixed(1);

    return {
      originalLength: originalPrompt.length,
      compressedLength: compressedPrompt.length,
      originalTokens,
      compressedTokens,
      tokensSaved: savings,
      percentageSaved: percentage,
      costSavingsEstimate: (savings * 0.000015).toFixed(4) // $0.015 per 1K tokens Claude Sonnet
    };
  }
}