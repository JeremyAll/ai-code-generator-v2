import { Logger } from '../utils/logger.js';
import { Project, ProjectFilters, ProjectSortOptions, ProjectStats, ProjectHistoryEntry } from '../types/project.js';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectManager {
  private logger: Logger;
  private projectsPath: string;
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.logger = new Logger();
    this.projectsPath = path.join(process.cwd(), 'data', 'projects');
    this.ensureProjectsDir();
    this.loadProjects();
  }

  private ensureProjectsDir(): void {
    if (!fs.existsSync(this.projectsPath)) {
      fs.mkdirSync(this.projectsPath, { recursive: true });
      this.logger.log('INFO', 'Projects directory created');
    }
  }

  private loadProjects(): void {
    try {
      const projectsFile = path.join(this.projectsPath, 'projects.json');
      if (fs.existsSync(projectsFile)) {
        const data = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'));
        
        // Reconstruction des objets Project avec types corrects
        for (const [id, projectData] of Object.entries(data)) {
          const project = this.deserializeProject(projectData as any);
          this.projects.set(id, project);
        }
        
        this.logger.log('INFO', `Loaded ${this.projects.size} projects`);
      } else {
        this.logger.log('INFO', 'No existing projects found');
      }
    } catch (error) {
      this.logger.log('ERROR', 'Failed to load projects', error);
    }
  }

  private saveProjects(): void {
    try {
      const projectsFile = path.join(this.projectsPath, 'projects.json');
      const serializedProjects: Record<string, any> = {};
      
      for (const [id, project] of this.projects) {
        serializedProjects[id] = this.serializeProject(project);
      }
      
      fs.writeFileSync(projectsFile, JSON.stringify(serializedProjects, null, 2));
      this.logger.log('INFO', `Saved ${this.projects.size} projects`);
    } catch (error) {
      this.logger.log('ERROR', 'Failed to save projects', error);
    }
  }

  private serializeProject(project: Project): any {
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      generatedFiles: Array.from(project.generatedFiles.entries()),
      history: project.history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      }))
    };
  }

  private deserializeProject(data: any): Project {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      generatedFiles: new Map(data.generatedFiles || []),
      history: (data.history || []).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }))
    };
  }

  /**
   * Crée un nouveau projet
   */
  async createProject(input: {
    name: string;
    description: string;
    type: Project['type'];
    scope: Project['scope'];
    template?: Project['template'];
    techStack: Project['techStack'];
    originalPrompt: string;
    enrichedPrompt?: string;
    userId?: string;
  }): Promise<Project> {
    const project: Project = {
      id: this.generateProjectId(),
      name: input.name,
      description: input.description,
      type: input.type,
      scope: input.scope,
      template: input.template,
      techStack: input.techStack,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      
      status: 'draft',
      progress: 0,
      currentStep: 'initialized',
      
      files: {
        total: 0,
        generated: 0,
        cached: 0
      },
      
      metrics: {
        tokensUsed: 0,
        tokensSaved: 0,
        creditsUsed: 0,
        estimatedCostWithoutOptim: 0,
        actualCost: 0,
        savingsPercent: 0
      },
      
      originalPrompt: input.originalPrompt,
      enrichedPrompt: input.enrichedPrompt,
      generatedFiles: new Map(),
      
      tags: this.generateAutoTags(input),
      
      sharing: {
        isPublic: false,
        deployed: false
      },
      
      userId: input.userId,
      
      history: [{
        id: this.generateHistoryId(),
        timestamp: new Date(),
        action: 'created',
        description: 'Project initialized',
        metadata: { template: input.template }
      }]
    };

    this.projects.set(project.id, project);
    this.saveProjects();
    
    this.logger.log('INFO', `Created project: ${project.name} (${project.id})`);
    return project;
  }

  /**
   * Met à jour un projet existant
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    const updatedProject: Project = {
      ...project,
      ...updates,
      updatedAt: new Date(),
      history: [
        ...project.history,
        {
          id: this.generateHistoryId(),
          timestamp: new Date(),
          action: 'modified',
          description: 'Project updated',
          metadata: updates
        }
      ]
    };

    this.projects.set(id, updatedProject);
    this.saveProjects();
    
    this.logger.log('INFO', `Updated project: ${id}`);
    return updatedProject;
  }

  /**
   * Met à jour le statut de génération
   */
  async updateGenerationStatus(id: string, status: {
    status: Project['status'];
    progress: number;
    currentStep: string;
    files?: Project['files'];
    metrics?: Partial<Project['metrics']>;
    generatedFiles?: Map<string, string>;
  }): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    const updates: Partial<Project> = {
      status: status.status,
      progress: status.progress,
      currentStep: status.currentStep,
      updatedAt: new Date()
    };

    if (status.files) {
      updates.files = status.files;
    }

    if (status.metrics) {
      updates.metrics = { ...project.metrics, ...status.metrics };
    }

    if (status.generatedFiles) {
      updates.generatedFiles = status.generatedFiles;
    }

    // Ajout à l'historique
    const historyEntry: ProjectHistoryEntry = {
      id: this.generateHistoryId(),
      timestamp: new Date(),
      action: status.status === 'ready' ? 'generated' : 'modified',
      description: `Generation ${status.status}: ${status.currentStep}`,
      metadata: { progress: status.progress, step: status.currentStep }
    };

    updates.history = [...project.history, historyEntry];

    return this.updateProject(id, updates);
  }

  /**
   * Récupère un projet par ID
   */
  getProject(id: string): Project | null {
    return this.projects.get(id) || null;
  }

  /**
   * Liste tous les projets avec filtres et tri
   */
  listProjects(
    filters: ProjectFilters = {},
    sort: ProjectSortOptions = { field: 'updatedAt', direction: 'desc' },
    limit?: number,
    offset: number = 0
  ): Project[] {
    let projects = Array.from(this.projects.values());

    // Application des filtres
    if (filters.type) {
      projects = projects.filter(p => p.type === filters.type);
    }

    if (filters.template) {
      projects = projects.filter(p => p.template === filters.template);
    }

    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }

    if (filters.tags && filters.tags.length > 0) {
      projects = projects.filter(p => 
        filters.tags!.some(tag => p.tags.includes(tag))
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.originalPrompt.toLowerCase().includes(searchLower)
      );
    }

    if (filters.dateRange) {
      projects = projects.filter(p => 
        p.createdAt >= filters.dateRange!.start &&
        p.createdAt <= filters.dateRange!.end
      );
    }

    // Tri
    projects.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle nested properties
      if (sort.field === 'tokensUsed') {
        aValue = a.metrics.tokensUsed;
        bValue = b.metrics.tokensUsed;
      } else if (sort.field === 'creditsUsed') {
        aValue = a.metrics.creditsUsed;
        bValue = b.metrics.creditsUsed;
      } else {
        aValue = a[sort.field as keyof Project];
        bValue = b[sort.field as keyof Project];
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Pagination
    if (offset > 0) {
      projects = projects.slice(offset);
    }

    if (limit && limit > 0) {
      projects = projects.slice(0, limit);
    }

    return projects;
  }

  /**
   * Supprime un projet
   */
  async deleteProject(id: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project) {
      return false;
    }

    this.projects.delete(id);
    this.saveProjects();
    
    this.logger.log('INFO', `Deleted project: ${project.name} (${id})`);
    return true;
  }

  /**
   * Duplique un projet
   */
  async duplicateProject(id: string, newName?: string): Promise<Project> {
    const original = this.projects.get(id);
    if (!original) {
      throw new Error(`Project not found: ${id}`);
    }

    const duplicate = await this.createProject({
      name: newName || `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      scope: original.scope,
      template: original.template,
      techStack: original.techStack,
      originalPrompt: original.originalPrompt,
      enrichedPrompt: original.enrichedPrompt,
      userId: original.userId
    });

    this.logger.log('INFO', `Duplicated project: ${original.name} → ${duplicate.name}`);
    return duplicate;
  }

  /**
   * Génère des statistiques globales
   */
  getStats(): ProjectStats {
    const projects = Array.from(this.projects.values());
    
    const stats: ProjectStats = {
      total: projects.length,
      byStatus: {} as Record<Project['status'], number>,
      byType: {} as Record<Project['type'], number>,
      byTemplate: {},
      totalTokensSaved: 0,
      totalCreditsUsed: 0,
      averageSavings: 0,
      mostUsedTemplate: ''
    };

    // Compteurs
    const templateCounts = new Map<string, number>();
    let totalSavings = 0;
    let projectsWithSavings = 0;

    for (const project of projects) {
      // Par statut
      stats.byStatus[project.status] = (stats.byStatus[project.status] || 0) + 1;
      
      // Par type
      stats.byType[project.type] = (stats.byType[project.type] || 0) + 1;
      
      // Par template
      if (project.template) {
        const count = templateCounts.get(project.template) || 0;
        templateCounts.set(project.template, count + 1);
      }
      
      // Métriques
      stats.totalTokensSaved += project.metrics.tokensSaved;
      stats.totalCreditsUsed += project.metrics.creditsUsed;
      
      if (project.metrics.savingsPercent > 0) {
        totalSavings += project.metrics.savingsPercent;
        projectsWithSavings++;
      }
    }

    // Template le plus utilisé
    let maxCount = 0;
    for (const [template, count] of templateCounts) {
      stats.byTemplate[template] = count;
      if (count > maxCount) {
        maxCount = count;
        stats.mostUsedTemplate = template;
      }
    }

    // Moyenne des économies
    stats.averageSavings = projectsWithSavings > 0 ? totalSavings / projectsWithSavings : 0;

    return stats;
  }

  private generateProjectId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  private generateAutoTags(input: {
    type: Project['type'];
    template?: Project['template'];
    techStack: Project['techStack'];
  }): string[] {
    const tags: string[] = [];
    
    // Tags basés sur le type
    tags.push(input.type);
    
    // Tags basés sur le template
    if (input.template) {
      tags.push(input.template);
      
      // Tags spécifiques aux templates
      if (input.template.includes('clone')) {
        tags.push('clone', 'saas');
      }
    }
    
    // Tags techniques
    tags.push(input.techStack.framework);
    tags.push(input.techStack.style);
    
    if (input.techStack.hasImages) {
      tags.push('images');
    }

    return [...new Set(tags)]; // Suppression des doublons
  }
}