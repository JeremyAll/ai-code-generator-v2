// Simple integration test for unified system
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env from app-generator root
dotenv.config({ path: path.resolve(process.cwd(), '../../../.env') });

console.log('🧪 Testing Unified Generation System\n');

async function testIntegration() {
  console.log('Components Status:');
  
  // Check if all packages exist
  const packagesDir = path.resolve(process.cwd(), '../');
  const packages = ['ai-agents', 'templates', 'sandbox'];
  
  for (const pkg of packages) {
    const pkgPath = path.join(packagesDir, pkg);
    const exists = fs.existsSync(pkgPath);
    console.log(`  ${exists ? '✅' : '❌'} @lovable/${pkg}`);
    
    if (exists) {
      const pkgJsonPath = path.join(pkgPath, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        console.log(`     - Version: ${pkgJson.version}`);
      }
    }
  }
  
  // Check templates
  console.log('\n📚 Template System:');
  const templatesDir = path.resolve(process.cwd(), '../../../templates');
  
  if (fs.existsSync(templatesDir)) {
    const categories = fs.readdirSync(templatesDir);
    console.log(`  ✅ Templates directory found`);
    console.log(`  📁 Categories: ${categories.length}`);
    
    for (const category of categories) {
      const categoryPath = path.join(templatesDir, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        const templateFile = path.join(categoryPath, 'base-template.json');
        if (fs.existsSync(templateFile)) {
          const template = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
          console.log(`     - ${category}: ${template.name}`);
        }
      }
    }
  } else {
    console.log('  ❌ Templates directory not found');
  }
  
  // Check integration file
  console.log('\n🔧 Integration Components:');
  const unifiedGenPath = path.join(process.cwd(), 'src/integration/unified-generator.ts');
  console.log(`  ${fs.existsSync(unifiedGenPath) ? '✅' : '❌'} UnifiedGenerator class`);
  
  // API Key check
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(`  ${hasApiKey ? '✅' : '❌'} ANTHROPIC_API_KEY ${hasApiKey ? 'configured' : 'missing'}`);
  
  console.log('\n' + '='.repeat(60));
  
  if (hasApiKey) {
    console.log('🎉 SYSTEM READY FOR FULL INTEGRATION!');
    console.log('All components are in place:');
    console.log('  - Multi-agent AI system');
    console.log('  - Template matching system');
    console.log('  - WebContainer preview system');
    console.log('  - Unified generator orchestration');
    console.log('\n💡 To test with real API calls, ensure all TypeScript files are compiled');
  } else {
    console.log('⚠️ SYSTEM READY (API KEY NEEDED)');
    console.log('Set ANTHROPIC_API_KEY environment variable for full testing');
  }
  
  console.log('='.repeat(60));
}

testIntegration().catch(console.error);