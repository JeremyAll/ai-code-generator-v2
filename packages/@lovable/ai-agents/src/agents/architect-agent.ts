import { Anthropic } from '@anthropic-ai/sdk';
import { BAMLCore } from '../baml-system/baml-core.js';
import { DomainDetector } from '../baml-system/domain-detector.js';
import { ecommercePromptV1 } from '../baml-system/domain-prompts/ecommerce-v1.js';
import { saasPromptV1 } from '../baml-system/domain-prompts/saas-v1.js';
import { landingPromptV1 } from '../baml-system/domain-prompts/landing-v1.js';
import { checkEvolution } from '../baml-system/evolution-tracker.js';

export class ArchitectAgent {
  private client: Anthropic;
  private model = 'claude-sonnet-4-20250514';  // Ton modèle exact
  private bamlCore: BAMLCore;
  private detector: DomainDetector;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
    
    // Initialize BAML system
    this.bamlCore = new BAMLCore();
    this.detector = new DomainDetector();
    
    // Register current prompts (PHASE 1 + Quick Win)
    this.bamlCore.registerPrompt(ecommercePromptV1);
    this.bamlCore.registerPrompt(saasPromptV1);
    this.bamlCore.registerPrompt(landingPromptV1);
    
    // TODO PHASE 2: Register dashboard prompts + more domains
    // TODO PHASE 3: Register all 8+ domain prompts
    
    // Show evolution status
    checkEvolution();
  }
  
  async analyzePrompt(userPrompt: string) {
    console.log('🏗️ Architect Agent: Using BAML System v1...');
    
    // Detect domain
    const domain = this.detector.detect(userPrompt);
    console.log(`📍 Detected domain: ${domain}`);
    console.log('🔍 Detection scores:', this.detector.getScores(userPrompt));
    
    // Select prompt
    const promptId = `${domain}-v1`;
    
    try {
      // Execute with BAML
      const result = await this.bamlCore.execute(promptId, {
        description: userPrompt
      });
      
      console.log(`✅ Quality: ${result.quality}/10`);
      
      if (result.fromCache) {
        console.log('📦 Result from cache');
      }
      
      if (result.quality < 7) {
        console.warn('⚠️ Quality below threshold');
        // TODO PHASE 2: Auto-enhance here
      }
      
      return result.output;
      
    } catch (error) {
      console.error('❌ BAML execution failed, falling back...', error.message);
      // Fallback to original method
      return this.analyzePromptOriginal(userPrompt);
    }
  }
  
  async analyzePromptOriginal(userPrompt: string) {
    console.log('🏗️ Architect Agent: Fallback to original analysis...');
    
    const systemPrompt = `You are an expert software architect.
    Analyze the user's request and create a detailed technical blueprint.
    
    Output a JSON with:
    - projectType: 'webapp' | 'landing' | 'dashboard' | 'ecommerce' | 'blog'
    - framework: 'react' | 'nextjs' | 'vue' | 'svelte'
    - features: string[] (list of features needed)
    - components: string[] (UI components to create)
    - pages: string[] (pages/routes needed)
    - apis: string[] (API endpoints if needed)
    - database: boolean (needs database?)
    - authentication: boolean (needs auth?)
    - styling: 'tailwind' | 'css' | 'styled-components'
    - complexity: 'simple' | 'medium' | 'complex'`;
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Analyze this request and create a technical blueprint: "${userPrompt}"`
      }]
    });
    
    const content = response.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    const blueprint = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
    
    console.log('✅ Blueprint created:', blueprint.projectType);
    return blueprint;
  }
}