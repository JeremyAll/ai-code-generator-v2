/**
 * Domain Detector - Version Simple
 * 
 * PHASE 1: Keywords matching
 * PHASE 2: Ajouter scoring pondéré
 * PHASE 3: Ajouter détection par IA
 */

export class DomainDetector {
  private keywords = {
    ecommerce: ['shop', 'store', 'product', 'cart', 'buy', 'sell', 'ecommerce', 'marketplace', 'retail'],
    saas: ['saas', 'dashboard', 'subscription', 'platform', 'management', 'software', 'service'],
    landing: ['landing', 'marketing', 'promotion', 'startup', 'homepage', 'website', 'launch', 'waitlist', 'coming soon', 'beta'],
    dashboard: ['dashboard', 'analytics', 'metrics', 'charts', 'data', 'reporting', 'insights']
  };
  
  detect(prompt: string): string {
    const lower = prompt.toLowerCase();
    
    // Simple scoring
    const scores = Object.entries(this.keywords).map(([domain, words]) => {
      const score = words.filter(w => lower.includes(w)).length;
      return { domain, score };
    });
    
    // Get highest score
    const best = scores.reduce((a, b) => a.score > b.score ? a : b);
    
    // Default to landing if no clear match
    return best.score > 0 ? best.domain : 'landing';
  }
  
  // PHASE 1: Méthode pour debug
  getScores(prompt: string): Record<string, number> {
    const lower = prompt.toLowerCase();
    const scores: Record<string, number> = {};
    
    Object.entries(this.keywords).forEach(([domain, words]) => {
      scores[domain] = words.filter(w => lower.includes(w)).length;
    });
    
    return scores;
  }
  
  // TODO PHASE 2: Ajouter getProbabilities() pour avoir tous les scores
  // TODO PHASE 3: Ajouter detectWithAI() pour cas ambigus
}