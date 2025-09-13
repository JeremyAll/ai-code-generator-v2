export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  element: string;
  line?: number;
  suggestion?: string;
}

export interface AccessibilityResult {
  score: number;
  issues: AccessibilityIssue[];
  passedRules: string[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export class AccessibilityTester {
  private wcagRules = {
    'img-alt': { level: 'A', weight: 5 },
    'form-label': { level: 'A', weight: 4 },
    'heading-order': { level: 'AA', weight: 3 },
    'color-contrast': { level: 'AA', weight: 4 },
    'keyboard-navigation': { level: 'A', weight: 5 },
    'aria-roles': { level: 'AA', weight: 3 },
    'focus-management': { level: 'A', weight: 4 },
    'semantic-markup': { level: 'A', weight: 3 },
    'link-purpose': { level: 'AA', weight: 2 },
    'page-title': { level: 'A', weight: 3 },
    'lang-attribute': { level: 'A', weight: 2 }
  };

  async testAccessibility(html: string): Promise<AccessibilityResult> {
    const issues: AccessibilityIssue[] = [];
    const passedRules: string[] = [];
    let score = 100;

    // Check for alt attributes on images
    await this.checkImageAltText(html, issues, passedRules);
    
    // Check for form labels
    await this.checkFormLabels(html, issues, passedRules);
    
    // Check heading hierarchy
    await this.checkHeadingHierarchy(html, issues, passedRules);
    
    // Check color contrast
    await this.checkColorContrast(html, issues, passedRules);
    
    // Check ARIA attributes
    await this.checkAriaAttributes(html, issues, passedRules);
    
    // Check semantic markup
    await this.checkSemanticMarkup(html, issues, passedRules);
    
    // Check keyboard navigation
    await this.checkKeyboardNavigation(html, issues, passedRules);
    
    // Check focus management
    await this.checkFocusManagement(html, issues, passedRules);
    
    // Check page structure
    await this.checkPageStructure(html, issues, passedRules);
    
    // Check link purpose
    await this.checkLinkPurpose(html, issues, passedRules);

    // Calculate score
    issues.forEach(issue => {
      const rule = this.wcagRules[issue.rule as keyof typeof this.wcagRules];
      if (rule) {
        const penalty = issue.severity === 'error' ? rule.weight : 
                       issue.severity === 'warning' ? rule.weight * 0.6 : 
                       rule.weight * 0.3;
        score -= penalty;
      }
    });

    // Determine WCAG level
    const errorRules = issues.filter(i => i.severity === 'error').map(i => i.rule);
    const wcagLevel = this.determineWCAGLevel(errorRules);

    return {
      score: Math.max(0, Math.round(score)),
      issues,
      passedRules,
      wcagLevel
    };
  }

  private async checkImageAltText(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const imgRegex = /<img[^>]*>/gi;
    const images = html.match(imgRegex) || [];
    let hasIssues = false;

    images.forEach((img, index) => {
      const hasAlt = /alt\s*=\s*["'][^"']*["']/i.test(img);
      const isEmpty = /alt\s*=\s*["']\s*["']/i.test(img);
      const isDecorative = /alt\s*=\s*["']\s*["']/i.test(img) || /role\s*=\s*["']presentation["']/i.test(img);
      
      if (!hasAlt && !isDecorative) {
        issues.push({
          severity: 'error',
          rule: 'img-alt',
          message: 'Image missing alt attribute',
          element: img.substring(0, 100) + '...',
          line: this.getLineNumber(html, img),
          suggestion: 'Add descriptive alt text or alt="" for decorative images'
        });
        hasIssues = true;
      } else if (isEmpty && !isDecorative) {
        issues.push({
          severity: 'warning',
          rule: 'img-alt',
          message: 'Image has empty alt text but may not be decorative',
          element: img.substring(0, 100) + '...',
          line: this.getLineNumber(html, img),
          suggestion: 'Provide descriptive alt text or confirm image is decorative'
        });
        hasIssues = true;
      }
    });

    if (!hasIssues && images.length > 0) {
      passedRules.push('img-alt');
    }
  }

  private async checkFormLabels(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const inputRegex = /<input(?![^>]*type\s*=\s*["'](?:submit|button|reset)["'])[^>]*>/gi;
    const inputs = html.match(inputRegex) || [];
    let hasIssues = false;

    inputs.forEach(input => {
      const hasLabel = /aria-label\s*=/i.test(input) || 
                     /aria-labelledby\s*=/i.test(input) ||
                     /id\s*=\s*["']([^"']+)["']/i.test(input);
      
      if (hasLabel && /id\s*=\s*["']([^"']+)["']/i.test(input)) {
        const idMatch = input.match(/id\s*=\s*["']([^"']+)["']/i);
        if (idMatch) {
          const labelRegex = new RegExp(`<label[^>]*for\\s*=\\s*["']${idMatch[1]}["']`, 'i');
          if (!labelRegex.test(html)) {
            issues.push({
              severity: 'error',
              rule: 'form-label',
              message: 'Form input missing associated label',
              element: input.substring(0, 100) + '...',
              suggestion: 'Add a <label> element with matching for attribute'
            });
            hasIssues = true;
          }
        }
      } else if (!hasLabel) {
        issues.push({
          severity: 'error',
          rule: 'form-label',
          message: 'Form input missing label or aria-label',
          element: input.substring(0, 100) + '...',
          suggestion: 'Add aria-label attribute or associated label element'
        });
        hasIssues = true;
      }
    });

    if (!hasIssues && inputs.length > 0) {
      passedRules.push('form-label');
    }
  }

  private async checkHeadingHierarchy(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const headingRegex = /<h([1-6])[^>]*>/gi;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        element: match[0],
        position: match.index
      });
    }

    let hasIssues = false;
    let lastLevel = 0;

    headings.forEach((heading, index) => {
      // Check for skipped levels
      if (heading.level - lastLevel > 1) {
        issues.push({
          severity: 'warning',
          rule: 'heading-order',
          message: `Heading level skipped (h${lastLevel} to h${heading.level})`,
          element: heading.element,
          line: this.getLineNumber(html, heading.element),
          suggestion: `Use h${lastLevel + 1} instead of h${heading.level}`
        });
        hasIssues = true;
      }

      // Check for multiple h1s
      if (heading.level === 1 && headings.filter(h => h.level === 1).length > 1) {
        issues.push({
          severity: 'warning',
          rule: 'heading-order',
          message: 'Multiple h1 elements found',
          element: heading.element,
          suggestion: 'Use only one h1 per page'
        });
        hasIssues = true;
      }

      lastLevel = heading.level;
    });

    if (!hasIssues && headings.length > 0) {
      passedRules.push('heading-order');
    }
  }

  private async checkColorContrast(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    // Simplified color contrast check
    const lowContrastPatterns = [
      /color:\s*#[cdefCDEF]{3,6}/g,
      /background.*#[cdefCDEF]{3,6}/g,
      /color:\s*rgb\(\s*2[0-9][0-9],\s*2[0-9][0-9],\s*2[0-9][0-9]\s*\)/g
    ];

    let hasIssues = false;

    lowContrastPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            severity: 'warning',
            rule: 'color-contrast',
            message: 'Potential low color contrast detected',
            element: match,
            suggestion: 'Ensure color contrast ratio meets WCAG AA standards (4.5:1 for normal text)'
          });
          hasIssues = true;
        });
      }
    });

    if (!hasIssues) {
      passedRules.push('color-contrast');
    }
  }

  private async checkAriaAttributes(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const hasAriaRoles = /role\s*=/i.test(html);
    const hasAriaLabels = /aria-label/i.test(html);
    const hasAriaDescriptions = /aria-describedby/i.test(html);

    let hasIssues = false;

    // Check for interactive elements without proper ARIA
    const interactiveElements = html.match(/<(button|a|input|select|textarea)[^>]*>/gi) || [];
    
    interactiveElements.forEach(element => {
      if (!(/aria-label/i.test(element) || /aria-labelledby/i.test(element) || /<.*>.*<.*>/s.test(element))) {
        issues.push({
          severity: 'info',
          rule: 'aria-roles',
          message: 'Interactive element could benefit from ARIA label',
          element: element.substring(0, 100) + '...',
          suggestion: 'Add aria-label or aria-labelledby for better accessibility'
        });
        hasIssues = true;
      }
    });

    if (!hasAriaRoles && !hasAriaLabels && !hasAriaDescriptions) {
      issues.push({
        severity: 'warning',
        rule: 'aria-roles',
        message: 'No ARIA attributes found',
        element: 'document',
        suggestion: 'Consider adding ARIA roles and labels for better accessibility'
      });
      hasIssues = true;
    }

    if (!hasIssues) {
      passedRules.push('aria-roles');
    }
  }

  private async checkSemanticMarkup(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const semanticElements = ['main', 'nav', 'header', 'footer', 'article', 'section', 'aside'];
    const foundElements = semanticElements.filter(element => 
      new RegExp(`<${element}[^>]*>`, 'i').test(html)
    );

    if (foundElements.length < 2) {
      issues.push({
        severity: 'info',
        rule: 'semantic-markup',
        message: 'Limited use of semantic HTML elements',
        element: 'document structure',
        suggestion: 'Use semantic elements like <main>, <nav>, <header>, <footer> for better structure'
      });
    } else {
      passedRules.push('semantic-markup');
    }
  }

  private async checkKeyboardNavigation(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const interactiveElements = html.match(/<(button|a|input|select|textarea)[^>]*>/gi) || [];
    let hasIssues = false;

    interactiveElements.forEach(element => {
      if (/tabindex\s*=\s*["']-[1-9]/i.test(element)) {
        issues.push({
          severity: 'error',
          rule: 'keyboard-navigation',
          message: 'Negative tabindex removes element from keyboard navigation',
          element: element.substring(0, 100) + '...',
          suggestion: 'Use tabindex="0" or remove tabindex attribute'
        });
        hasIssues = true;
      }
    });

    // Check for skip links
    const hasSkipLink = /skip.{0,10}(to|content|main|navigation)/i.test(html);
    if (!hasSkipLink) {
      issues.push({
        severity: 'info',
        rule: 'keyboard-navigation',
        message: 'No skip link found',
        element: 'document',
        suggestion: 'Add a skip link for keyboard navigation'
      });
      hasIssues = true;
    }

    if (!hasIssues) {
      passedRules.push('keyboard-navigation');
    }
  }

  private async checkFocusManagement(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    // Check for focus traps in modals
    const modals = html.match(/<div[^>]*modal[^>]*>/gi) || [];
    
    if (modals.length > 0) {
      const hasFocusTrap = /focus.{0,20}trap/i.test(html) || /tabindex/i.test(html);
      if (!hasFocusTrap) {
        issues.push({
          severity: 'warning',
          rule: 'focus-management',
          message: 'Modal may not trap focus properly',
          element: 'modal elements',
          suggestion: 'Implement focus trapping in modal dialogs'
        });
      } else {
        passedRules.push('focus-management');
      }
    } else {
      passedRules.push('focus-management');
    }
  }

  private async checkPageStructure(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const hasTitle = /<title[^>]*>.*<\/title>/i.test(html);
    const hasLang = /<html[^>]*lang\s*=/i.test(html);

    if (!hasTitle) {
      issues.push({
        severity: 'error',
        rule: 'page-title',
        message: 'Page missing title element',
        element: 'document head',
        suggestion: 'Add descriptive <title> element'
      });
    } else {
      passedRules.push('page-title');
    }

    if (!hasLang) {
      issues.push({
        severity: 'error',
        rule: 'lang-attribute',
        message: 'HTML element missing lang attribute',
        element: '<html>',
        suggestion: 'Add lang="en" or appropriate language code to <html> element'
      });
    } else {
      passedRules.push('lang-attribute');
    }
  }

  private async checkLinkPurpose(html: string, issues: AccessibilityIssue[], passedRules: string[]): Promise<void> {
    const links = html.match(/<a[^>]*>.*?<\/a>/gi) || [];
    let hasIssues = false;

    links.forEach(link => {
      const linkText = link.replace(/<[^>]*>/g, '').trim();
      const vaguePhrases = ['click here', 'read more', 'here', 'more', 'link'];
      
      if (vaguePhrases.some(phrase => linkText.toLowerCase().includes(phrase))) {
        issues.push({
          severity: 'warning',
          rule: 'link-purpose',
          message: `Link text "${linkText}" is not descriptive`,
          element: link.substring(0, 100) + '...',
          suggestion: 'Use descriptive link text that explains the destination'
        });
        hasIssues = true;
      }
    });

    if (!hasIssues && links.length > 0) {
      passedRules.push('link-purpose');
    }
  }

  private determineWCAGLevel(errorRules: string[]): 'A' | 'AA' | 'AAA' {
    const levelAErrors = errorRules.filter(rule => 
      this.wcagRules[rule as keyof typeof this.wcagRules]?.level === 'A'
    );
    
    const levelAAErrors = errorRules.filter(rule => 
      this.wcagRules[rule as keyof typeof this.wcagRules]?.level === 'AA'
    );

    if (levelAErrors.length > 0) return 'A';
    if (levelAAErrors.length > 0) return 'AA';
    return 'AAA';
  }

  private getLineNumber(html: string, element: string): number {
    const index = html.indexOf(element);
    if (index === -1) return 1;
    
    return html.substring(0, index).split('\n').length;
  }

  generateA11yReport(results: AccessibilityResult): string {
    return `
# Accessibility Report

## Overall Score: ${results.score}/100
## WCAG Compliance Level: ${results.wcagLevel}

## Summary
- **Issues Found**: ${results.issues.length}
- **Rules Passed**: ${results.passedRules.length}
- **Errors**: ${results.issues.filter(i => i.severity === 'error').length}
- **Warnings**: ${results.issues.filter(i => i.severity === 'warning').length}
- **Info**: ${results.issues.filter(i => i.severity === 'info').length}

## Critical Issues (Errors)
${results.issues
  .filter(i => i.severity === 'error')
  .map(i => `### ${i.rule.toUpperCase()}
- **Message**: ${i.message}
- **Element**: \`${i.element}\`
- **Suggestion**: ${i.suggestion || 'No suggestion available'}
${i.line ? `- **Line**: ${i.line}` : ''}
`).join('\n')}

## Warnings
${results.issues
  .filter(i => i.severity === 'warning')
  .map(i => `### ${i.rule}
- ${i.message}
- **Suggestion**: ${i.suggestion || 'No suggestion available'}
`).join('\n')}

## Recommendations
${results.issues
  .filter(i => i.severity === 'info')
  .map(i => `### ${i.rule}
- ${i.message}
- **Suggestion**: ${i.suggestion || 'No suggestion available'}
`).join('\n')}

## Passed Rules ✅
${results.passedRules.map(rule => `- ${rule}`).join('\n')}

## Next Steps
1. Fix all critical errors first
2. Address warnings that impact user experience
3. Consider implementing recommendations for better accessibility
4. Test with screen readers and keyboard navigation
5. Validate with automated tools like axe-core or WAVE

## WCAG Guidelines Reference
- **Level A**: Basic accessibility features
- **Level AA**: Standard level for most compliance requirements
- **Level AAA**: Enhanced level, not required for general compliance

Current compliance level: **${results.wcagLevel}**
`;
  }

  async generateAccessibilityChecklist(): Promise<string> {
    return `
# Accessibility Testing Checklist

## Images & Media
- [ ] All images have appropriate alt text
- [ ] Decorative images have empty alt text or role="presentation"
- [ ] Complex images have long descriptions
- [ ] Videos have captions and transcripts

## Forms
- [ ] All form controls have labels
- [ ] Labels are properly associated with controls
- [ ] Required fields are clearly indicated
- [ ] Error messages are descriptive and helpful

## Navigation
- [ ] Skip links are provided
- [ ] Navigation is consistent across pages
- [ ] Focus indicators are visible
- [ ] Tab order is logical

## Structure
- [ ] Headings follow proper hierarchy (h1, h2, h3...)
- [ ] Only one h1 per page
- [ ] Semantic elements are used appropriately
- [ ] Page has descriptive title

## Color & Contrast
- [ ] Color contrast meets WCAG AA standards
- [ ] Information is not conveyed by color alone
- [ ] Text is readable at 200% zoom

## ARIA
- [ ] ARIA labels are provided where needed
- [ ] ARIA roles are used correctly
- [ ] Live regions announce dynamic content

## Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Focus management in modals and dropdowns
- [ ] No keyboard traps (except in modals)

## Testing
- [ ] Test with screen reader
- [ ] Test with keyboard only
- [ ] Test at high magnification
- [ ] Run automated accessibility tests
`;
  }
}

export default AccessibilityTester;