import { supabase, ApiResponse, StorageError, FileUploadOptions } from './supabase-client';
import { authService } from './auth-service';

export interface UploadResult {
  path: string;
  publicUrl: string;
  fullPath: string;
}

export interface FileInfo {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export interface StorageConfig {
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
  bucketName: string;
}

export class StorageService {
  private readonly configs: Record<string, StorageConfig> = {
    'project-files': {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: ['text/html', 'text/css', 'application/javascript', 'text/typescript', 'application/json', 'text/plain'],
      bucketName: 'project-files'
    },
    'images': {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      bucketName: 'images'
    },
    'templates': {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: ['application/zip', 'application/x-zip-compressed'],
      bucketName: 'templates'
    },
    'assets': {
      maxFileSize: 25 * 1024 * 1024, // 25MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'text/css', 'application/javascript'],
      bucketName: 'assets'
    }
  };

  /**
   * Upload project files to storage
   */
  async uploadProjectFiles(
    projectId: string, 
    files: Map<string, string>
  ): Promise<ApiResponse<Map<string, UploadResult>>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const uploads = new Map<string, UploadResult>();
      const errors: string[] = [];

      for (const [filename, content] of files.entries()) {
        try {
          const path = `projects/${projectId}/${filename}`;
          const contentType = this.getContentType(filename);
          
          // Validate file
          this.validateFile(filename, content, 'project-files');

          // Upload file
          const { data, error } = await supabase.storage
            .from('project-files')
            .upload(path, new Blob([content]), {
              contentType,
              upsert: true,
              cacheControl: '3600'
            });

          if (error) {
            throw error;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(path);

          uploads.set(filename, {
            path: data.path,
            publicUrl,
            fullPath: data.fullPath
          });

        } catch (error) {
          errors.push(`Failed to upload ${filename}: ${(error as Error).message}`);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Upload errors: ${errors.join(', ')}`);
      }

      return {
        data: uploads,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Download project files from storage
   */
  async downloadProjectFiles(projectId: string): Promise<ApiResponse<Map<string, string>>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      // List files in the project directory
      const { data: fileList, error: listError } = await supabase.storage
        .from('project-files')
        .list(`projects/${projectId}`, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        throw listError;
      }

      const files = new Map<string, string>();
      const errors: string[] = [];

      for (const file of fileList || []) {
        try {
          const { data, error } = await supabase.storage
            .from('project-files')
            .download(`projects/${projectId}/${file.name}`);

          if (error) {
            errors.push(`Failed to download ${file.name}: ${error.message}`);
            continue;
          }

          const text = await data.text();
          files.set(file.name, text);

        } catch (error) {
          errors.push(`Failed to process ${file.name}: ${(error as Error).message}`);
        }
      }

      // Log errors but don't fail completely
      if (errors.length > 0) {
        console.warn('Download warnings:', errors);
      }

      return {
        data: files,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Upload an image file
   */
  async uploadImage(file: File, folder: string = 'uploads'): Promise<ApiResponse<UploadResult>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      // Validate file
      this.validateFileObject(file, 'images');

      // Generate unique filename
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const path = `${folder}/${uniqueFilename}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from('images')
        .upload(path, file, {
          cacheControl: '31536000', // 1 year
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(path);

      return {
        data: {
          path: data.path,
          publicUrl,
          fullPath: data.fullPath
        },
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(files: File[], folder: string = 'uploads'): Promise<ApiResponse<UploadResult[]>> {
    try {
      const results: UploadResult[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const result = await this.uploadImage(file, folder);
        
        if (result.data) {
          results.push(result.data);
        } else {
          errors.push(`Failed to upload ${file.name}: ${result.error?.message}`);
        }
      }

      if (errors.length > 0 && results.length === 0) {
        throw new Error(`All uploads failed: ${errors.join(', ')}`);
      }

      return {
        data: results,
        error: errors.length > 0 ? new Error(`Some uploads failed: ${errors.join(', ')}`) : null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<ApiResponse<void>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

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
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Delete all files in a project directory
   */
  async deleteProjectFiles(projectId: string): Promise<ApiResponse<void>> {
    try {
      const user = await authService.getUser();
      if (!user.data) {
        throw new Error('Not authenticated');
      }

      // List all files in the project directory
      const { data: fileList, error: listError } = await supabase.storage
        .from('project-files')
        .list(`projects/${projectId}`);

      if (listError) {
        throw listError;
      }

      if (!fileList || fileList.length === 0) {
        return {
          data: null,
          error: null,
          status: 'success'
        };
      }

      // Delete all files
      const filePaths = fileList.map(file => `projects/${projectId}/${file.name}`);
      const { error } = await supabase.storage
        .from('project-files')
        .remove(filePaths);

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
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(bucket: string, path: string): Promise<ApiResponse<FileInfo>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      if (error) {
        throw error;
      }

      const fileInfo = data?.[0];
      if (!fileInfo) {
        throw new Error('File not found');
      }

      return {
        data: fileInfo as FileInfo,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Create a signed URL for temporary access
   */
  async createSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600
  ): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return {
        data: data.signedUrl,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Copy files from one location to another
   */
  async copyFile(
    fromBucket: string,
    fromPath: string,
    toBucket: string,
    toPath: string
  ): Promise<ApiResponse<UploadResult>> {
    try {
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(fromBucket)
        .download(fromPath);

      if (downloadError) {
        throw downloadError;
      }

      // Upload to new location
      const { data, error: uploadError } = await supabase.storage
        .from(toBucket)
        .upload(toPath, fileData, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(toBucket)
        .getPublicUrl(toPath);

      return {
        data: {
          path: data.path,
          publicUrl,
          fullPath: data.fullPath
        },
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as StorageError,
        status: 'error'
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(userId?: string): Promise<ApiResponse<{
    totalFiles: number;
    totalSize: number;
    bucketUsage: Record<string, { files: number; size: number }>;
  }>> {
    try {
      const currentUser = userId ? { data: { id: userId } } : await authService.getUser();
      if (!currentUser.data) {
        throw new Error('Not authenticated');
      }

      const bucketUsage: Record<string, { files: number; size: number }> = {};
      let totalFiles = 0;
      let totalSize = 0;

      // Check each bucket
      for (const [bucketName] of Object.entries(this.configs)) {
        try {
          const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 1000 });

          if (!error && files) {
            const bucketSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
            bucketUsage[bucketName] = {
              files: files.length,
              size: bucketSize
            };
            totalFiles += files.length;
            totalSize += bucketSize;
          }
        } catch {
          // Skip buckets that user doesn't have access to
          bucketUsage[bucketName] = { files: 0, size: 0 };
        }
      }

      return {
        data: {
          totalFiles,
          totalSize,
          bucketUsage
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

  // Private helper methods
  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'mjs': 'application/javascript',
      'jsx': 'application/javascript',
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'json': 'application/json',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'xml': 'application/xml',
      'svg': 'image/svg+xml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      'pdf': 'application/pdf',
      'zip': 'application/zip'
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private validateFile(filename: string, content: string, bucketType: keyof typeof this.configs): void {
    const config = this.configs[bucketType];
    if (!config) {
      throw new Error(`Unknown bucket type: ${bucketType}`);
    }

    // Check file size
    const size = new Blob([content]).size;
    if (size > config.maxFileSize) {
      throw new Error(`File ${filename} is too large. Max size: ${this.formatBytes(config.maxFileSize)}`);
    }

    // Check file type
    const contentType = this.getContentType(filename);
    if (!config.allowedFileTypes.includes(contentType)) {
      throw new Error(`File type not allowed: ${contentType}. Allowed types: ${config.allowedFileTypes.join(', ')}`);
    }
  }

  private validateFileObject(file: File, bucketType: keyof typeof this.configs): void {
    const config = this.configs[bucketType];
    if (!config) {
      throw new Error(`Unknown bucket type: ${bucketType}`);
    }

    // Check file size
    if (file.size > config.maxFileSize) {
      throw new Error(`File ${file.name} is too large. Max size: ${this.formatBytes(config.maxFileSize)}`);
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}. Allowed types: ${config.allowedFileTypes.join(', ')}`);
    }
  }

  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Create singleton instance
export const storageService = new StorageService();
export default StorageService;