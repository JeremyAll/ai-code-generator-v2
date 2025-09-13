/**
 * TRACKER D'ÉVOLUTION - Pour ne pas oublier les améliorations
 */

export const EVOLUTION_PLAN = {
  PHASE_1: {
    status: 'IN_PROGRESS',
    features: [
      '✅ Domain detection basique',
      '✅ 2 prompts (ecommerce, saas)',
      '✅ Validation simple',
      '✅ 1 retry',
      '✅ Cache mémoire simple'
    ]
  },
  
  PHASE_2: {
    status: 'TODO',
    plannedDate: 'Semaine 2',
    features: [
      '⏳ 4 domaines (+ landing, dashboard)',
      '⏳ Chain of thought',
      '⏳ Few-shot examples',
      '⏳ Cache LRU',
      '⏳ Quality enhancement si < 7/10'
    ]
  },
  
  PHASE_3: {
    status: 'TODO',
    plannedDate: 'Mois 2',
    features: [
      '⏳ 8+ domaines',
      '⏳ Cache sémantique',
      '⏳ Métriques complètes',
      '⏳ A/B testing prompts',
      '⏳ Auto-optimization'
    ]
  }
};

// Fonction pour logger où on en est
export function checkEvolution() {
  console.log('📊 BAML System Evolution Status:');
  Object.entries(EVOLUTION_PLAN).forEach(([phase, info]) => {
    console.log(`\n${phase}: ${(info as any).status}`);
    (info as any).features.forEach((f: string) => console.log(`  ${f}`));
  });
}

export function markPhaseComplete(phase: 'PHASE_1' | 'PHASE_2' | 'PHASE_3') {
  (EVOLUTION_PLAN[phase] as any).status = 'COMPLETED';
  console.log(`✅ ${phase} marked as COMPLETED!`);
}

export function getPhaseStatus(phase: 'PHASE_1' | 'PHASE_2' | 'PHASE_3'): string {
  return (EVOLUTION_PLAN[phase] as any).status;
}