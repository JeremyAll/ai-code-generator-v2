import { PureSonnetWorkflow } from '../workflows/pure-sonnet.js';
import { AIOrchestrator } from '@lovable/ai-agents';
import { TemplateManager } from '@lovable/templates';
import { SandboxManager } from '@lovable/sandbox';

export class UnifiedGenerator {
  private workflow: PureSonnetWorkflow;
  private orchestrator: AIOrchestrator;
  private templateManager: TemplateManager;
  private sandboxManager: SandboxManager;
  
  constructor(apiKey: string) {
    this.workflow = new PureSonnetWorkflow();
    this.orchestrator = new AIOrchestrator(apiKey);
    this.templateManager = new TemplateManager();
    this.sandboxManager = new SandboxManager();
  }
  
  async generateWithPreview(userPrompt: string) {
    console.log('🚀 UNIFIED GENERATION STARTING\n');
    
    try {
      // Step 1: Check for matching template
      console.log('📚 Checking templates...');
      const template = this.templateManager.findBestTemplate(userPrompt);
      
      let files: Map<string, string>;
      let blueprint: any;
      
      if (template) {
        console.log(`✅ Using template: ${template.name}`);
        
        // Generate with template + AI enhancement
        const baseFiles = await this.templateManager.generateFromTemplate(template);
        
        // Enhance with AI agents
        console.log('🤖 Enhancing with AI agents...');
        const aiResult = await this.orchestrator.generateApp(userPrompt);
        
        // Merge template + AI generated files
        files = new Map([...baseFiles, ...aiResult.files]);
        blueprint = aiResult.blueprint;
        
      } else {
        console.log('🤖 Full AI generation (no template match)');
        
        // Use multi-agent system
        const aiResult = await this.orchestrator.generateApp(userPrompt);
        files = aiResult.files;
        blueprint = aiResult.blueprint;
      }
      
      // Step 2: Create WebContainer sandbox
      console.log('\n📦 Creating sandbox preview...');
      const sandbox = await this.sandboxManager.createSandbox(
        `preview-${Date.now()}`,
        files
      );
      
      console.log(`\n✨ GENERATION COMPLETE!`);
      console.log(`📁 Files: ${files.size}`);
      console.log(`🌐 Preview: ${sandbox.previewUrl}`);
      console.log(`🎯 Type: ${blueprint.projectType}`);
      
      return {
        success: true,
        files,
        blueprint,
        previewUrl: sandbox.previewUrl,
        sandboxId: sandbox.id
      };
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      
      // Fallback to original workflow
      console.log('⚠️ Falling back to basic generation...');
      return this.workflow.generate(userPrompt);
    }
  }
  
  async updatePreview(sandboxId: string, files: Map<string, string>) {
    return this.sandboxManager.updateSandbox(sandboxId, files);
  }
}