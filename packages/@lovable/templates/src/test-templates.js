// Simple test for template system structure
console.log('🧪 Testing Template System\n');

import * as fs from 'fs';
import * as path from 'path';

async function testTemplateStructure() {
  try {
    // Test templates directory
    const templatesDir = path.resolve(process.cwd(), '../../../templates');
    console.log(`📁 Templates directory: ${templatesDir}`);
    
    if (!fs.existsSync(templatesDir)) {
      console.log('❌ Templates directory not found');
      return;
    }
    
    // Check for template categories
    const categories = fs.readdirSync(templatesDir);
    console.log('📋 Available Template Categories:');
    
    for (const category of categories) {
      const categoryPath = path.join(templatesDir, category);
      const stat = fs.statSync(categoryPath);
      
      if (stat.isDirectory()) {
        const templateFile = path.join(categoryPath, 'base-template.json');
        
        if (fs.existsSync(templateFile)) {
          const template = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
          console.log(`  ✅ ${category}: ${template.name}`);
          console.log(`     - Framework: ${template.framework}`);
          console.log(`     - Features: ${template.features.length} features`);
          console.log(`     - Pages: ${template.structure.pages.length} pages`);
          console.log(`     - Components: ${template.structure.components.length} components`);
        } else {
          console.log(`  ❌ ${category}: Missing base-template.json`);
        }
      }
    }
    
    console.log('\n🎯 Template Matching Test:');
    const testPrompts = [
      "Create a SaaS dashboard with billing",
      "Build an e-commerce store for shoes", 
      "Make a landing page for startup"
    ];
    
    // Simple keyword matching
    const categoryKeywords = {
      saas: ['saas', 'subscription', 'dashboard', 'billing', 'admin'],
      ecommerce: ['shop', 'store', 'product', 'cart', 'ecommerce', 'sell'],
      landing: ['landing', 'marketing', 'homepage', 'startup']
    };
    
    for (const prompt of testPrompts) {
      let bestMatch = 'No match';
      let highestScore = 0;
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const score = keywords.filter(k => prompt.toLowerCase().includes(k)).length;
        if (score > highestScore) {
          highestScore = score;
          bestMatch = category;
        }
      }
      
      console.log(`  "${prompt}" → ${bestMatch}`);
    }
    
    console.log('\n✨ Template System Structure Test Complete!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testTemplateStructure().catch(console.error);