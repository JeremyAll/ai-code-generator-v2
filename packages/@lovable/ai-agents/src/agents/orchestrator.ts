import { ArchitectAgent } from './architect-agent.js';
import { DesignerAgent } from './designer-agent.js';
import { DeveloperAgent } from './developer-agent.js';
import { ReviewerAgent } from './reviewer-agent.js';
import { TesterAgent } from './tester-agent.js';

export class AIOrchestrator {
  private architectAgent: ArchitectAgent;
  private designerAgent: DesignerAgent;
  private developerAgent: DeveloperAgent;
  private reviewerAgent: ReviewerAgent;
  private testerAgent: TesterAgent;
  
  constructor(apiKey: string) {
    this.architectAgent = new ArchitectAgent(apiKey);
    this.designerAgent = new DesignerAgent(apiKey);
    this.developerAgent = new DeveloperAgent(apiKey);
    this.reviewerAgent = new ReviewerAgent(apiKey);
    this.testerAgent = new TesterAgent(apiKey);
  }
  
  async generateApp(userPrompt: string) {
    console.log('🤖 AI Orchestrator: Starting 5-agent generation...\n');
    
    try {
      // Phase 1: Architecture
      console.log('📐 PHASE 1: Architecture Analysis');
      const blueprint = await this.architectAgent.analyzePrompt(userPrompt);
      
      // Phase 2: Design
      console.log('\n🎨 PHASE 2: Design System Creation');
      const designSystem = await this.designerAgent.createDesignSystem(blueprint);
      
      // Phase 3: Development
      console.log('\n💻 PHASE 3: Code Generation');
      const files = await this.developerAgent.generateCode(blueprint, designSystem);
      
      // Phase 4: Review
      console.log('\n🔍 PHASE 4: Code Review');
      const { files: reviewedFiles, report } = await this.reviewerAgent.reviewCode(files);
      
      // Phase 5: Testing
      console.log('\n🧪 PHASE 5: Test Generation');
      const testFiles = await this.testerAgent.generateTests(reviewedFiles, blueprint);
      
      // Merge all files
      const allFiles = new Map([...reviewedFiles, ...testFiles]);
      
      console.log('\n✅ Generation complete with 5 agents!');
      console.log(`📊 Stats:`);
      console.log(`   - Total files: ${allFiles.size}`);
      console.log(`   - App files: ${reviewedFiles.size}`);
      console.log(`   - Test files: ${testFiles.size}`);
      console.log(`   - Quality score: ${report.score}/100`);
      
      return {
        blueprint,
        designSystem,
        files: allFiles,
        reviewReport: report,
        stats: {
          totalFiles: allFiles.size,
          appFiles: reviewedFiles.size,
          testFiles: testFiles.size,
          components: blueprint.components?.length || 0,
          pages: blueprint.pages?.length || 0,
          qualityScore: report.score
        }
      };
      
    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      throw error;
    }
  }
}