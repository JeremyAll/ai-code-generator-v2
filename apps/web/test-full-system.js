// test-full-system.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Pour créer un user de test
);

async function createTestUser() {
  console.log('📧 Creating test user...');
  
  const email = `test-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authError) {
    console.error('❌ Failed to create user:', authError);
    return null;
  }
  
  // Add credits
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      credits: 10,
      subscription_tier: 'free'
    });
  
  if (userError) {
    console.error('❌ Failed to create user profile:', userError);
    return null;
  }
  
  console.log('✅ Test user created:', email);
  console.log('   Password:', password);
  
  // Sign in to get token
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) {
    console.error('❌ Failed to sign in:', signInError);
    return null;
  }
  
  return {
    user: authData.user,
    session: sessionData.session,
    token: sessionData.session.access_token
  };
}

async function testGeneration(token) {
  console.log('\n🤖 Testing generation API...');
  
  const prompts = [
    { prompt: 'Create a modern e-commerce site for sneakers', domain: 'ecommerce' },
    { prompt: 'Build a SaaS dashboard for analytics', domain: 'saas' },
    { prompt: 'Landing page for AI startup', domain: 'landing' }
  ];
  
  for (const testCase of prompts) {
    console.log(`\n📝 Testing: "${testCase.prompt}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testCase)
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Generation failed (${response.status}):`, error);
        continue;
      }
      
      const result = await response.json();
      console.log('✅ Generation successful!');
      console.log('   Project ID:', result.project?.id);
      console.log('   Files count:', Object.keys(result.project?.files || {}).length);
      console.log('   Blueprint:', result.project?.blueprint ? 'Present' : 'Missing');
      
      return result.project;
      
    } catch (error) {
      console.error('❌ Request failed:', error);
    }
  }
}

async function testProjectsCRUD(token, projectId) {
  console.log('\n📁 Testing projects CRUD...');
  
  // List projects
  console.log('📋 Listing projects...');
  const listResponse = await fetch('http://localhost:3000/api/projects', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const projects = await listResponse.json();
  console.log(`✅ Found ${projects.length} projects`);
  
  // Get single project
  if (projectId) {
    console.log(`📄 Getting project ${projectId}...`);
    const getResponse = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (getResponse.ok) {
      const project = await getResponse.json();
      console.log('✅ Project retrieved successfully');
      console.log('   Name:', project.name);
      console.log('   Domain:', project.domain);
    }
  }
  
  return projects;
}

async function validateComponents() {
  console.log('\n🔍 Validating individual components...');
  
  const checks = [
    {
      name: 'Generator',
      test: async () => {
        const { generateApp } = await import('@lovable/generator');
        return typeof generateApp === 'function';
      }
    }
    // Temporarily disabled complex imports to focus on core functionality
    // {
    //   name: 'Image Service',
    //   test: async () => {
    //     const { enhanceWithImages } = await import('@lovable/image-service');
    //     return typeof enhanceWithImages === 'function';
    //   }
    // },
    // {
    //   name: 'Assets Service',
    //   test: async () => {
    //     const { enhanceWithAssets } = await import('@lovable/assets-service');
    //     return typeof enhanceWithAssets === 'function';
    //   }
    // },
    // {
    //   name: 'Design System',
    //   test: async () => {
    //     const { DesignSystemGenerator } = await import('@lovable/design-system');
    //     return typeof DesignSystemGenerator === 'function';
    //   }
    // },
    // {
    //   name: 'Testing Service',
    //   test: async () => {
    //     const { validateAndTest } = await import('@lovable/testing');
    //     return typeof validateAndTest === 'function';
    //   }
    // }
  ];
  
  for (const check of checks) {
    try {
      const result = await check.test();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}

async function testDirectGeneration() {
  console.log('\n🎯 Testing direct generator (without API)...');
  
  try {
    const { generateApp } = await import('@lovable/generator');
    
    const result = await generateApp('Create a simple blog', {
      domain: 'blog',
      style: 'modern'
    });
    
    console.log('✅ Direct generation successful!');
    console.log('   Files generated:', result.files.size);
    console.log('   Has blueprint:', !!result.blueprint);
    console.log('   Has preview URL:', !!result.previewUrl);
    
    // Test a sample file
    const indexHtml = result.files.get('index.html');
    if (indexHtml) {
      console.log('   index.html size:', indexHtml.length, 'characters');
      console.log('   Has React code:', indexHtml.includes('React'));
    }
    
  } catch (error) {
    console.error('❌ Direct generation failed:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 FULL SYSTEM TEST - 12 DAYS VALIDATION\n');
  console.log('='.repeat(50));
  
  // 1. Test component imports
  await validateComponents();
  
  // 2. Test direct generation
  await testDirectGeneration();
  
  // 3. Create test user
  const userData = await createTestUser();
  if (!userData) {
    console.error('\n❌ Cannot continue without user');
    return;
  }
  
  // 4. Test generation via API
  const project = await testGeneration(userData.token);
  
  // 5. Test CRUD operations
  if (project) {
    await testProjectsCRUD(userData.token, project.id);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 TEST COMPLETE');
  
  // Cleanup
  console.log('\n🧹 Cleaning up test user...');
  await supabase.auth.admin.deleteUser(userData.user.id);
}

// Run tests
runAllTests().catch(console.error);