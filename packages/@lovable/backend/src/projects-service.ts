import { supabase, typedSupabase, Project, ProjectWithStats, Generation, ApiResponse, PaginatedResponse } from './supabase-client';
import { authService } from './auth-service';

export interface CreateProjectData {
  name: string;
  description?: string;
  domain?: string;
  blueprint?: Record<string, any>;
  files?: Record<string, any>;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  domain?: string;
  blueprint?: Record<string, any>;
  files?: Record<string, any>;
  preview_url?: string;
  deployed_url?: string;
}

export interface ProjectFilters {
  domain?: string;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ProjectStats {
  total_projects: number;
  projects_this_month: number;
  avg_quality_score: number;
  most_used_domain: string;
}

export class ProjectsService {
  /**
   * Create a new project
   */
  async createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
    try {
      // Check if user is authenticated
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      // Check if user has sufficient credits
      const hasCredits = await authService.hasCredits(1);
      if (!hasCredits) {
        throw new Error('Insufficient credits');
      }

      // Create the project
      const { data: project, error } = await typedSupabase
        .from('projects')
        .insert({
          ...data,
          user_id: user.data.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Deduct credit using the database function
      await this.deductCredit(user.data.id, 1);

      // Log the generation
      await this.logGeneration({
        user_id: user.data.id,
        project_id: project.id,
        prompt: `Created project: ${data.name}`,
        domain: data.domain || null,
        tokens_used: null,
        quality_score: null
      });

      return {
        data: project,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Get all projects for the current user
   */
  async getProjects(filters: ProjectFilters = {}): Promise<ApiResponse<PaginatedResponse<Project>>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const {
        domain,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
        limit = 10,
        offset = 0
      } = filters;

      let query = typedSupabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('user_id', user.data.id);

      // Apply filters
      if (domain) {
        query = query.eq('domain', domain);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data: projects, error, count } = await query;

      if (error) {
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limit);
      const currentPage = Math.floor(offset / limit) + 1;

      return {
        data: {
          data: projects || [],
          count: count || 0,
          page: currentPage,
          limit,
          total_pages: totalPages
        },
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(id: string): Promise<ApiResponse<Project>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const { data: project, error } = await typedSupabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.data.id) // Ensure user owns the project
        .single();

      if (error) {
        throw error;
      }

      return {
        data: project,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Get project with statistics
   */
  async getProjectWithStats(id: string): Promise<ApiResponse<ProjectWithStats>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      // Get project data
      const { data: project, error: projectError } = await typedSupabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.data.id)
        .single();

      if (projectError) {
        throw projectError;
      }

      // Get generation statistics
      const { data: generations, error: genError } = await typedSupabase
        .from('generations')
        .select('created_at, quality_score')
        .eq('project_id', id);

      if (genError) {
        throw genError;
      }

      const generationCount = generations?.length || 0;
      const lastGenerated = generations && generations.length > 0
        ? generations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;
      
      const qualityScores = generations?.map(g => g.quality_score).filter(Boolean) || [];
      const avgQualityScore = qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : null;

      const projectWithStats: ProjectWithStats = {
        ...project,
        generation_count: generationCount,
        last_generated: lastGenerated,
        quality_score: avgQualityScore
      };

      return {
        data: projectWithStats,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Update a project
   */
  async updateProject(id: string, updates: UpdateProjectData): Promise<ApiResponse<Project>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const { data: project, error } = await typedSupabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.data.id) // Ensure user owns the project
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data: project,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const { error } = await typedSupabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.data.id); // Ensure user owns the project

      if (error) {
        throw error;
      }

      return {
        data: null,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(id: string, newName?: string): Promise<ApiResponse<Project>> {
    try {
      const { data: originalProject } = await this.getProject(id);
      if (!originalProject) {
        throw new Error('Project not found');
      }

      const duplicatedProject = await this.createProject({
        name: newName || `${originalProject.name} (Copy)`,
        description: originalProject.description || undefined,
        domain: originalProject.domain || undefined,
        blueprint: originalProject.blueprint || undefined,
        files: originalProject.files || undefined
      });

      return duplicatedProject;
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Get project statistics for the current user
   */
  async getProjectStats(): Promise<ApiResponse<ProjectStats>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      // Get total projects
      const { count: totalProjects } = await typedSupabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.data.id);

      // Get projects from this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: projectsThisMonth } = await typedSupabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.data.id)
        .gte('created_at', startOfMonth.toISOString());

      // Get average quality score
      const { data: generations } = await typedSupabase
        .from('generations')
        .select('quality_score')
        .eq('user_id', user.data.id)
        .not('quality_score', 'is', null);

      const qualityScores = generations?.map(g => g.quality_score).filter(Boolean) || [];
      const avgQualityScore = qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;

      // Get most used domain
      const { data: projects } = await typedSupabase
        .from('projects')
        .select('domain')
        .eq('user_id', user.data.id)
        .not('domain', 'is', null);

      const domainCounts: Record<string, number> = {};
      projects?.forEach(p => {
        if (p.domain) {
          domainCounts[p.domain] = (domainCounts[p.domain] || 0) + 1;
        }
      });

      const mostUsedDomain = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

      const stats: ProjectStats = {
        total_projects: totalProjects || 0,
        projects_this_month: projectsThisMonth || 0,
        avg_quality_score: Math.round(avgQualityScore),
        most_used_domain: mostUsedDomain
      };

      return {
        data: stats,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Search projects across all users (for admin/public features)
   */
  async searchPublicProjects(query: string, limit: number = 10): Promise<ApiResponse<Project[]>> {
    try {
      const { data: projects, error } = await typedSupabase
        .from('projects')
        .select('id, name, description, domain, thumbnail_url, created_at')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .not('deployed_url', 'is', null) // Only show deployed projects
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        data: projects || [],
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Get recent projects
   */
  async getRecentProjects(limit: number = 5): Promise<ApiResponse<Project[]>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const { data: projects, error } = await typedSupabase
        .from('projects')
        .select('*')
        .eq('user_id', user.data.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return {
        data: projects || [],
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  // Private helper methods
  private async deductCredit(userId: string, amount: number = 1): Promise<void> {
    const { error } = await typedSupabase.rpc('decrement_credits', {
      user_id: userId,
      amount
    });

    if (error) {
      throw new Error(`Failed to deduct credits: ${error.message}`);
    }
  }

  private async logGeneration(generation: Omit<Generation, 'id' | 'created_at'>): Promise<void> {
    try {
      await typedSupabase.from('generations').insert(generation);
    } catch (error) {
      console.error('Failed to log generation:', error);
      // Don't throw here to avoid breaking the main flow
    }
  }
}

// Create singleton instance
export const projectsService = new ProjectsService();
export default ProjectsService;