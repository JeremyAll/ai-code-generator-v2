import { Anthropic } from '@anthropic-ai/sdk';

export class TesterAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async generateTests(files: Map<string, string>, blueprint: any) {
    console.log('🧪 Tester Agent: Generating tests...');
    
    const testFiles = new Map<string, string>();
    
    // Generate E2E tests with Playwright
    const e2eTests = await this.generateE2ETests(blueprint);
    testFiles.set('tests/e2e/app.spec.ts', e2eTests);
    
    // Generate unit tests for components
    for (const [path, code] of files) {
      if (path.includes('components/')) {
        const componentName = path.split('/').pop()?.replace('.jsx', '');
        const unitTest = await this.generateUnitTest(componentName, code);
        testFiles.set(`tests/unit/${componentName}.test.tsx`, unitTest);
      }
    }
    
    // Generate accessibility tests
    const a11yTests = this.generateA11yTests();
    testFiles.set('tests/a11y/accessibility.spec.ts', a11yTests);
    
    console.log(`✅ Generated ${testFiles.size} test files`);
    return testFiles;
  }
  
  private async generateE2ETests(blueprint: any): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Generate Playwright E2E tests for this app: ${JSON.stringify(blueprint)}
        
        Include tests for:
        - Navigation
        - User interactions
        - Form submissions
        - Error states
        
        Return ONLY the code.`
      }]
    });
    
    return response.content[0].text;
  }
  
  private async generateUnitTest(name: string, code: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Generate Vitest unit tests for this React component:
        
        ${code}
        
        Test:
        - Rendering
        - Props
        - Events
        - States
        
        Return ONLY the test code.`
      }]
    });
    
    return response.content[0].text;
  }
  
  private generateA11yTests(): string {
    return `
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('should pass accessibility checks', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page);
  });
  
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });
  
  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});`;
  }
}