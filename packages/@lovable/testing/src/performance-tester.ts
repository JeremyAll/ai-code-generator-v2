export interface PerformanceMetrics {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageCount: number;
  imageSize: number;
  warnings: string[];
  suggestions: string[];
  score: number;
  grades: {
    bundleSize: 'A' | 'B' | 'C' | 'D' | 'F';
    imageOptimization: 'A' | 'B' | 'C' | 'D' | 'F';
    caching: 'A' | 'B' | 'C' | 'D' | 'F';
    compression: 'A' | 'B' | 'C' | 'D' | 'F';
  };
}

export interface CoreWebVitals {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
  fcp: 'good' | 'needs-improvement' | 'poor';
  ttfb: 'good' | 'needs-improvement' | 'poor';
}

export interface LighthouseAudit {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  suggestions: string[];
}

export class PerformanceTester {
  private readonly BUNDLE_SIZE_THRESHOLDS = {
    excellent: 250000,  // 250KB
    good: 500000,       // 500KB
    average: 1000000,   // 1MB
    poor: 2000000       // 2MB
  };

  private readonly IMAGE_SIZE_THRESHOLDS = {
    excellent: 100000,  // 100KB
    good: 200000,       // 200KB
    average: 500000,    // 500KB
    poor: 1000000       // 1MB
  };

  analyzeBundle(files: Map<string, string>): PerformanceMetrics {
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageCount = 0;
    let imageSize = 0;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Analyze each file
    files.forEach((content, filename) => {
      const size = new Blob([content]).size;
      totalSize += size;

      if (this.isJavaScriptFile(filename)) {
        jsSize += size;
        this.analyzeJavaScript(filename, content, size, warnings, suggestions);
      } else if (this.isCSSFile(filename)) {
        cssSize += size;
        this.analyzeCSS(filename, content, size, warnings, suggestions);
      } else if (this.isImageFile(filename)) {
        imageCount++;
        imageSize += size;
        this.analyzeImage(filename, size, warnings, suggestions);
      }
    });

    // Check for required files and configurations
    this.checkRequiredFiles(files, warnings, suggestions);
    
    // Calculate grades
    const grades = this.calculateGrades(jsSize + cssSize, imageSize, imageCount, files);
    
    // Calculate overall score
    const score = this.calculateScore(jsSize + cssSize, imageSize, imageCount, warnings.length);

    return {
      totalSize,
      jsSize,
      cssSize,
      imageCount,
      imageSize,
      warnings,
      suggestions,
      score,
      grades
    };
  }

  private isJavaScriptFile(filename: string): boolean {
    return /\.(js|jsx|ts|tsx|mjs)$/i.test(filename);
  }

  private isCSSFile(filename: string): boolean {
    return /\.(css|scss|sass|less|styl)$/i.test(filename);
  }

  private isImageFile(filename: string): boolean {
    return /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(filename);
  }

  private analyzeJavaScript(filename: string, content: string, size: number, warnings: string[], suggestions: string[]): void {
    // Check bundle size
    if (size > this.BUNDLE_SIZE_THRESHOLDS.poor) {
      warnings.push(`Very large JS file: ${filename} (${Math.round(size/1024)}KB)`);
      suggestions.push('Consider code splitting and lazy loading for large bundles');
    } else if (size > this.BUNDLE_SIZE_THRESHOLDS.average) {
      warnings.push(`Large JS file: ${filename} (${Math.round(size/1024)}KB)`);
      suggestions.push('Consider optimizing and minifying JavaScript code');
    }

    // Check for console.log statements
    if (content.includes('console.log')) {
      warnings.push(`Console statements found in ${filename}`);
      suggestions.push('Remove console.log statements in production');
    }

    // Check for inline styles
    const inlineStyleCount = (content.match(/style\s*=\s*["'][^"']*["']/g) || []).length;
    if (inlineStyleCount > 10) {
      warnings.push(`High number of inline styles in ${filename}`);
      suggestions.push('Move inline styles to CSS files for better caching');
    }

    // Check for jQuery (if React app)
    if (content.includes('jquery') || content.includes('jQuery') || content.includes('$')) {
      warnings.push(`Potential jQuery usage detected in ${filename}`);
      suggestions.push('Consider removing jQuery dependency in React applications');
    }

    // Check for lodash full import
    if (content.includes('import _ from \'lodash\'') || content.includes('import * as _ from \'lodash\'')) {
      warnings.push(`Full Lodash import detected in ${filename}`);
      suggestions.push('Use specific Lodash imports to reduce bundle size');
    }
  }

  private analyzeCSS(filename: string, content: string, size: number, warnings: string[], suggestions: string[]): void {
    // Check CSS size
    if (size > 200000) {
      warnings.push(`Large CSS file: ${filename} (${Math.round(size/1024)}KB)`);
      suggestions.push('Consider splitting CSS or removing unused styles');
    }

    // Check for unused CSS (basic heuristic)
    const selectorCount = (content.match(/\{[^}]*\}/g) || []).length;
    if (selectorCount > 1000) {
      warnings.push(`High number of CSS selectors in ${filename}`);
      suggestions.push('Consider using CSS purging tools to remove unused styles');
    }

    // Check for @import statements
    const importCount = (content.match(/@import/g) || []).length;
    if (importCount > 0) {
      warnings.push(`@import statements found in ${filename}`);
      suggestions.push('Avoid @import in CSS as it blocks rendering');
    }

    // Check for large background images
    const backgroundImages = content.match(/background(-image)?\s*:\s*url\([^)]+\)/g) || [];
    if (backgroundImages.length > 5) {
      suggestions.push('Consider optimizing or lazy loading background images');
    }
  }

  private analyzeImage(filename: string, size: number, warnings: string[], suggestions: string[]): void {
    const extension = filename.split('.').pop()?.toLowerCase();

    // Check image size
    if (size > this.IMAGE_SIZE_THRESHOLDS.poor) {
      warnings.push(`Very large image: ${filename} (${Math.round(size/1024)}KB)`);
      suggestions.push('Compress and optimize images before deployment');
    } else if (size > this.IMAGE_SIZE_THRESHOLDS.average) {
      warnings.push(`Large image: ${filename} (${Math.round(size/1024)}KB)`);
    }

    // Suggest modern formats
    if (['jpg', 'jpeg', 'png'].includes(extension || '')) {
      suggestions.push(`Consider using WebP or AVIF format instead of ${extension?.toUpperCase()}`);
    }

    // Check for SVG optimization
    if (extension === 'svg' && size > 50000) {
      suggestions.push(`Large SVG file: ${filename}. Consider optimizing with SVGO`);
    }
  }

  private checkRequiredFiles(files: Map<string, string>, warnings: string[], suggestions: string[]): void {
    // Check for PWA manifest
    if (!files.has('manifest.json') && !files.has('public/manifest.json')) {
      suggestions.push('Add PWA manifest for better performance and user experience');
    }

    // Check for service worker
    const hasServiceWorker = Array.from(files.keys()).some(key => 
      key.includes('sw.js') || key.includes('service-worker')
    );
    if (!hasServiceWorker) {
      suggestions.push('Consider adding service worker for caching and offline support');
    }

    // Check for robots.txt
    if (!files.has('robots.txt') && !files.has('public/robots.txt')) {
      suggestions.push('Add robots.txt for better SEO');
    }

    // Check for sitemap
    const hasSitemap = Array.from(files.keys()).some(key => 
      key.includes('sitemap')
    );
    if (!hasSitemap) {
      suggestions.push('Consider adding sitemap.xml for SEO');
    }
  }

  private calculateGrades(bundleSize: number, imageSize: number, imageCount: number, files: Map<string, string>): PerformanceMetrics['grades'] {
    // Bundle size grade
    const bundleSizeGrade = bundleSize < this.BUNDLE_SIZE_THRESHOLDS.excellent ? 'A' :
                           bundleSize < this.BUNDLE_SIZE_THRESHOLDS.good ? 'B' :
                           bundleSize < this.BUNDLE_SIZE_THRESHOLDS.average ? 'C' :
                           bundleSize < this.BUNDLE_SIZE_THRESHOLDS.poor ? 'D' : 'F';

    // Image optimization grade
    const avgImageSize = imageCount > 0 ? imageSize / imageCount : 0;
    const imageGrade = avgImageSize < this.IMAGE_SIZE_THRESHOLDS.excellent ? 'A' :
                      avgImageSize < this.IMAGE_SIZE_THRESHOLDS.good ? 'B' :
                      avgImageSize < this.IMAGE_SIZE_THRESHOLDS.average ? 'C' :
                      avgImageSize < this.IMAGE_SIZE_THRESHOLDS.poor ? 'D' : 'F';

    // Caching grade (based on presence of caching headers/config)
    const hasCacheConfig = Array.from(files.keys()).some(key => 
      key.includes('.htaccess') || key.includes('nginx.conf') || key.includes('vercel.json')
    );
    const cachingGrade: 'A' | 'B' | 'C' | 'D' | 'F' = hasCacheConfig ? 'A' : 'C';

    // Compression grade (check for pre-compression or config)
    const hasCompressionConfig = Array.from(files.keys()).some(key => 
      key.includes('.gz') || key.includes('.br')
    );
    const compressionGrade: 'A' | 'B' | 'C' | 'D' | 'F' = hasCompressionConfig ? 'A' : 'B';

    return {
      bundleSize: bundleSizeGrade,
      imageOptimization: imageGrade,
      caching: cachingGrade,
      compression: compressionGrade
    };
  }

  private calculateScore(bundleSize: number, imageSize: number, imageCount: number, warningCount: number): number {
    let score = 100;

    // Deduct points for bundle size
    if (bundleSize > this.BUNDLE_SIZE_THRESHOLDS.poor) score -= 30;
    else if (bundleSize > this.BUNDLE_SIZE_THRESHOLDS.average) score -= 20;
    else if (bundleSize > this.BUNDLE_SIZE_THRESHOLDS.good) score -= 10;

    // Deduct points for image size
    const avgImageSize = imageCount > 0 ? imageSize / imageCount : 0;
    if (avgImageSize > this.IMAGE_SIZE_THRESHOLDS.poor) score -= 20;
    else if (avgImageSize > this.IMAGE_SIZE_THRESHOLDS.average) score -= 15;
    else if (avgImageSize > this.IMAGE_SIZE_THRESHOLDS.good) score -= 5;

    // Deduct points for warnings
    score -= warningCount * 5;

    return Math.max(0, score);
  }

  checkCoreWebVitals(html: string): CoreWebVitals {
    // Simplified checks based on HTML content analysis
    const hasLazyLoading = html.includes('loading="lazy"');
    const hasFontDisplay = html.includes('font-display: swap');
    const hasViewport = html.includes('viewport');
    const hasPreload = html.includes('rel="preload"');
    const hasCriticalCSS = html.includes('<style>') && html.length < 50000;
    
    // LCP (Largest Contentful Paint)
    const lcp = hasLazyLoading && hasPreload && hasCriticalCSS ? 'good' : 
               hasLazyLoading || hasPreload ? 'needs-improvement' : 'poor';

    // FID (First Input Delay) - assume good with modern frameworks
    const fid: CoreWebVitals['fid'] = 'good';

    // CLS (Cumulative Layout Shift)
    const cls = hasFontDisplay && hasViewport ? 'good' : 
               hasViewport ? 'needs-improvement' : 'poor';

    // FCP (First Contentful Paint)
    const fcp = hasCriticalCSS && hasPreload ? 'good' : 
               hasCriticalCSS || hasPreload ? 'needs-improvement' : 'poor';

    // TTFB (Time to First Byte) - assume good for static sites
    const ttfb: CoreWebVitals['ttfb'] = 'good';

    return { lcp, fid, cls, fcp, ttfb };
  }

  simulateLighthouseAudit(files: Map<string, string>, html: string): LighthouseAudit {
    const suggestions: string[] = [];
    
    // Performance score calculation
    const bundleMetrics = this.analyzeBundle(files);
    const webVitals = this.checkCoreWebVitals(html);
    
    let performance = 90;
    if (bundleMetrics.score < 80) performance -= 20;
    if (webVitals.lcp === 'poor') performance -= 15;
    if (webVitals.cls === 'poor') performance -= 10;
    
    // Accessibility score (basic)
    let accessibility = 85;
    if (!html.includes('alt=')) {
      accessibility -= 15;
      suggestions.push('Add alt attributes to images');
    }
    if (!html.includes('aria-label')) {
      accessibility -= 10;
      suggestions.push('Add ARIA labels for better accessibility');
    }

    // Best practices score
    let bestPractices = 90;
    if (html.includes('http://')) {
      bestPractices -= 20;
      suggestions.push('Use HTTPS for all resources');
    }
    if (bundleMetrics.warnings.length > 5) {
      bestPractices -= 15;
    }

    // SEO score
    let seo = 85;
    if (!html.includes('<title>')) {
      seo -= 20;
      suggestions.push('Add descriptive page title');
    }
    if (!html.includes('meta name="description"')) {
      seo -= 15;
      suggestions.push('Add meta description');
    }

    // PWA score
    let pwa = 50;
    if (files.has('manifest.json')) pwa += 20;
    if (Array.from(files.keys()).some(k => k.includes('sw.js'))) pwa += 30;
    
    return {
      performance: Math.max(0, performance),
      accessibility: Math.max(0, accessibility),
      bestPractices: Math.max(0, bestPractices),
      seo: Math.max(0, seo),
      pwa: Math.max(0, pwa),
      suggestions
    };
  }

  generatePerformanceReport(metrics: PerformanceMetrics, webVitals: CoreWebVitals, lighthouse: LighthouseAudit): string {
    return `
# Performance Analysis Report

## Overall Score: ${metrics.score}/100

## Bundle Analysis
- **Total Size**: ${Math.round(metrics.totalSize / 1024)}KB
- **JavaScript**: ${Math.round(metrics.jsSize / 1024)}KB
- **CSS**: ${Math.round(metrics.cssSize / 1024)}KB
- **Images**: ${metrics.imageCount} files, ${Math.round(metrics.imageSize / 1024)}KB

## Performance Grades
- **Bundle Size**: ${metrics.grades.bundleSize}
- **Image Optimization**: ${metrics.grades.imageOptimization}
- **Caching**: ${metrics.grades.caching}
- **Compression**: ${metrics.grades.compression}

## Core Web Vitals
- **Largest Contentful Paint (LCP)**: ${webVitals.lcp.toUpperCase()}
- **First Input Delay (FID)**: ${webVitals.fid.toUpperCase()}
- **Cumulative Layout Shift (CLS)**: ${webVitals.cls.toUpperCase()}
- **First Contentful Paint (FCP)**: ${webVitals.fcp.toUpperCase()}
- **Time to First Byte (TTFB)**: ${webVitals.ttfb.toUpperCase()}

## Lighthouse Scores
- **Performance**: ${lighthouse.performance}/100
- **Accessibility**: ${lighthouse.accessibility}/100
- **Best Practices**: ${lighthouse.bestPractices}/100
- **SEO**: ${lighthouse.seo}/100
- **PWA**: ${lighthouse.pwa}/100

## Warnings
${metrics.warnings.length > 0 ? metrics.warnings.map(w => `⚠️ ${w}`).join('\n') : '✅ No warnings found'}

## Optimization Suggestions
${[...metrics.suggestions, ...lighthouse.suggestions].map(s => `💡 ${s}`).join('\n')}

## Performance Budget Recommendations
- **JavaScript Budget**: < 250KB (Current: ${Math.round(metrics.jsSize / 1024)}KB)
- **CSS Budget**: < 100KB (Current: ${Math.round(metrics.cssSize / 1024)}KB)
- **Image Budget**: < 500KB total (Current: ${Math.round(metrics.imageSize / 1024)}KB)
- **Total Budget**: < 1MB (Current: ${Math.round(metrics.totalSize / 1024)}KB)

## Next Steps
1. **Critical**: Address all warnings above
2. **High**: Optimize images and reduce bundle size
3. **Medium**: Implement lazy loading and code splitting
4. **Low**: Add PWA features and service worker

## Tools for Further Analysis
- Google PageSpeed Insights
- WebPageTest.org
- Chrome DevTools Lighthouse
- Webpack Bundle Analyzer
- ImageOptim for image compression
`;
  }

  generatePerformanceBudget(targetMetrics: Partial<PerformanceMetrics> = {}): string {
    const defaults = {
      jsSize: 250000,    // 250KB
      cssSize: 100000,   // 100KB
      imageSize: 500000, // 500KB per image
      totalSize: 1000000 // 1MB total
    };

    const budget = { ...defaults, ...targetMetrics };

    return `
# Performance Budget Configuration

## Bundle Size Limits
- **JavaScript**: ${Math.round(budget.jsSize / 1024)}KB
- **CSS**: ${Math.round(budget.cssSize / 1024)}KB
- **Images**: ${Math.round(budget.imageSize / 1024)}KB per image
- **Total Bundle**: ${Math.round(budget.totalSize / 1024)}KB

## Core Web Vitals Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## Implementation
\`\`\`json
{
  "performanceBudget": {
    "bundleSize": {
      "js": ${budget.jsSize},
      "css": ${budget.cssSize},
      "total": ${budget.totalSize}
    },
    "imageSize": ${budget.imageSize},
    "coreWebVitals": {
      "lcp": 2500,
      "fid": 100,
      "cls": 0.1
    }
  }
}
\`\`\`

## Webpack Configuration
\`\`\`js
module.exports = {
  performance: {
    maxAssetSize: ${budget.totalSize},
    maxEntrypointSize: ${budget.jsSize + budget.cssSize},
    hints: 'error'
  }
};
\`\`\`
`;
  }
}

export default PerformanceTester;