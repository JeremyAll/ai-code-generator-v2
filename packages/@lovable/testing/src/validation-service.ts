import { AccessibilityTester, AccessibilityResult } from './accessibility-tester';
import { PerformanceTester, PerformanceMetrics, CoreWebVitals, LighthouseAudit } from './performance-tester';

export interface ValidationResult {
  valid: boolean;
  score: number;
  tests: {
    structure: boolean;
    dependencies: boolean;
    accessibility: number;
    performance: number;
    seo: boolean;
    security: boolean;
    bestPractices: boolean;
  };
  details: {
    accessibility: AccessibilityResult;
    performance: PerformanceMetrics;
    webVitals: CoreWebVitals;
    lighthouse: LighthouseAudit;
    security: SecurityAudit;
    seo: SEOAudit;
  };
  report: string;
  recommendations: string[];
  criticalIssues: string[];
}

export interface SecurityAudit {
  score: number;
  vulnerabilities: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    file?: string;
    fix: string;
  }>;
  passed: string[];
}

export interface SEOAudit {
  score: number;
  issues: Array<{
    priority: 'high' | 'medium' | 'low';
    type: string;
    description: string;
    fix: string;
  }>;
  passed: string[];
}

export class ValidationService {
  private accessibilityTester: AccessibilityTester;
  private performanceTester: PerformanceTester;

  constructor() {
    this.accessibilityTester = new AccessibilityTester();
    this.performanceTester = new PerformanceTester();
  }

  async validateGeneratedApp(
    files: Map<string, string>,
    blueprint: any
  ): Promise<ValidationResult> {
    // Get main HTML content
    const mainHtml = this.extractMainHTML(files);
    
    // Run all tests in parallel
    const [
      structureResult,
      dependencyResult,
      accessibilityResult,
      performanceResult,
      securityResult,
      seoResult
    ] = await Promise.all([
      this.validateStructure(files, blueprint),
      this.validateDependencies(files),
      this.accessibilityTester.testAccessibility(mainHtml),
      this.validatePerformance(files, mainHtml),
      this.auditSecurity(files, mainHtml),
      this.auditSEO(files, mainHtml)
    ]);

    // Calculate overall score
    const scores = [
      structureResult ? 100 : 0,
      dependencyResult ? 100 : 0,
      accessibilityResult.score,
      performanceResult.performance,
      securityResult.score,
      seoResult.score
    ];

    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    // Generate recommendations and critical issues
    const recommendations = this.generateRecommendations(
      accessibilityResult,
      performanceResult,
      securityResult,
      seoResult
    );

    const criticalIssues = this.identifyCriticalIssues(
      accessibilityResult,
      performanceResult.metrics,
      securityResult,
      seoResult
    );

    // Generate comprehensive report
    const report = this.generateComprehensiveReport({
      structure: structureResult,
      dependencies: dependencyResult,
      accessibility: accessibilityResult,
      performance: performanceResult,
      security: securityResult,
      seo: seoResult,
      overallScore,
      recommendations,
      criticalIssues
    });

    return {
      valid: overallScore >= 70 && criticalIssues.length === 0,
      score: overallScore,
      tests: {
        structure: structureResult,
        dependencies: dependencyResult,
        accessibility: accessibilityResult.score,
        performance: performanceResult.performance,
        seo: seoResult.score >= 70,
        security: securityResult.score >= 80,
        bestPractices: performanceResult.bestPractices >= 80
      },
      details: {
        accessibility: accessibilityResult,
        performance: performanceResult.metrics,
        webVitals: performanceResult.webVitals,
        lighthouse: performanceResult.lighthouse,
        security: securityResult,
        seo: seoResult
      },
      report,
      recommendations,
      criticalIssues
    };
  }

  private extractMainHTML(files: Map<string, string>): string {
    // Try different possible HTML file locations
    const possibleHtmlFiles = [
      'index.html',
      'public/index.html',
      'dist/index.html',
      'build/index.html'
    ];

    for (const filename of possibleHtmlFiles) {
      if (files.has(filename)) {
        return files.get(filename) || '';
      }
    }

    // If no HTML file found, create a basic one from React components
    const appComponent = files.get('src/App.tsx') || files.get('src/App.jsx') || '';
    if (appComponent) {
      return this.convertReactToHTML(appComponent);
    }

    return '';
  }

  private convertReactToHTML(reactCode: string): string {
    // Basic conversion of React JSX to HTML for analysis
    let html = reactCode
      .replace(/className=/g, 'class=')
      .replace(/htmlFor=/g, 'for=')
      .replace(/\{[^}]*\}/g, 'placeholder-content')
      .replace(/import.*from.*;/g, '')
      .replace(/export.*function.*\{/g, '<div>')
      .replace(/}\s*$/, '</div>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Generated App</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  ${html}
</body>
</html>`;
  }

  private async validateStructure(files: Map<string, string>, blueprint: any): Promise<boolean> {
    const requiredFiles = [
      'package.json',
      'src/App.tsx',
      'src/index.tsx'
    ];

    // Check if all required files exist
    const missingFiles = requiredFiles.filter(file => !files.has(file));
    if (missingFiles.length > 0) {
      return false;
    }

    // Validate package.json structure
    const packageJsonContent = files.get('package.json');
    if (packageJsonContent) {
      try {
        const packageJson = JSON.parse(packageJsonContent);
        if (!packageJson.name || !packageJson.version || !packageJson.dependencies) {
          return false;
        }
      } catch {
        return false;
      }
    }

    // Validate component structure matches blueprint
    if (blueprint?.components) {
      const missingComponents = blueprint.components.filter((comp: any) => 
        !files.has(`src/components/${comp.name}.tsx`) && 
        !files.has(`src/components/${comp.name}.jsx`)
      );
      if (missingComponents.length > 0) {
        return false;
      }
    }

    return true;
  }

  private async validateDependencies(files: Map<string, string>): Promise<boolean> {
    const packageJsonContent = files.get('package.json');
    if (!packageJsonContent) return false;

    try {
      const packageJson = JSON.parse(packageJsonContent);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for required React dependencies
      if (!deps.react || !deps['react-dom']) {
        return false;
      }

      // Check for conflicting or outdated dependencies
      const problematicDeps = [
        'jquery', // Shouldn't be needed in React
        'bootstrap@3', // Outdated version
        'react@16' // Outdated major version
      ];

      const hasProblems = problematicDeps.some(dep => {
        const [name, version] = dep.split('@');
        return deps[name] && (version ? deps[name].includes(version) : true);
      });

      return !hasProblems;
    } catch {
      return false;
    }
  }

  private async validatePerformance(files: Map<string, string>, html: string): Promise<{
    performance: number;
    bestPractices: number;
    metrics: PerformanceMetrics;
    webVitals: CoreWebVitals;
    lighthouse: LighthouseAudit;
  }> {
    const metrics = this.performanceTester.analyzeBundle(files);
    const webVitals = this.performanceTester.checkCoreWebVitals(html);
    const lighthouse = this.performanceTester.simulateLighthouseAudit(files, html);

    return {
      performance: lighthouse.performance,
      bestPractices: lighthouse.bestPractices,
      metrics,
      webVitals,
      lighthouse
    };
  }

  private async auditSecurity(files: Map<string, string>, html: string): Promise<SecurityAudit> {
    const vulnerabilities: SecurityAudit['vulnerabilities'] = [];
    const passed: string[] = [];
    let score = 100;

    // Check for HTTPS usage
    if (html.includes('http://') && !html.includes('https://')) {
      vulnerabilities.push({
        severity: 'high',
        type: 'insecure-protocol',
        description: 'HTTP resources detected instead of HTTPS',
        fix: 'Replace all HTTP URLs with HTTPS equivalents'
      });
      score -= 20;
    } else {
      passed.push('HTTPS usage');
    }

    // Check for inline scripts
    const inlineScriptCount = (html.match(/<script(?![^>]*src)[^>]*>/g) || []).length;
    if (inlineScriptCount > 0) {
      vulnerabilities.push({
        severity: 'medium',
        type: 'inline-scripts',
        description: `${inlineScriptCount} inline scripts found`,
        fix: 'Move inline scripts to external files and implement CSP'
      });
      score -= 10;
    } else {
      passed.push('No inline scripts');
    }

    // Check for eval() usage
    files.forEach((content, filename) => {
      if (content.includes('eval(')) {
        vulnerabilities.push({
          severity: 'high',
          type: 'eval-usage',
          description: 'eval() function usage detected',
          file: filename,
          fix: 'Remove eval() usage and find safer alternatives'
        });
        score -= 15;
      }
    });

    // Check for console.log in production
    let hasConsoleLog = false;
    files.forEach((content, filename) => {
      if (filename.includes('.js') && content.includes('console.log')) {
        hasConsoleLog = true;
      }
    });

    if (hasConsoleLog) {
      vulnerabilities.push({
        severity: 'low',
        type: 'console-logs',
        description: 'Console.log statements found in production code',
        fix: 'Remove or replace console.log statements'
      });
      score -= 5;
    } else {
      passed.push('No console logs in production');
    }

    // Check for sensitive data exposure
    const sensitivePatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token.*=.*['"]/i
    ];

    files.forEach((content, filename) => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          vulnerabilities.push({
            severity: 'critical',
            type: 'data-exposure',
            description: 'Potential sensitive data exposure',
            file: filename,
            fix: 'Move sensitive data to environment variables'
          });
          score -= 25;
        }
      });
    });

    if (vulnerabilities.filter(v => v.type === 'data-exposure').length === 0) {
      passed.push('No sensitive data exposure');
    }

    // Check for Content Security Policy
    const hasCSP = html.includes('Content-Security-Policy') || 
                  html.includes('meta http-equiv="Content-Security-Policy"');
    if (!hasCSP) {
      vulnerabilities.push({
        severity: 'medium',
        type: 'missing-csp',
        description: 'No Content Security Policy detected',
        fix: 'Implement Content Security Policy headers'
      });
      score -= 10;
    } else {
      passed.push('Content Security Policy present');
    }

    return {
      score: Math.max(0, score),
      vulnerabilities,
      passed
    };
  }

  private async auditSEO(files: Map<string, string>, html: string): Promise<SEOAudit> {
    const issues: SEOAudit['issues'] = [];
    const passed: string[] = [];
    let score = 100;

    // Check for title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (!titleMatch || !titleMatch[1].trim()) {
      issues.push({
        priority: 'high',
        type: 'missing-title',
        description: 'Page title is missing or empty',
        fix: 'Add descriptive page title'
      });
      score -= 20;
    } else if (titleMatch[1].length < 30 || titleMatch[1].length > 60) {
      issues.push({
        priority: 'medium',
        type: 'title-length',
        description: 'Page title length is not optimal (30-60 characters recommended)',
        fix: 'Adjust title length to 30-60 characters'
      });
      score -= 10;
    } else {
      passed.push('Optimal title length');
    }

    // Check for meta description
    const metaDescMatch = html.match(/<meta\s+name\s*=\s*['"]\s*description\s*['"]\s+content\s*=\s*['"]([^'"]*)['"]/i);
    if (!metaDescMatch || !metaDescMatch[1].trim()) {
      issues.push({
        priority: 'high',
        type: 'missing-meta-description',
        description: 'Meta description is missing',
        fix: 'Add meta description tag'
      });
      score -= 20;
    } else if (metaDescMatch[1].length < 120 || metaDescMatch[1].length > 160) {
      issues.push({
        priority: 'medium',
        type: 'meta-description-length',
        description: 'Meta description length is not optimal (120-160 characters recommended)',
        fix: 'Adjust meta description length'
      });
      score -= 5;
    } else {
      passed.push('Optimal meta description');
    }

    // Check for Open Graph tags
    const ogTitleMatch = html.match(/<meta\s+property\s*=\s*['"]\s*og:title\s*['"]/i);
    const ogDescMatch = html.match(/<meta\s+property\s*=\s*['"]\s*og:description\s*['"]/i);
    const ogImageMatch = html.match(/<meta\s+property\s*=\s*['"]\s*og:image\s*['"]/i);

    if (!ogTitleMatch || !ogDescMatch) {
      issues.push({
        priority: 'medium',
        type: 'missing-og-tags',
        description: 'Open Graph tags are incomplete',
        fix: 'Add og:title, og:description, and og:image tags'
      });
      score -= 15;
    } else {
      passed.push('Open Graph tags present');
    }

    // Check for viewport meta tag
    if (!html.includes('name="viewport"')) {
      issues.push({
        priority: 'high',
        type: 'missing-viewport',
        description: 'Viewport meta tag is missing',
        fix: 'Add viewport meta tag for mobile optimization'
      });
      score -= 20;
    } else {
      passed.push('Viewport meta tag present');
    }

    // Check for lang attribute
    if (!html.match(/<html[^>]*lang\s*=/i)) {
      issues.push({
        priority: 'medium',
        type: 'missing-lang',
        description: 'HTML lang attribute is missing',
        fix: 'Add lang attribute to HTML element'
      });
      score -= 10;
    } else {
      passed.push('HTML lang attribute present');
    }

    // Check for heading structure
    const headings = html.match(/<h[1-6][^>]*>/gi) || [];
    if (headings.length === 0) {
      issues.push({
        priority: 'medium',
        type: 'no-headings',
        description: 'No heading tags found',
        fix: 'Add heading tags for better content structure'
      });
      score -= 15;
    } else {
      passed.push('Heading structure present');
    }

    // Check for alt attributes on images
    const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt\s*=)[^>]*>/gi) || []).length;
    if (imagesWithoutAlt > 0) {
      issues.push({
        priority: 'high',
        type: 'missing-alt-tags',
        description: `${imagesWithoutAlt} images missing alt attributes`,
        fix: 'Add descriptive alt attributes to all images'
      });
      score -= 15;
    } else {
      passed.push('All images have alt attributes');
    }

    // Check for robots.txt
    if (!files.has('robots.txt') && !files.has('public/robots.txt')) {
      issues.push({
        priority: 'low',
        type: 'missing-robots',
        description: 'robots.txt file is missing',
        fix: 'Add robots.txt file'
      });
      score -= 5;
    } else {
      passed.push('robots.txt present');
    }

    // Check for sitemap
    const hasSitemap = Array.from(files.keys()).some(key => key.includes('sitemap'));
    if (!hasSitemap) {
      issues.push({
        priority: 'low',
        type: 'missing-sitemap',
        description: 'Sitemap is missing',
        fix: 'Generate and add sitemap.xml'
      });
      score -= 5;
    } else {
      passed.push('Sitemap present');
    }

    return {
      score: Math.max(0, score),
      issues,
      passed
    };
  }

  private generateRecommendations(
    accessibility: AccessibilityResult,
    performance: any,
    security: SecurityAudit,
    seo: SEOAudit
  ): string[] {
    const recommendations: string[] = [];

    // Accessibility recommendations
    if (accessibility.score < 90) {
      recommendations.push('Improve accessibility by addressing WCAG compliance issues');
    }

    // Performance recommendations
    if (performance.metrics.score < 80) {
      recommendations.push('Optimize bundle size and implement code splitting');
    }

    // Security recommendations
    if (security.score < 90) {
      recommendations.push('Address security vulnerabilities before deployment');
    }

    // SEO recommendations
    if (seo.score < 80) {
      recommendations.push('Implement SEO best practices for better search visibility');
    }

    // General recommendations
    recommendations.push('Run automated tests in CI/CD pipeline');
    recommendations.push('Monitor Core Web Vitals in production');
    recommendations.push('Implement progressive web app features');

    return recommendations;
  }

  private identifyCriticalIssues(
    accessibility: AccessibilityResult,
    performance: PerformanceMetrics,
    security: SecurityAudit,
    seo: SEOAudit
  ): string[] {
    const critical: string[] = [];

    // Critical accessibility issues
    const criticalA11yIssues = accessibility.issues.filter(issue => issue.severity === 'error');
    if (criticalA11yIssues.length > 0) {
      critical.push(`${criticalA11yIssues.length} critical accessibility errors must be fixed`);
    }

    // Critical performance issues
    if (performance.totalSize > 2000000) { // 2MB
      critical.push('Bundle size exceeds 2MB - critical performance impact');
    }

    // Critical security issues
    const criticalSecurity = security.vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalSecurity.length > 0) {
      critical.push(`${criticalSecurity.length} critical security vulnerabilities found`);
    }

    // Critical SEO issues
    const criticalSEO = seo.issues.filter(issue => issue.priority === 'high');
    if (criticalSEO.length > 2) {
      critical.push('Multiple critical SEO issues affecting search visibility');
    }

    return critical;
  }

  private generateComprehensiveReport(data: any): string {
    return `
# Comprehensive App Validation Report

## Overall Score: ${data.overallScore}/100

${data.overallScore >= 90 ? '🎉 Excellent!' : 
  data.overallScore >= 80 ? '✅ Good' : 
  data.overallScore >= 70 ? '⚠️ Needs Improvement' : '❌ Critical Issues'}

## Test Results Summary

### Structure & Dependencies
- **Structure**: ${data.structure ? '✅ Valid' : '❌ Invalid'}
- **Dependencies**: ${data.dependencies ? '✅ Valid' : '❌ Invalid'}

### Quality Metrics
- **Accessibility**: ${data.accessibility.score}/100 (${data.accessibility.wcagLevel} compliant)
- **Performance**: ${data.performance.performance}/100
- **Security**: ${data.security.score}/100
- **SEO**: ${data.seo.score}/100

### Core Web Vitals
- **LCP**: ${data.performance.webVitals.lcp.toUpperCase()}
- **FID**: ${data.performance.webVitals.fid.toUpperCase()}
- **CLS**: ${data.performance.webVitals.cls.toUpperCase()}

## Critical Issues ${data.criticalIssues.length > 0 ? '🚨' : '✅'}
${data.criticalIssues.length > 0 ? 
  data.criticalIssues.map((issue: string) => `❌ ${issue}`).join('\n') : 
  '✅ No critical issues found'}

## Detailed Analysis

### Accessibility Issues
${data.accessibility.issues.length > 0 ? 
  data.accessibility.issues.slice(0, 5).map((issue: any) => 
    `- **${issue.severity.toUpperCase()}**: ${issue.message}`
  ).join('\n') : 
  '✅ No accessibility issues found'}

### Performance Issues
${data.performance.metrics.warnings.length > 0 ?
  data.performance.metrics.warnings.slice(0, 5).map((warning: string) => `- ${warning}`).join('\n') :
  '✅ No performance issues found'}

### Security Vulnerabilities
${data.security.vulnerabilities.length > 0 ?
  data.security.vulnerabilities.slice(0, 5).map((vuln: any) => 
    `- **${vuln.severity.toUpperCase()}**: ${vuln.description}`
  ).join('\n') :
  '✅ No security vulnerabilities found'}

### SEO Issues
${data.seo.issues.length > 0 ?
  data.seo.issues.slice(0, 5).map((issue: any) => 
    `- **${issue.priority.toUpperCase()}**: ${issue.description}`
  ).join('\n') :
  '✅ No SEO issues found'}

## Recommendations
${data.recommendations.map((rec: string) => `💡 ${rec}`).join('\n')}

## Next Steps
1. **Immediate**: Fix all critical issues
2. **Short-term**: Address high-priority warnings
3. **Medium-term**: Implement performance optimizations
4. **Long-term**: Monitor and maintain quality metrics

## Quality Gates
- ✅ All tests must pass
- ✅ Accessibility score > 85
- ✅ Performance score > 75
- ✅ Security score > 90
- ✅ No critical vulnerabilities

${data.overallScore >= 70 && data.criticalIssues.length === 0 ? 
  '🚀 **App is ready for deployment!**' : 
  '⚠️ **App needs improvements before deployment**'}
`;
  }

  async generateQualityGate(threshold: {
    accessibility?: number;
    performance?: number;
    security?: number;
    seo?: number;
  } = {}): Promise<string> {
    const defaults = {
      accessibility: 85,
      performance: 75,
      security: 90,
      seo: 70
    };

    const config = { ...defaults, ...threshold };

    return `
# Quality Gate Configuration

## Minimum Requirements
- **Accessibility**: ${config.accessibility}/100
- **Performance**: ${config.performance}/100  
- **Security**: ${config.security}/100
- **SEO**: ${config.seo}/100

## CI/CD Integration
\`\`\`yaml
# .github/workflows/quality-check.yml
name: Quality Gate
on: [push, pull_request]
jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Quality Tests
        run: |
          npm run test:quality
          npm run validate:app
      - name: Quality Gate
        run: |
          if [ $ACCESSIBILITY_SCORE -lt ${config.accessibility} ]; then exit 1; fi
          if [ $PERFORMANCE_SCORE -lt ${config.performance} ]; then exit 1; fi
          if [ $SECURITY_SCORE -lt ${config.security} ]; then exit 1; fi
          if [ $SEO_SCORE -lt ${config.seo} ]; then exit 1; fi
\`\`\`

## Package.json Scripts
\`\`\`json
{
  "scripts": {
    "test:quality": "lovable-testing validate",
    "test:a11y": "lovable-testing accessibility",
    "test:perf": "lovable-testing performance",
    "test:security": "lovable-testing security"
  }
}
\`\`\`
`;
  }
}

export default ValidationService;