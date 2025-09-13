export class TestGenerator {
  generateTests(
    blueprint: any,
    framework: 'jest' | 'vitest' | 'cypress' = 'vitest'
  ): Map<string, string> {
    const tests = new Map<string, string>();
    
    // Unit tests for components
    if (blueprint.components) {
      blueprint.components.forEach(component => {
        tests.set(
          `${component.name}.test.tsx`,
          this.generateComponentTest(component, framework)
        );
      });
    }
    
    // Integration tests for pages
    if (blueprint.pages) {
      blueprint.pages.forEach(page => {
        tests.set(
          `${page.name}.integration.test.ts`,
          this.generatePageTest(page, framework)
        );
      });
    }
    
    // E2E tests for user flows
    if (blueprint.userFlows) {
      blueprint.userFlows.forEach(flow => {
        tests.set(
          `${flow.name}.e2e.test.ts`,
          this.generateE2ETest(flow, framework)
        );
      });
    }
    
    return tests;
  }
  
  private generateComponentTest(component: any, framework: string): string {
    if (framework === 'vitest') {
      return `
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${component.name} } from '../components/${component.name}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    render(<${component.name} />);
    expect(screen.getByRole('${component.role || 'region'}')).toBeInTheDocument();
  });
  
  it('has correct props', () => {
    const { container } = render(<${component.name} testProp="value" />);
    expect(container.firstChild).toHaveAttribute('data-testid', '${component.name.toLowerCase()}');
  });
  
  ${component.interactive ? `
  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<${component.name} onClick={handleClick} />);
    
    const element = screen.getByRole('button');
    await user.click(element);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });` : ''}
  
  ${component.hasProps ? `
  it('displays props correctly', () => {
    const props = {
      title: 'Test Title',
      content: 'Test Content'
    };
    render(<${component.name} {...props} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });` : ''}
  
  ${component.hasState ? `
  it('manages state correctly', async () => {
    const user = userEvent.setup();
    render(<${component.name} />);
    
    const button = screen.getByRole('button');
    const initialText = screen.getByText(/initial/i);
    
    await user.click(button);
    
    expect(screen.queryByText(/initial/i)).not.toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });` : ''}
  
  it('has correct accessibility attributes', () => {
    render(<${component.name} />);
    const element = screen.getByRole('${component.role || 'region'}');
    
    expect(element).toHaveAttribute('aria-label');
    ${component.hasLabel ? `expect(element).toHaveAttribute('aria-labelledby');` : ''}
    ${component.hasDescription ? `expect(element).toHaveAttribute('aria-describedby');` : ''}
  });
  
  it('matches snapshot', () => {
    const { container } = render(<${component.name} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});`;
    }
    
    if (framework === 'jest') {
      return `
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ${component.name} } from '../components/${component.name}';

describe('${component.name}', () => {
  test('renders without crashing', () => {
    render(<${component.name} />);
    expect(screen.getByRole('${component.role || 'region'}')).toBeInTheDocument();
  });
  
  test('handles interactions', () => {
    const mockHandler = jest.fn();
    render(<${component.name} onClick={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});`;
    }
    
    return '// Test framework not supported';
  }
  
  private generatePageTest(page: any, framework: string): string {
    return `
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ${page.name}Page } from '../pages/${page.name}';

// Mock dependencies
vi.mock('../api/services', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mock data' }))
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('${page.name} Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('loads and displays content', async () => {
    renderWithRouter(<${page.name}Page />);
    
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/loading/i)).not.toBeInTheDocument();
  });
  
  it('handles navigation correctly', async () => {
    renderWithRouter(<${page.name}Page />);
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });
  
  ${page.hasForm ? `
  it('handles form submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<${page.name}Page />);
    
    const form = screen.getByRole('form');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });` : ''}
  
  ${page.hasData ? `
  it('fetches and displays data', async () => {
    renderWithRouter(<${page.name}Page />);
    
    await waitFor(() => {
      expect(screen.getByText('mock data')).toBeInTheDocument();
    });
  });` : ''}
  
  it('handles loading states', async () => {
    renderWithRouter(<${page.name}Page />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
  
  it('handles error states', async () => {
    // Mock error
    const mockError = vi.fn(() => Promise.reject(new Error('Test error')));
    
    renderWithRouter(<${page.name}Page />);
    
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).toBeInTheDocument();
    });
  });
});`;
  }
  
  private generateE2ETest(flow: any, framework: string): string {
    if (framework === 'cypress') {
      return `
describe('${flow.name} Flow', () => {
  beforeEach(() => {
    cy.visit('${flow.startUrl || '/'}');
    cy.viewport(1280, 720);
  });
  
  it('completes the full user flow', () => {
    ${flow.steps ? flow.steps.map(step => this.generateCypressStep(step)).join('\n    ') : '// No steps defined'}
    
    // Verify final state
    cy.url().should('include', '${flow.finalUrl || '/success'}');
    cy.contains('${flow.successMessage || 'Success'}').should('be.visible');
  });
  
  it('handles edge cases', () => {
    // Test with invalid inputs
    ${flow.edgeCases ? flow.edgeCases.map(edge => this.generateCypressStep(edge)).join('\n    ') : ''}
    
    cy.contains('${flow.errorMessage || 'Error'}').should('be.visible');
  });
  
  it('works on mobile devices', () => {
    cy.viewport('iphone-x');
    
    ${flow.steps ? flow.steps.slice(0, 3).map(step => this.generateCypressStep(step)).join('\n    ') : ''}
    
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
  });
  
  it('meets performance requirements', () => {
    cy.visit('${flow.startUrl || '/'}');
    
    // Check load time
    cy.window().its('performance').invoke('now').should('be.lessThan', 3000);
    
    // Check Core Web Vitals
    cy.get('body').should('be.visible');
    cy.wait(1000);
  });
});`;
    }
    
    return `
// Playwright E2E Test
import { test, expect } from '@playwright/test';

test.describe('${flow.name} Flow', () => {
  test('completes user flow', async ({ page }) => {
    await page.goto('${flow.startUrl || '/'}');
    
    ${flow.steps ? flow.steps.map(step => this.generatePlaywrightStep(step)).join('\n    ') : '// No steps defined'}
    
    await expect(page).toHaveURL(/${flow.finalUrl || 'success'}/);
    await expect(page.getByText('${flow.successMessage || 'Success'}')).toBeVisible();
  });
  
  test('handles errors gracefully', async ({ page }) => {
    await page.goto('${flow.startUrl || '/'}');
    
    // Simulate error conditions
    await page.route('**/api/**', route => route.abort());
    
    await expect(page.getByText(/error/i)).toBeVisible();
  });
});`;
  }
  
  private generateCypressStep(step: any): string {
    const actions = {
      'click': `cy.get('${step.selector}').click();`,
      'type': `cy.get('${step.selector}').type('${step.value}');`,
      'select': `cy.get('${step.selector}').select('${step.value}');`,
      'wait': `cy.wait(${step.duration || 1000});`,
      'verify': `cy.contains('${step.text}').should('be.visible');`,
      'scroll': `cy.scrollTo('${step.position || 'bottom'}');`,
      'hover': `cy.get('${step.selector}').trigger('mouseover');`,
      'upload': `cy.get('${step.selector}').selectFile('${step.file}');`
    };
    
    return actions[step.action] || `// ${step.action}: ${step.selector}`;
  }
  
  private generatePlaywrightStep(step: any): string {
    const actions = {
      'click': `await page.click('${step.selector}');`,
      'type': `await page.fill('${step.selector}', '${step.value}');`,
      'select': `await page.selectOption('${step.selector}', '${step.value}');`,
      'wait': `await page.waitForTimeout(${step.duration || 1000});`,
      'verify': `await expect(page.getByText('${step.text}')).toBeVisible();`,
      'scroll': `await page.mouse.wheel(0, 500);`,
      'hover': `await page.hover('${step.selector}');`,
      'upload': `await page.setInputFiles('${step.selector}', '${step.file}');`
    };
    
    return actions[step.action] || `// ${step.action}: ${step.selector}`;
  }
  
  generateTestConfig(framework: string): string {
    if (framework === 'vitest') {
      return `
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        'dist/'
      ]
    }
  }
});`;
    }
    
    if (framework === 'cypress') {
      return `
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});`;
    }
    
    return '// Config not supported';
  }
  
  generateSetupFile(framework: string): string {
    if (framework === 'vitest') {
      return `
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;`;
    }
    
    return '// Setup not supported';
  }
}

export default TestGenerator;