import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

export class DockerSandbox {
  async createContainer(id: string, files: Map<string, string>) {
    // Fallback vers Docker si WebContainers échoue
    const tempDir = path.join(process.cwd(), 'temp-sandboxes', id);
    await fs.ensureDir(tempDir);
    
    // Écrire les fichiers
    for (const [filePath, content] of files) {
      const fullPath = path.join(tempDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content);
    }
    
    // Docker run
    const dockerProcess = spawn('docker', [
      'run', '-d',
      '-p', '3000:3000',
      '-v', `${tempDir}:/app`,
      'node:20-alpine',
      'sh', '-c', 'cd /app && npm install && npm run dev'
    ]);
    
    return {
      id,
      process: dockerProcess,
      url: 'http://localhost:3000'
    };
  }
}