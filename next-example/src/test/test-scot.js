// src/test/test-scot.js
import { StreamingHandler } from '../streaming-handler.js';

// Simple SCoT enhancer for testing
class SCoTEnhancer {
  enhancePrompt(prompt) {
    const template = `Think step by step to create a comprehensive solution:

1. Analyze requirements: ${prompt}
2. Plan architecture and components needed
3. Consider best practices and modern patterns
4. Generate complete, production-ready code

Now create: ${prompt}`;

    return template;
  }
}

async function testSCoT() {
  console.log('🧪 TEST: CHAIN-OF-THOUGHT ENHANCEMENT\n');

  const enhancer = new SCoTEnhancer();
  const handler = new StreamingHandler();

  const testPrompt = 'Create an e-commerce site';

  // Test SANS SCoT
  console.log('📊 Without SCoT:');
  const start1 = Date.now();
  const result1 = await handler.generateWithStream(testPrompt);
  const time1 = Date.now() - start1;

  // Test AVEC SCoT
  console.log('\n📊 With SCoT:');
  const enhancedPrompt = enhancer.enhancePrompt(testPrompt);
  console.log(`Enhanced prompt length: ${enhancedPrompt.length} chars`);
  const start2 = Date.now();
  const result2 = await handler.generateWithStream(enhancedPrompt);
  const time2 = Date.now() - start2;

  // Comparaison
  console.log('\n📈 COMPARISON:');
  console.log(`Time without SCoT: ${time1}ms`);
  console.log(`Time with SCoT: ${time2}ms`);
  console.log(`Output size without: ${result1.length} chars`);
  console.log(`Output size with: ${result2.length} chars`);

  // Analyse qualité (basique)
  const quality1 = analyzeQuality(result1);
  const quality2 = analyzeQuality(result2);

  console.log(`\nQuality without SCoT: ${quality1}/10`);
  console.log(`Quality with SCoT: ${quality2}/10`);
  console.log(`Improvement: ${((quality2 - quality1) / quality1 * 100).toFixed(1)}%`);

  console.log('\n✅ SCoT test completed!');
}

function analyzeQuality(output) {
  let score = 5; // Base score

  // Critères de qualité
  if (output.includes('TypeScript')) score += 1;
  if (output.includes('useState')) score += 1;
  if (output.includes('useEffect')) score += 1;
  if (output.includes('interface')) score += 1;
  if (output.length > 10000) score += 1;

  return Math.min(score, 10);
}

testSCoT();