import { Logger } from '../utils/logger.js';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  fullPage?: boolean;
  deviceScaleFactor?: number;
}

export interface ScreenshotResult {
  thumbnail: string; // Base64
  screenshot: string; // Base64
  primaryColor: string; // Couleur dominante extraite
  dimensions: {
    width: number;
    height: number;
  };
}

export class ScreenshotService {
  private logger: Logger;
  private screenshotsPath: string;

  constructor() {
    this.logger = new Logger();
    this.screenshotsPath = path.join(process.cwd(), 'data', 'screenshots');
    this.ensureScreenshotsDir();
  }

  private ensureScreenshotsDir(): void {
    if (!fs.existsSync(this.screenshotsPath)) {
      fs.mkdirSync(this.screenshotsPath, { recursive: true });
      this.logger.log('INFO', 'Screenshots directory created');
    }
  }

  /**
   * Capture screenshot d'une page générée
   */
  async captureFromHtml(
    htmlContent: string,
    cssContent: string = '',
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const {
      width = 1200,
      height = 800,
      quality = 90,
      format = 'png',
      fullPage = true,
      deviceScaleFactor = 1
    } = options;

    let browser;
    
    try {
      this.logger.log('INFO', 'Starting browser for screenshot capture');
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        defaultViewport: {
          width,
          height,
          deviceScaleFactor
        }
      });

      const page = await browser.newPage();
      
      // Construction du HTML complet
      const fullHtml = this.buildFullHtml(htmlContent, cssContent);
      
      await page.setContent(fullHtml, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Attente pour que les animations se chargent
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture screenshot principal
      const screenshotBuffer = await page.screenshot({
        type: format,
        quality: format === 'jpeg' ? quality : undefined,
        fullPage
      });

      // Capture thumbnail (réduit)
      await page.setViewport({
        width: 400,
        height: 300,
        deviceScaleFactor: 1
      });

      const thumbnailBuffer = await page.screenshot({
        type: format,
        quality: format === 'jpeg' ? 80 : undefined,
        fullPage: false
      });

      // Extraction couleur dominante
      const primaryColor = await this.extractPrimaryColor(page);

      // Dimensions finales
      const dimensions = { width, height };

      this.logger.log('INFO', 'Screenshot captured successfully');

      return {
        thumbnail: `data:image/${format};base64,${Buffer.from(thumbnailBuffer).toString('base64')}`,
        screenshot: `data:image/${format};base64,${Buffer.from(screenshotBuffer).toString('base64')}`,
        primaryColor,
        dimensions
      };

    } catch (error) {
      this.logger.log('ERROR', 'Screenshot capture failed', error);
      return this.createFallbackScreenshot(options);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Capture screenshot d'une URL
   */
  async captureFromUrl(
    url: string,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const {
      width = 1200,
      height = 800,
      quality = 90,
      format = 'png',
      fullPage = true,
      deviceScaleFactor = 1
    } = options;

    let browser;
    
    try {
      this.logger.log('INFO', `Capturing screenshot from URL: ${url}`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
          width,
          height,
          deviceScaleFactor
        }
      });

      const page = await browser.newPage();
      
      await page.goto(url, {
        waitUntil: ['networkidle2'],
        timeout: 30000
      });

      // Attente pour animations
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Screenshot principal
      const screenshotBuffer = await page.screenshot({
        type: format,
        quality: format === 'jpeg' ? quality : undefined,
        fullPage
      });

      // Thumbnail
      await page.setViewport({
        width: 400,
        height: 300,
        deviceScaleFactor: 1
      });

      const thumbnailBuffer = await page.screenshot({
        type: format,
        quality: format === 'jpeg' ? 80 : undefined,
        fullPage: false
      });

      // Couleur dominante
      const primaryColor = await this.extractPrimaryColor(page);

      const dimensions = { width, height };

      this.logger.log('INFO', 'URL screenshot captured successfully');

      return {
        thumbnail: `data:image/${format};base64,${Buffer.from(thumbnailBuffer).toString('base64')}`,
        screenshot: `data:image/${format};base64,${Buffer.from(screenshotBuffer).toString('base64')}`,
        primaryColor,
        dimensions
      };

    } catch (error) {
      this.logger.log('ERROR', 'URL screenshot capture failed', error);
      return this.createFallbackScreenshot(options);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Génère un screenshot automatique des fichiers générés
   */
  async generateProjectScreenshot(
    projectId: string,
    generatedFiles: Map<string, string>,
    projectType: string
  ): Promise<ScreenshotResult> {
    try {
      this.logger.log('INFO', `Generating screenshot for project: ${projectId}`);

      // Extraction des fichiers pertinents
      const htmlFiles = this.extractHtmlFiles(generatedFiles);
      const cssFiles = this.extractCssFiles(generatedFiles);

      if (htmlFiles.length === 0) {
        this.logger.log('WARN', 'No HTML files found, creating synthetic preview');
        return this.createSyntheticPreview(projectType, generatedFiles);
      }

      // Utilisation du premier fichier HTML trouvé (souvent page.tsx ou index.html)
      const mainHtml = this.convertReactToHtml(htmlFiles[0].content, cssFiles);
      
      return await this.captureFromHtml(mainHtml, this.combineCssFiles(cssFiles), {
        width: 1200,
        height: 800,
        fullPage: false // Pour éviter des screenshots trop longs
      });

    } catch (error) {
      this.logger.log('ERROR', 'Project screenshot generation failed', error);
      return this.createFallbackScreenshot({ width: 1200, height: 800 });
    }
  }

  /**
   * Construction HTML complet avec base CSS
   */
  private buildFullHtml(htmlContent: string, cssContent: string = ''): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    
    <!-- Scripts pour animations -->
    <script>
      // Auto-hide loading states after 1s
      setTimeout(() => {
        document.querySelectorAll('[class*="loading"], [class*="spinner"]').forEach(el => {
          el.style.display = 'none';
        });
      }, 1000);
      
      // Mock data injection for realistic preview
      document.querySelectorAll('[data-placeholder]').forEach(el => {
        const type = el.getAttribute('data-placeholder');
        switch(type) {
          case 'user-name':
            el.textContent = 'John Doe';
            break;
          case 'email':
            el.textContent = 'john@example.com';
            break;
          case 'date':
            el.textContent = new Date().toLocaleDateString('fr-FR');
            break;
        }
      });
    </script>
</body>
</html>`;
  }

  /**
   * Extraction couleur dominante de la page
   */
  private async extractPrimaryColor(page: any): Promise<string> {
    try {
      const color = await page.evaluate(() => {
        // Recherche d'éléments avec couleurs vives
        const elements = document.querySelectorAll('*');
        const colors = new Map();
        
        for (const element of elements) {
          const computedStyle = window.getComputedStyle(element);
          const bgColor = computedStyle.backgroundColor;
          const color = computedStyle.color;
          
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            colors.set(bgColor, (colors.get(bgColor) || 0) + 1);
          }
        }
        
        // Retourne la couleur la plus fréquente (hors noir/blanc/gris)
        let mostFrequent = '#7c3aed'; // Fallback purple
        let maxCount = 0;
        
        for (const [color, count] of colors) {
          if (count > maxCount && !color.includes('rgb(255') && !color.includes('rgb(0') && !color.includes('rgb(128')) {
            mostFrequent = color;
            maxCount = count;
          }
        }
        
        return mostFrequent;
      });
      
      // Conversion RGB vers HEX si nécessaire
      return this.rgbToHex(color) || '#7c3aed';
      
    } catch (error) {
      return '#7c3aed'; // Purple par défaut
    }
  }

  /**
   * Conversion RGB vers HEX
   */
  private rgbToHex(rgb: string): string | null {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;
    
    const [, r, g, b] = match.map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Extraction fichiers HTML des fichiers générés
   */
  private extractHtmlFiles(files: Map<string, string>): Array<{ path: string; content: string }> {
    const htmlFiles = [];
    
    for (const [filePath, content] of files) {
      if (filePath.endsWith('.html') || 
          filePath.includes('page.tsx') || 
          filePath.includes('index.tsx') ||
          filePath.includes('App.tsx')) {
        htmlFiles.push({ path: filePath, content });
      }
    }
    
    return htmlFiles;
  }

  /**
   * Extraction fichiers CSS des fichiers générés
   */
  private extractCssFiles(files: Map<string, string>): Array<{ path: string; content: string }> {
    const cssFiles = [];
    
    for (const [filePath, content] of files) {
      if (filePath.endsWith('.css') || 
          filePath.includes('globals.css') || 
          filePath.includes('styles.css')) {
        cssFiles.push({ path: filePath, content });
      }
    }
    
    return cssFiles;
  }

  /**
   * Conversion basique React vers HTML pour preview
   */
  private convertReactToHtml(reactContent: string, cssFiles: Array<{ path: string; content: string }>): string {
    // Conversion très basique React JSX → HTML
    let html = reactContent
      // Suppression imports
      .replace(/import.*?;/g, '')
      // Suppression export
      .replace(/export.*?{/, '')
      // Conversion className → class
      .replace(/className=/g, 'class=')
      // Conversion JSX vers HTML
      .replace(/{.*?}/g, '""')
      // Extraction du return
      .match(/return\s*\(([\s\S]*?)\);?/)?.[1] || reactContent;

    // Nettoyage
    html = html
      .replace(/^\s*\(/, '')
      .replace(/\);\s*$/, '')
      .trim();

    return html;
  }

  /**
   * Combinaison fichiers CSS
   */
  private combineCssFiles(cssFiles: Array<{ path: string; content: string }>): string {
    return cssFiles.map(file => file.content).join('\n\n');
  }

  /**
   * Création preview synthétique basé sur le type de projet
   */
  private async createSyntheticPreview(
    projectType: string,
    files: Map<string, string>
  ): Promise<ScreenshotResult> {
    const templates = {
      webapp: this.getWebAppTemplate(),
      mobile: this.getMobileTemplate(),
      dashboard: this.getDashboardTemplate(),
      landing: this.getLandingTemplate(),
      ecommerce: this.getEcommerceTemplate(),
      internal: this.getInternalTemplate()
    };

    const template = templates[projectType as keyof typeof templates] || templates.webapp;
    
    return await this.captureFromHtml(template.html, template.css);
  }

  /**
   * Templates synthétiques pour différents types de projets
   */
  private getWebAppTemplate() {
    return {
      html: `
        <div class="min-h-screen bg-gray-50">
          <nav class="bg-white shadow-sm border-b px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="font-semibold text-xl text-gray-900">WebApp</div>
              <div class="flex items-center gap-4">
                <button class="text-gray-600">Features</button>
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg">Sign In</button>
              </div>
            </div>
          </nav>
          <main class="max-w-7xl mx-auto py-12 px-6">
            <div class="text-center mb-12">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">Generated Web Application</h1>
              <p class="text-xl text-gray-600">Your AI-generated app is ready to use</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
              <div class="bg-white p-6 rounded-xl shadow-sm border">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <div class="text-blue-600">⚡</div>
                </div>
                <h3 class="font-semibold mb-2">Fast Performance</h3>
                <p class="text-gray-600">Optimized for speed and efficiency</p>
              </div>
              <div class="bg-white p-6 rounded-xl shadow-sm border">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <div class="text-green-600">🔒</div>
                </div>
                <h3 class="font-semibold mb-2">Secure</h3>
                <p class="text-gray-600">Built with security best practices</p>
              </div>
              <div class="bg-white p-6 rounded-xl shadow-sm border">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <div class="text-purple-600">🎨</div>
                </div>
                <h3 class="font-semibold mb-2">Beautiful</h3>
                <p class="text-gray-600">Modern and responsive design</p>
              </div>
            </div>
          </main>
        </div>
      `,
      css: ''
    };
  }

  private getDashboardTemplate() {
    return {
      html: `
        <div class="min-h-screen bg-gray-100">
          <div class="bg-white shadow-sm border-b px-6 py-4">
            <h1 class="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-4 gap-6 mb-8">
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="text-3xl font-bold text-blue-600">12.5K</div>
                <div class="text-gray-600">Total Users</div>
              </div>
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="text-3xl font-bold text-green-600">€45.2K</div>
                <div class="text-gray-600">Revenue</div>
              </div>
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="text-3xl font-bold text-orange-600">23.1%</div>
                <div class="text-gray-600">Growth Rate</div>
              </div>
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <div class="text-3xl font-bold text-purple-600">892</div>
                <div class="text-gray-600">New Signups</div>
              </div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-sm">
              <h2 class="text-lg font-semibold mb-4">Performance Chart</h2>
              <div class="h-64 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg"></div>
            </div>
          </div>
        </div>
      `,
      css: ''
    };
  }

  private getLandingTemplate() {
    return {
      html: `
        <div class="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
          <nav class="px-6 py-4">
            <div class="flex items-center justify-between text-white">
              <div class="font-bold text-xl">Brand</div>
              <button class="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium">Get Started</button>
            </div>
          </nav>
          <div class="text-center py-24 px-6">
            <h1 class="text-6xl font-bold text-white mb-6">Beautiful Landing Page</h1>
            <p class="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">AI-generated landing page with modern design and conversion-optimized layout</p>
            <button class="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all">Start Free Trial</button>
          </div>
        </div>
      `,
      css: ''
    };
  }

  private getMobileTemplate() {
    return {
      html: `
        <div class="max-w-sm mx-auto bg-gray-900 rounded-3xl p-2 shadow-2xl">
          <div class="bg-white rounded-2xl h-screen">
            <div class="bg-gradient-to-r from-pink-500 to-violet-500 p-6 rounded-t-2xl">
              <div class="text-center text-white">
                <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span class="text-2xl">📱</span>
                </div>
                <h1 class="text-xl font-bold">Mobile App</h1>
                <p class="text-sm opacity-90">AI Generated Experience</p>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-xl">
                  <div class="font-semibold">Feature One</div>
                  <div class="text-gray-600 text-sm">Amazing functionality</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl">
                  <div class="font-semibold">Feature Two</div>
                  <div class="text-gray-600 text-sm">Incredible experience</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl">
                  <div class="font-semibold">Feature Three</div>
                  <div class="text-gray-600 text-sm">Seamless integration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      css: 'body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; }'
    };
  }

  private getEcommerceTemplate() {
    return {
      html: `
        <div class="min-h-screen bg-gray-50">
          <nav class="bg-white shadow-sm px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="font-bold text-xl">E-Shop</div>
              <div class="flex items-center gap-4">
                <span>🛒 3</span>
                <button class="bg-black text-white px-4 py-2 rounded">Account</button>
              </div>
            </div>
          </nav>
          <div class="max-w-7xl mx-auto py-8 px-6">
            <div class="grid md:grid-cols-3 gap-6">
              <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="h-48 bg-gradient-to-br from-red-400 to-pink-600"></div>
                <div class="p-4">
                  <h3 class="font-semibold">Premium Product</h3>
                  <p class="text-gray-600">€99.99</p>
                  <button class="w-full bg-black text-white py-2 rounded mt-2">Add to Cart</button>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="h-48 bg-gradient-to-br from-blue-400 to-cyan-600"></div>
                <div class="p-4">
                  <h3 class="font-semibold">Best Seller</h3>
                  <p class="text-gray-600">€79.99</p>
                  <button class="w-full bg-black text-white py-2 rounded mt-2">Add to Cart</button>
                </div>
              </div>
              <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <div class="h-48 bg-gradient-to-br from-green-400 to-emerald-600"></div>
                <div class="p-4">
                  <h3 class="font-semibold">New Arrival</h3>
                  <p class="text-gray-600">€129.99</p>
                  <button class="w-full bg-black text-white py-2 rounded mt-2">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      css: ''
    };
  }

  private getInternalTemplate() {
    return {
      html: `
        <div class="min-h-screen bg-gray-100">
          <div class="bg-white shadow-sm border-b px-6 py-4">
            <h1 class="text-xl font-semibold">Internal Tool Dashboard</h1>
          </div>
          <div class="flex">
            <div class="w-64 bg-white shadow-sm h-screen p-4">
              <nav class="space-y-2">
                <a href="#" class="block px-4 py-2 bg-blue-100 text-blue-700 rounded">Overview</a>
                <a href="#" class="block px-4 py-2 text-gray-600 rounded hover:bg-gray-100">Users</a>
                <a href="#" class="block px-4 py-2 text-gray-600 rounded hover:bg-gray-100">Reports</a>
                <a href="#" class="block px-4 py-2 text-gray-600 rounded hover:bg-gray-100">Settings</a>
              </nav>
            </div>
            <div class="flex-1 p-6">
              <div class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-lg font-semibold mb-4">Data Table</h2>
                <div class="space-y-3">
                  <div class="flex items-center justify-between py-3 border-b">
                    <div>User 1</div>
                    <div class="text-green-600">Active</div>
                  </div>
                  <div class="flex items-center justify-between py-3 border-b">
                    <div>User 2</div>
                    <div class="text-yellow-600">Pending</div>
                  </div>
                  <div class="flex items-center justify-between py-3 border-b">
                    <div>User 3</div>
                    <div class="text-green-600">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      css: ''
    };
  }

  /**
   * Screenshot de fallback en cas d'erreur
   */
  private createFallbackScreenshot(options: ScreenshotOptions = {}): ScreenshotResult {
    // Création d'une image placeholder en SVG puis conversion base64
    const { width = 1200, height = 800 } = options;
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
          Generated Preview
        </text>
        <text x="50%" y="60%" font-family="Arial" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">
          Your AI-generated application
        </text>
      </svg>
    `;

    const base64 = Buffer.from(svg).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return {
      thumbnail: dataUrl,
      screenshot: dataUrl,
      primaryColor: '#7c3aed',
      dimensions: { width, height }
    };
  }
}