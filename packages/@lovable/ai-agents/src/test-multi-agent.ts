import { AIOrchestrator } from './agents/orchestrator.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from app-generator  
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function testMultiAgent() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing ANTHROPIC_API_KEY in .env');
    console.log('Make sure you have a .env file at the root with:');
    console.log('ANTHROPIC_API_KEY=sk-ant-...');
    return;
  }
  
  const orchestrator = new AIOrchestrator(apiKey);
  
  // Test with a simple prompt
  const testPrompt = "Create a modern landing page for a SaaS product with pricing";
  
  console.log('🚀 Testing Multi-Agent System');
  console.log(`📝 Prompt: "${testPrompt}"`);
  console.log('='.repeat(60));
  
  try {
    const result = await orchestrator.generateApp(testPrompt);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS:');
    console.log('='.repeat(60));
    console.log(`✅ Blueprint Type: ${result.blueprint.projectType}`);
    console.log(`✅ Framework: ${result.blueprint.framework}`);
    console.log(`✅ Files Generated: ${result.stats.totalFiles}`);
    console.log(`✅ Components: ${result.stats.components}`);
    console.log(`✅ Pages: ${result.stats.pages}`);
    console.log(`✅ Test Files: ${result.stats.testFiles}`);
    console.log(`✅ Quality Score: ${result.reviewReport.score}/100`);
    
    if (result.reviewReport.issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      result.reviewReport.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.reviewReport.improvements.length > 0) {
      console.log('\n💡 Suggested Improvements:');
      result.reviewReport.improvements.forEach(imp => console.log(`  - ${imp}`));
    }
    
    console.log('\n✨ Multi-Agent System Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMultiAgent().catch(console.error);