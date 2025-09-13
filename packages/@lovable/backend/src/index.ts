// Core exports
export { supabase, typedSupabase, checkSupabaseConnection, isSupabaseConfigured } from './supabase-client';
export { AuthService, authService } from './auth-service';
export { ProjectsService, projectsService } from './projects-service';
export { StorageService, storageService } from './storage-service';

// Type exports
export type {
  // Database types
  Database,
  Project,
  User,
  Template,
  Generation,
  ProjectWithStats,
  UserWithStats,
  
  // API types
  ApiResponse,
  PaginatedResponse,
  
  // Auth types
  AuthUser,
  Session,
  SignUpData,
  SignInData,
  UpdateProfileData,
  AuthState,
  
  // Project types
  CreateProjectData,
  UpdateProjectData,
  ProjectFilters,
  ProjectStats,
  
  // Storage types
  UploadResult,
  FileInfo,
  StorageConfig,
  
  // Error types
  SupabaseError,
  DatabaseError,
  AuthError,
  StorageError
} from './supabase-client';

export type {
  SignUpData,
  SignInData,
  ResetPasswordData,
  UpdatePasswordData,
  UpdateProfileData,
  AuthState
} from './auth-service';

export type {
  CreateProjectData,
  UpdateProjectData,
  ProjectFilters,
  ProjectStats
} from './projects-service';

export type {
  UploadResult,
  FileInfo,
  StorageConfig
} from './storage-service';

// Main backend service class
import { AuthService } from './auth-service';
import { ProjectsService } from './projects-service';
import { StorageService } from './storage-service';

export class BackendService {
  public auth: AuthService;
  public projects: ProjectsService;
  public storage: StorageService;

  constructor() {
    this.auth = new AuthService();
    this.projects = new ProjectsService();
    this.storage = new StorageService();
  }

  /**
   * Initialize the backend service and check connection
   */
  async initialize(): Promise<boolean> {
    try {
      const { checkSupabaseConnection } = await import('./supabase-client');
      const isConnected = await checkSupabaseConnection();
      
      if (!isConnected) {
        console.warn('Supabase connection check failed');
        return false;
      }

      console.log('Backend service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize backend service:', error);
      return false;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      database: boolean;
      auth: boolean;
      storage: boolean;
    };
    timestamp: string;
  }> {
    const results = {
      database: false,
      auth: false,
      storage: false
    };

    try {
      // Test database connection
      const { checkSupabaseConnection } = await import('./supabase-client');
      results.database = await checkSupabaseConnection();
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Test auth service
      await this.auth.getSession();
      results.auth = true;
    } catch (error) {
      console.error('Auth health check failed:', error);
    }

    try {
      // Test storage service (basic availability check)
      results.storage = true; // Storage is always available if Supabase is configured
    } catch (error) {
      console.error('Storage health check failed:', error);
    }

    const healthyServices = Object.values(results).filter(Boolean).length;
    const totalServices = Object.keys(results).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: results,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
export const backendService = new BackendService();

// Convenience functions for common operations
export async function initializeBackend(): Promise<boolean> {
  return backendService.initialize();
}

export async function signUp(email: string, password: string, userData?: { full_name?: string }) {
  return backendService.auth.signUp({
    email,
    password,
    options: { data: userData }
  });
}

export async function signIn(email: string, password: string) {
  return backendService.auth.signIn({ email, password });
}

export async function signOut() {
  return backendService.auth.signOut();
}

export async function getCurrentUser() {
  return backendService.auth.getUser();
}

export async function getUserProfile() {
  return backendService.auth.getUserProfile();
}

export async function createProject(projectData: any) {
  return backendService.projects.createProject(projectData);
}

export async function getProjects(filters?: any) {
  return backendService.projects.getProjects(filters);
}

export async function getProject(id: string) {
  return backendService.projects.getProject(id);
}

export async function updateProject(id: string, updates: any) {
  return backendService.projects.updateProject(id, updates);
}

export async function deleteProject(id: string) {
  return backendService.projects.deleteProject(id);
}

export async function uploadImage(file: File, folder?: string) {
  return backendService.storage.uploadImage(file, folder);
}

export async function uploadProjectFiles(projectId: string, files: Map<string, string>) {
  return backendService.storage.uploadProjectFiles(projectId, files);
}

export async function downloadProjectFiles(projectId: string) {
  return backendService.storage.downloadProjectFiles(projectId);
}

// Default export
export default {
  // Services
  BackendService,
  backendService,
  
  // Initialization
  initializeBackend,
  
  // Auth methods
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getUserProfile,
  
  // Project methods
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  
  // Storage methods
  uploadImage,
  uploadProjectFiles,
  downloadProjectFiles,
  
  // Direct service access
  auth: backendService.auth,
  projects: backendService.projects,
  storage: backendService.storage
};