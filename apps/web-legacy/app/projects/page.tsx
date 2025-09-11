'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  type: 'webapp' | 'mobile' | 'dashboard' | 'landing' | 'ecommerce' | 'internal';
  template?: string;
  status: 'generating' | 'ready' | 'error' | 'draft';
  createdAt: string;
  updatedAt: string;
  progress: number;
  files: {
    total: number;
    generated: number;
    cached: number;
  };
  metrics: {
    tokensUsed: number;
    tokensSaved: number;
    creditsUsed: number;
    savingsPercent: number;
  };
  preview?: {
    thumbnail: string;
    primaryColor: string;
  };
  tags: string[];
}

interface ProjectStats {
  total: number;
  totalTokensSaved: number;
  totalCreditsUsed: number;
  averageSavings: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'credits'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Données simulées pour la démo
  useEffect(() => {
    // Simulation de chargement
    setTimeout(() => {
      setProjects([
        {
          id: 'proj_1',
          name: 'Lovable Clone Pro',
          description: 'Clone de Lovable avec fonctionnalités avancées et optimisations',
          type: 'webapp',
          template: 'lovable-clone',
          status: 'ready',
          createdAt: '2025-09-08T14:30:00Z',
          updatedAt: '2025-09-08T16:45:00Z',
          progress: 100,
          files: { total: 24, generated: 14, cached: 10 },
          metrics: { tokensUsed: 8500, tokensSaved: 6000, creditsUsed: 0.127, savingsPercent: 41.2 },
          preview: { thumbnail: '/api/placeholder/300x200', primaryColor: '#7c3aed' },
          tags: ['lovable-clone', 'webapp', 'nextjs', 'modern']
        },
        {
          id: 'proj_2', 
          name: 'Notion Workspace',
          description: 'Workspace collaboratif avec éditeur de blocs et base de données',
          type: 'webapp',
          template: 'notion-clone',
          status: 'ready',
          createdAt: '2025-09-07T09:15:00Z',
          updatedAt: '2025-09-07T11:30:00Z',
          progress: 100,
          files: { total: 18, generated: 12, cached: 6 },
          metrics: { tokensUsed: 7200, tokensSaved: 3600, creditsUsed: 0.108, savingsPercent: 33.3 },
          preview: { thumbnail: '/api/placeholder/300x200', primaryColor: '#3b82f6' },
          tags: ['notion-clone', 'webapp', 'collaboration', 'modern']
        },
        {
          id: 'proj_3',
          name: 'E-commerce Platform',
          description: 'Plateforme e-commerce avec admin dashboard et paiements Stripe',
          type: 'ecommerce',
          template: 'shopify-clone',
          status: 'generating',
          createdAt: '2025-09-09T08:00:00Z',
          updatedAt: '2025-09-09T10:15:00Z',
          progress: 67,
          files: { total: 32, generated: 21, cached: 11 },
          metrics: { tokensUsed: 12000, tokensSaved: 5500, creditsUsed: 0.18, savingsPercent: 31.4 },
          tags: ['shopify-clone', 'ecommerce', 'stripe', 'nextjs']
        },
        {
          id: 'proj_4',
          name: 'Analytics Dashboard',
          description: 'Dashboard analytics temps réel avec graphiques interactifs',
          type: 'dashboard',
          status: 'ready',
          createdAt: '2025-09-06T16:20:00Z',
          updatedAt: '2025-09-06T18:45:00Z',
          progress: 100,
          files: { total: 16, generated: 10, cached: 6 },
          metrics: { tokensUsed: 6800, tokensSaved: 4200, creditsUsed: 0.102, savingsPercent: 38.2 },
          preview: { thumbnail: '/api/placeholder/300x200', primaryColor: '#f59e0b' },
          tags: ['dashboard', 'analytics', 'charts', 'modern']
        },
        {
          id: 'proj_5',
          name: 'Design Tool Canvas',
          description: 'Outil de design collaboratif avec canvas infini',
          type: 'webapp',
          template: 'figma-clone',
          status: 'error',
          createdAt: '2025-09-05T11:10:00Z',
          updatedAt: '2025-09-05T11:45:00Z',
          progress: 23,
          files: { total: 28, generated: 6, cached: 0 },
          metrics: { tokensUsed: 3200, tokensSaved: 0, creditsUsed: 0.048, savingsPercent: 0 },
          tags: ['figma-clone', 'design', 'canvas', 'collaboration']
        }
      ]);

      setStats({
        total: 5,
        totalTokensSaved: 19300,
        totalCreditsUsed: 0.565,
        averageSavings: 28.8
      });

      setLoading(false);
    }, 1000);
  }, []);

  const filteredProjects = projects.filter(project => {
    if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && project.type !== filterType) return false;
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name': return a.name.localeCompare(b.name);
      case 'credits': return b.metrics.creditsUsed - a.metrics.creditsUsed;
      default: return 0;
    }
  });

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'ready': return 'text-green-400 bg-green-400/10';
      case 'generating': return 'text-blue-400 bg-blue-400/10';
      case 'error': return 'text-red-400 bg-red-400/10';
      case 'draft': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: Project['type']) => {
    switch (type) {
      case 'webapp': return '🌐';
      case 'mobile': return '📱';
      case 'dashboard': return '📊';
      case 'landing': return '🎨';
      case 'ecommerce': return '🛍️';
      case 'internal': return '🔧';
      default: return '💻';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
          <div className="text-gray-400">Chargement des projets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-xl border-b border-white/[0.08] z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 text-lg font-semibold hover:text-purple-400 transition-colors">
              <span>🚀</span>
              <span>AI App Generator</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/projects" className="text-purple-400 font-medium">
                Mes Projets
              </Link>
              <Link href="/templates" className="text-gray-400 hover:text-white transition-colors">
                Templates
              </Link>
            </nav>
          </div>
          <div className="text-gray-400 text-sm">
            2 crédits disponibles
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 pt-24 pb-8">
        {/* Header avec stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mes Projets</h1>
              <p className="text-gray-400">
                Gérez et accédez à tous vos projets générés
              </p>
            </div>
            <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
              + Nouveau Projet
            </Link>
          </div>

          {/* Stats globales */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Projets Totaux</div>
              </div>
              <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{stats.totalTokensSaved.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Tokens Économisés</div>
              </div>
              <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-400">{stats.totalCreditsUsed.toFixed(3)}</div>
                <div className="text-sm text-gray-400">Crédits Utilisés</div>
              </div>
              <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-4">
                <div className="text-2xl font-bold text-orange-400">{stats.averageSavings.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Économies Moyennes</div>
              </div>
            </div>
          )}
        </div>

        {/* Filtres et recherche */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Recherche */}
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Rechercher des projets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-600/30 focus:outline-none"
              />
            </div>

            {/* Filtres */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:border-purple-600/30 focus:outline-none"
            >
              <option value="all">Tous types</option>
              <option value="webapp">Web App</option>
              <option value="mobile">Mobile</option>
              <option value="dashboard">Dashboard</option>
              <option value="landing">Landing</option>
              <option value="ecommerce">E-commerce</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:border-purple-600/30 focus:outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="ready">Prêts</option>
              <option value="generating">En cours</option>
              <option value="error">Erreur</option>
              <option value="draft">Brouillons</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/[0.02] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:border-purple-600/30 focus:outline-none"
            >
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="name">Nom A-Z</option>
              <option value="credits">Coût décroissant</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-white/[0.08] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Projets */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-xl font-medium text-gray-400 mb-2">
              Aucun projet trouvé
            </div>
            <div className="text-gray-500 mb-6">
              {projects.length === 0 ? 'Commencez par créer votre premier projet' : 'Essayez de modifier vos filtres'}
            </div>
            <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
              Créer un Projet
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-[#111113] border border-white/[0.08] rounded-xl overflow-hidden hover:border-purple-600/30 transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Preview Image */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                  {project.preview ? (
                    <img
                      src={project.preview.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {getTypeIcon(project.type)}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status === 'ready' && 'Prêt'}
                    {project.status === 'generating' && 'Génération...'}
                    {project.status === 'error' && 'Erreur'}
                    {project.status === 'draft' && 'Brouillon'}
                  </div>

                  {/* Progress Bar pour génération en cours */}
                  {project.status === 'generating' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div 
                        className="h-full bg-purple-600 transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <span className="text-2xl ml-2">
                      {getTypeIcon(project.type)}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <div className="text-gray-400">Fichiers</div>
                      <div className="text-white font-medium">
                        {project.files.total} ({project.files.cached} cachés)
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Économies</div>
                      <div className="text-green-400 font-medium">
                        {project.metrics.savingsPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                    <div className="text-xs text-gray-500">
                      {formatDate(project.updatedAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-[#111113] border border-white/[0.08] rounded-xl p-6 hover:border-purple-600/30 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  {/* Preview Thumbnail */}
                  <div className="w-20 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                    {project.preview ? (
                      <img
                        src={project.preview.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {getTypeIcon(project.type)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status === 'ready' && 'Prêt'}
                        {project.status === 'generating' && 'Génération...'}
                        {project.status === 'error' && 'Erreur'}
                        {project.status === 'draft' && 'Brouillon'}
                      </span>
                      {project.template && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                          {project.template}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{project.description}</p>
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span>{project.files.total} fichiers</span>
                      <span>{project.metrics.creditsUsed.toFixed(3)} crédits</span>
                      <span className="text-green-400">-{project.metrics.savingsPercent.toFixed(1)}% économisé</span>
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress Bar pour génération en cours */}
                {project.status === 'generating' && (
                  <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}