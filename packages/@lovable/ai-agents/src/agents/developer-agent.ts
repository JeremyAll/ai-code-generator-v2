import { Anthropic } from '@anthropic-ai/sdk';

export class DeveloperAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async generateCode(blueprint: any, designSystem: any) {
    console.log('💻 Developer Agent: Generating code...');
    
    const files = new Map<string, string>();
    
    // Generate main app file
    const appCode = await this.generateComponent('App', blueprint, designSystem);
    files.set('src/App.jsx', appCode);
    
    // Generate components
    for (const component of blueprint.components || []) {
      const code = await this.generateComponent(component, blueprint, designSystem);
      files.set(`src/components/${component}.jsx`, code);
    }
    
    // Generate pages
    for (const page of blueprint.pages || []) {
      const code = await this.generatePage(page, blueprint, designSystem);
      files.set(`src/pages/${page}.jsx`, code);
    }
    
    console.log(`✅ Generated ${files.size} files`);
    return files;
  }
  
  private async generateComponent(name: string, blueprint: any, design: any) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Generate a React component "${name}" with this design system:
        ${JSON.stringify(design)}
        For this blueprint: ${JSON.stringify(blueprint)}
        
        Return ONLY the code, no explanations.`
      }]
    });
    
    return response.content[0].text;
  }
  
  private async generatePage(name: string, blueprint: any, design: any) {
    return this.generateComponent(`${name}Page`, blueprint, design);
  }
}