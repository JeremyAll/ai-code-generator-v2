// Core services
export { TestGenerator } from './test-generator';
export { AccessibilityTester, type AccessibilityResult, type AccessibilityIssue } from './accessibility-tester';
export { PerformanceTester, type PerformanceMetrics, type CoreWebVitals, type LighthouseAudit } from './performance-tester';
export { ValidationService, type ValidationResult, type SecurityAudit, type SEOAudit } from './validation-service';

import { TestGenerator } from './test-generator';
import { AccessibilityTester } from './accessibility-tester';
import { PerformanceTester } from './performance-tester';
import { ValidationService } from './validation-service';

/**
 * Main function to validate and test generated applications
 * @param files - Map of generated files (filename -> content)
 * @param blueprint - Original blueprint used for generation
 * @param options - Testing configuration options
 * @returns Comprehensive validation results with tests and reports
 */
export async function validateAndTest(
  files: Map<string, string>,
  blueprint: any,
  options: {
    generateTests?: boolean;
    testFramework?: 'jest' | 'vitest' | 'cypress';
    includeE2E?: boolean;
    thresholds?: {
      accessibility?: number;
      performance?: number;
      security?: number;
      seo?: number;
    };
  } = {}
): Promise<{
  valid: boolean;
  score: number;
  tests: Map<string, string> | null;
  validation: ValidationResult;
  summary: string;
}> {
  const {
    generateTests = true,
    testFramework = 'vitest',
    includeE2E = true,
    thresholds = {}
  } = options;

  // Initialize services
  const validator = new ValidationService();
  const testGenerator = new TestGenerator();

  try {
    // Run comprehensive validation
    console.log('🔍 Running comprehensive app validation...');
    const validation = await validator.validateGeneratedApp(files, blueprint);

    // Generate tests if requested
    let tests: Map<string, string> | null = null;
    if (generateTests) {
      console.log('🧪 Generating test files...');
      tests = testGenerator.generateTests(blueprint, testFramework);

      // Add test configuration files
      tests.set('vitest.config.ts', testGenerator.generateTestConfig(testFramework));
      tests.set('src/test/setup.ts', testGenerator.generateSetupFile(testFramework));

      if (includeE2E && testFramework === 'cypress') {
        tests.set('cypress.config.ts', testGenerator.generateTestConfig('cypress'));
      }
    }

    // Generate summary
    const summary = generateValidationSummary(validation, tests?.size || 0);

    return {
      valid: validation.valid,
      score: validation.score,
      tests,
      validation,
      summary
    };

  } catch (error) {
    console.error('❌ Validation failed:', error);
    
    // Return fallback results
    return {
      valid: false,
      score: 0,
      tests: null,
      validation: {
        valid: false,
        score: 0,
        tests: {
          structure: false,
          dependencies: false,
          accessibility: 0,
          performance: 0,
          seo: false,
          security: false,
          bestPractices: false
        },
        details: {} as any,
        report: 'Validation failed due to error',
        recommendations: ['Fix validation errors and try again'],
        criticalIssues: ['Validation process failed']
      },
      summary: `❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Quick accessibility test for generated HTML
 * @param html - HTML content to test
 * @returns Accessibility test results
 */
export async function testAccessibility(html: string): Promise<{
  score: number;
  issues: any[];
  report: string;
}> {
  const tester = new AccessibilityTester();
  const results = await tester.testAccessibility(html);
  
  return {
    score: results.score,
    issues: results.issues,
    report: tester.generateA11yReport(results)
  };
}

/**
 * Quick performance test for generated files
 * @param files - Map of generated files
 * @param html - Main HTML content
 * @returns Performance test results
 */
export async function testPerformance(
  files: Map<string, string>,
  html: string = ''
): Promise<{
  score: number;
  metrics: any;
  report: string;
}> {
  const tester = new PerformanceTester();
  const metrics = tester.analyzeBundle(files);
  const webVitals = tester.checkCoreWebVitals(html);
  const lighthouse = tester.simulateLighthouseAudit(files, html);
  
  const report = tester.generatePerformanceReport(metrics, webVitals, lighthouse);
  
  return {
    score: metrics.score,
    metrics: { ...metrics, webVitals, lighthouse },
    report
  };
}

/**
 * Generate comprehensive test suite for an app
 * @param blueprint - App blueprint
 * @param framework - Testing framework to use
 * @returns Generated test files
 */
export function generateTestSuite(
  blueprint: any,
  framework: 'jest' | 'vitest' | 'cypress' = 'vitest'
): Map<string, string> {
  const generator = new TestGenerator();
  return generator.generateTests(blueprint, framework);
}

/**
 * Create quality gate configuration
 * @param thresholds - Quality thresholds
 * @returns Quality gate configuration string
 */
export async function createQualityGate(thresholds: {
  accessibility?: number;
  performance?: number;
  security?: number;
  seo?: number;
} = {}): Promise<string> {
  const validator = new ValidationService();
  return validator.generateQualityGate(thresholds);
}

/**
 * Batch validate multiple apps
 * @param apps - Array of app data (files and blueprint)
 * @returns Array of validation results
 */
export async function batchValidate(
  apps: Array<{
    name: string;
    files: Map<string, string>;
    blueprint: any;
  }>
): Promise<Array<{
  name: string;
  valid: boolean;
  score: number;
  summary: string;
}>> {
  const results = [];

  for (const app of apps) {
    console.log(`🔍 Validating ${app.name}...`);
    
    try {
      const result = await validateAndTest(app.files, app.blueprint, {
        generateTests: false // Skip test generation for batch
      });
      
      results.push({
        name: app.name,
        valid: result.valid,
        score: result.score,
        summary: result.summary
      });
    } catch (error) {
      results.push({
        name: app.name,
        valid: false,
        score: 0,
        summary: `❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  return results;
}

/**
 * Generate testing documentation
 * @param blueprint - App blueprint
 * @returns Testing guide documentation
 */
export async function generateTestingGuide(blueprint: any): Promise<string> {
  const accessibilityTester = new AccessibilityTester();
  const performanceTester = new PerformanceTester();
  
  const a11yChecklist = await accessibilityTester.generateAccessibilityChecklist();
  const perfBudget = performanceTester.generatePerformanceBudget();

  return `
# Testing Guide for Generated App

## Overview
This guide covers testing strategies and tools for your generated application.

## Test Types
1. **Unit Tests** - Test individual components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows
4. **Accessibility Tests** - Ensure WCAG compliance
5. **Performance Tests** - Monitor Core Web Vitals

## Setup Instructions

### Install Dependencies
\`\`\`bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev cypress axe-core @axe-core/playwright
\`\`\`

### Configuration Files
- \`vitest.config.ts\` - Unit test configuration
- \`cypress.config.ts\` - E2E test configuration
- \`src/test/setup.ts\` - Test environment setup

## Component Testing
${blueprint.components ? blueprint.components.map((comp: any) => `
### ${comp.name} Component
- Props validation
- User interaction testing
- Accessibility compliance
- Visual regression testing
`).join('\n') : 'No components specified'}

## Page Testing  
${blueprint.pages ? blueprint.pages.map((page: any) => `
### ${page.name} Page
- Route rendering
- Data fetching
- Form submission
- Navigation flows
`).join('\n') : 'No pages specified'}

## User Flow Testing
${blueprint.userFlows ? blueprint.userFlows.map((flow: any) => `
### ${flow.name} Flow
- Happy path testing
- Error handling
- Edge cases
- Performance impact
`).join('\n') : 'No user flows specified'}

${a11yChecklist}

${perfBudget}

## CI/CD Integration
\`\`\`yaml
# GitHub Actions workflow
name: Quality Assurance
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test
      - name: Run accessibility tests
        run: npm run test:a11y
      - name: Run performance tests
        run: npm run test:perf
      - name: Run E2E tests
        run: npm run test:e2e
\`\`\`

## Best Practices
1. **Test Coverage** - Aim for >80% code coverage
2. **Test Isolation** - Each test should be independent
3. **Realistic Data** - Use realistic test data and scenarios
4. **Performance** - Monitor test execution time
5. **Maintenance** - Keep tests up to date with code changes

## Monitoring
- Set up performance monitoring with Web Vitals
- Monitor accessibility compliance in production
- Track test coverage trends
- Set up alerts for quality regressions
`;
}

/**
 * Generate validation summary
 */
function generateValidationSummary(validation: ValidationResult, testCount: number): string {
  const status = validation.valid ? '✅ PASSED' : '❌ FAILED';
  const grade = validation.score >= 90 ? 'A' :
                validation.score >= 80 ? 'B' :
                validation.score >= 70 ? 'C' :
                validation.score >= 60 ? 'D' : 'F';

  return `
${status} - Overall Score: ${validation.score}/100 (Grade: ${grade})

📊 Test Results:
- Structure: ${validation.tests.structure ? '✅' : '❌'}
- Dependencies: ${validation.tests.dependencies ? '✅' : '❌'}
- Accessibility: ${validation.tests.accessibility}/100
- Performance: ${validation.tests.performance}/100
- Security: ${validation.tests.security ? '✅' : '❌'}
- SEO: ${validation.tests.seo ? '✅' : '❌'}

🧪 Generated Tests: ${testCount} files
🚨 Critical Issues: ${validation.criticalIssues.length}
💡 Recommendations: ${validation.recommendations.length}

${validation.valid ? '🚀 Ready for deployment!' : '⚠️ Needs improvement before deployment'}
`;
}

// Default export with all main functions
export default {
  validateAndTest,
  testAccessibility,
  testPerformance,
  generateTestSuite,
  createQualityGate,
  batchValidate,
  generateTestingGuide,
  
  // Classes for advanced usage
  TestGenerator,
  AccessibilityTester,
  PerformanceTester,
  ValidationService
};

// Type exports for TypeScript users
export type {
  ValidationResult,
  SecurityAudit,
  SEOAudit,
  AccessibilityResult,
  AccessibilityIssue,
  PerformanceMetrics,
  CoreWebVitals,
  LighthouseAudit
};