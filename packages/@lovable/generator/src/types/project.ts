export interface Project {
  id: string;
  name: string;
  description: string;
  
  // Template et type
  type: 'webapp' | 'mobile' | 'dashboard' | 'landing' | 'ecommerce' | 'internal';
  scope: 'complete' | 'mvp' | 'landing';
  template?: 'lovable-clone' | 'notion-clone' | 'figma-clone' | 'shopify-clone' | 'discord-clone' | 'analytics-saas';
  
  // Configuration technique
  techStack: {
    framework: string;
    style: string;
    hasImages: boolean;
  };
  
  // Métadonnées temporelles
  createdAt: Date;
  updatedAt: Date;
  
  // Statut et progression
  status: 'generating' | 'ready' | 'error' | 'draft';
  progress: number; // 0-100
  currentStep: string;
  
  // Contenu généré
  files: {
    total: number;
    generated: number;
    cached: number;
  };
  
  // Métriques économiques
  metrics: {
    tokensUsed: number;
    tokensSaved: number; // Grâce au cache
    creditsUsed: number;
    estimatedCostWithoutOptim: number;
    actualCost: number;
    savingsPercent: number;
  };
  
  // Contenu
  originalPrompt: string;
  enrichedPrompt?: string;
  generatedFiles: Map<string, string>;
  
  // Visuel
  preview?: {
    screenshot: string; // Base64 ou URL
    thumbnail: string; // Miniature pour grid
    primaryColor: string; // Couleur dominante détectée
  };
  
  // Tags automatiques
  tags: string[];
  
  // Partage et déploiement
  sharing: {
    isPublic: boolean;
    shareUrl?: string;
    deployUrl?: string;
    deployed: boolean;
  };
  
  // Utilisateur (pour future multi-user)
  userId?: string;
  
  // Historique des modifications
  history: ProjectHistoryEntry[];
}

export interface ProjectHistoryEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'generated' | 'modified' | 'deployed' | 'shared';
  description: string;
  metadata?: Record<string, any>;
}

export interface ProjectFilters {
  type?: Project['type'];
  template?: Project['template'];
  status?: Project['status'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  search?: string;
}

export interface ProjectSortOptions {
  field: 'createdAt' | 'updatedAt' | 'name' | 'tokensUsed' | 'creditsUsed';
  direction: 'asc' | 'desc';
}

export interface ProjectStats {
  total: number;
  byStatus: Record<Project['status'], number>;
  byType: Record<Project['type'], number>;
  byTemplate: Record<string, number>;
  totalTokensSaved: number;
  totalCreditsUsed: number;
  averageSavings: number;
  mostUsedTemplate: string;
}