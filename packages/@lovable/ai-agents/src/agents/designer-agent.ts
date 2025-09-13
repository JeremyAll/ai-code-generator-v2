import { Anthropic } from '@anthropic-ai/sdk';

export class DesignerAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async createDesignSystem(blueprint: any) {
    console.log('🎨 Designer Agent: Creating design system...');
    
    const systemPrompt = `You are a UI/UX designer.
    Create a complete design system based on the blueprint.
    
    Output JSON with:
    - colors: { primary, secondary, accent, background, text }
    - typography: { headings, body, sizes }
    - spacing: { small, medium, large, xlarge }
    - borderRadius: string
    - shadows: { small, medium, large }
    - animations: boolean
    - darkMode: boolean`;
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Create design system for: ${JSON.stringify(blueprint)}`
      }]
    });
    
    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    const designSystem = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
    
    console.log('✅ Design system created');
    return designSystem;
  }
}