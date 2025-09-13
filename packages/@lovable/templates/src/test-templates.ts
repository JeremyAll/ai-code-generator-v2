import { TemplateManager } from './template-manager.js';

async function testTemplates() {
  console.log('🧪 Testing Template System\n');
  
  const manager = new TemplateManager();
  
  // Wait for templates to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: List all templates
  console.log('📋 Available Templates:');
  const allTemplates = manager.getAllTemplates();
  allTemplates.forEach(t => {
    console.log(`  - ${t.name} (${t.category})`);
  });
  
  // Test 2: Find best template
  const testPrompts = [
    "Create a SaaS dashboard with billing",
    "Build an e-commerce store for shoes",
    "Make a landing page for startup"
  ];
  
  console.log('\n🔍 Template Matching:');
  for (const prompt of testPrompts) {
    const template = manager.findBestTemplate(prompt);
    console.log(`  "${prompt}" → ${template?.name || 'No match'}`);
  }
  
  // Test 3: Generate from template
  const saasTemplate = manager.getTemplate('saas-base');
  if (saasTemplate) {
    console.log('\n🏗️ Generating from SaaS template...');
    const files = await manager.generateFromTemplate(saasTemplate, {
      name: 'my-saas-app',
      title: 'My Awesome SaaS'
    });
    
    console.log(`✅ Generated ${files.size} files`);
    console.log('📁 Files:');
    for (const [path] of files) {
      console.log(`  - ${path}`);
    }
  }
  
  console.log('\n✨ Template System Test Complete!');
}

testTemplates().catch(console.error);