import { Anthropic } from '@anthropic-ai/sdk';

export class ReviewerAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async reviewCode(files: Map<string, string>) {
    console.log('🔍 Reviewer Agent: Analyzing code quality...');
    
    const issues = [];
    const improvements = [];
    
    for (const [path, code] of files) {
      // Check for common issues
      if (!code.includes('export default')) {
        issues.push(`${path}: Missing default export`);
      }
      
      if (code.includes('console.log')) {
        improvements.push(`${path}: Remove console.log statements`);
      }
      
      // Check for React best practices
      if (code.includes('useState') && !code.includes('import') && !code.includes('useState')) {
        issues.push(`${path}: useState used without import`);
      }
    }
    
    const report = {
      passed: issues.length === 0,
      issues,
      improvements,
      score: Math.max(0, 100 - (issues.length * 10) - (improvements.length * 5))
    };
    
    console.log(`✅ Review complete: Score ${report.score}/100`);
    
    return { files, report };
  }
}