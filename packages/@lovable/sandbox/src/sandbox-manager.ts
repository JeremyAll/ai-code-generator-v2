import { WebContainerService } from './webcontainer-service.js';

export class SandboxManager {
  private containers: Map<string, WebContainerService> = new Map();
  
  async createSandbox(id: string, files: Map<string, string>) {
    console.log(`📦 Creating sandbox: ${id}`);
    
    // Créer nouveau container
    const container = new WebContainerService();
    this.containers.set(id, container);
    
    // Boot et setup
    await container.boot();
    await container.writeFiles(files);
    await container.installDependencies();
    
    // Démarrer le serveur
    const devProcess = await container.startDevServer();
    const previewUrl = await container.getPreviewUrl();
    
    return {
      id,
      previewUrl,
      container,
      devProcess
    };
  }
  
  async updateSandbox(id: string, files: Map<string, string>) {
    const container = this.containers.get(id);
    if (!container) throw new Error(`Sandbox ${id} not found`);
    
    await container.writeFiles(files);
    // Hot reload automatique avec Vite
  }
  
  async destroySandbox(id: string) {
    const container = this.containers.get(id);
    if (container) {
      // Cleanup
      this.containers.delete(id);
    }
  }
}