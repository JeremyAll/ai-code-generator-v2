import { WebContainer } from '@webcontainer/api';
import { EventEmitter } from 'events';

export class WebContainerService extends EventEmitter {
  private instance: WebContainer | null = null;
  private bootPromise: Promise<void> | null = null;
  
  async boot() {
    if (this.bootPromise) return this.bootPromise;
    
    this.bootPromise = this.initialize();
    return this.bootPromise;
  }
  
  private async initialize() {
    console.log('🚀 Booting WebContainer...');
    this.instance = await WebContainer.boot();
    console.log('✅ WebContainer ready!');
    
    // Mount file system
    await this.setupBaseEnvironment();
  }
  
  private async setupBaseEnvironment() {
    if (!this.instance) throw new Error('WebContainer not initialized');
    
    // Structure de base pour une app React/Vite
    const files = {
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'preview-app',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build'
            },
            dependencies: {
              'react': '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              'vite': '^5.0.0',
              '@vitejs/plugin-react': '^4.0.0'
            }
          }, null, 2)
        }
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
        }
      },
      'vite.config.js': {
        file: {
          contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
});`
        }
      }
    };
    
    await this.instance.mount(files);
  }
  
  async writeFiles(files: Map<string, string>) {
    if (!this.instance) throw new Error('WebContainer not initialized');
    
    for (const [path, content] of files) {
      await this.instance.fs.writeFile(path, content);
      this.emit('file-written', path);
    }
  }
  
  async installDependencies() {
    if (!this.instance) throw new Error('WebContainer not initialized');
    
    const installProcess = await this.instance.spawn('npm', ['install']);
    
    installProcess.output.pipeTo(new WritableStream({
      write: (data) => {
        console.log(data);
        this.emit('install-output', data);
      }
    }));
    
    const exitCode = await installProcess.exit;
    if (exitCode !== 0) throw new Error('Installation failed');
    
    return true;
  }
  
  async startDevServer() {
    if (!this.instance) throw new Error('WebContainer not initialized');
    
    const devProcess = await this.instance.spawn('npm', ['run', 'dev']);
    
    devProcess.output.pipeTo(new WritableStream({
      write: (data) => {
        console.log(data);
        this.emit('dev-output', data);
      }
    }));
    
    // Attendre que le serveur soit prêt
    this.instance.on('server-ready', (port, url) => {
      console.log(`✅ Dev server ready at ${url}`);
      this.emit('preview-ready', url);
    });
    
    return devProcess;
  }
  
  async getPreviewUrl(): Promise<string> {
    if (!this.instance) throw new Error('WebContainer not initialized');
    
    return new Promise((resolve) => {
      this.instance!.on('server-ready', (port, url) => {
        resolve(url);
      });
    });
  }
}