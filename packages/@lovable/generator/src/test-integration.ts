import { UnifiedGenerator } from './integration/unified-generator.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function testIntegration() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Missing ANTHROPIC_API_KEY');
    return;
  }
  
  console.log('🧪 Testing Unified Generation System\n');
  console.log('Components:');
  console.log('  ✅ Original generator (PureSonnet)');
  console.log('  ✅ Multi-agent AI system');
  console.log('  ✅ Template system');
  console.log('  ✅ WebContainer preview');
  console.log('\n' + '='.repeat(60) + '\n');
  
  const generator = new UnifiedGenerator(apiKey);
  
  // Test prompt that should match a template
  const prompt = "Create a SaaS dashboard with user management and billing";
  
  console.log(`📝 Prompt: "${prompt}"\n`);
  
  const result = await generator.generateWithPreview(prompt);
  
  if (result.success) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 INTEGRATION TEST SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log(`✅ Files generated: ${result.files.size}`);
    console.log(`✅ Preview URL: ${result.previewUrl}`);
    console.log(`✅ Sandbox ID: ${result.sandboxId}`);
    console.log(`✅ Project type: ${result.blueprint.projectType}`);
    
    console.log('\n📁 Generated files:');
    let count = 0;
    for (const [path] of result.files) {
      if (count++ < 10) {
        console.log(`  - ${path}`);
      }
    }
    if (count > 10) {
      console.log(`  ... and ${count - 10} more files`);
    }
  }
}

testIntegration().catch(console.error);