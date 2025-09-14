// src/test/test-cache.js
// Simple Semantic Cache implementation for testing
class SemanticCache {
  constructor() {
    this.cache = new Map();
    this.lastSimilarity = 0;
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  getCached(prompt) {
    let bestMatch = null;
    let highestSimilarity = 0;

    for (const [cachedPrompt, cachedValue] of this.cache) {
      const similarity = this.calculateSimilarity(prompt, cachedPrompt);

      if (similarity > highestSimilarity && similarity > 0.4) { // 40% threshold
        highestSimilarity = similarity;
        bestMatch = cachedValue;
      }
    }

    this.lastSimilarity = Math.round(highestSimilarity * 100);
    return bestMatch;
  }

  getLastSimilarity() {
    return this.lastSimilarity;
  }

  calculateSimilarity(str1, str2) {
    // Simple word-based similarity
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);

    return commonWords.length / totalWords;
  }
}

function testCache() {
  console.log('🧪 TEST: SEMANTIC CACHE\n');

  const cache = new SemanticCache();

  // Ajouter des entrées
  cache.set('create ecommerce website', { result: 'cached_ecommerce_1' });
  cache.set('build online store', { result: 'cached_store_1' });
  cache.set('make a blog', { result: 'cached_blog_1' });

  console.log('📝 Cache populated with 3 entries\n');

  // Test de similarité
  const tests = [
    { prompt: 'create ecommerce site', expected: 'cached_ecommerce_1' },
    { prompt: 'build online shop', expected: 'cached_store_1' },
    { prompt: 'create a blog', expected: 'cached_blog_1' },
    { prompt: 'totally different prompt', expected: null }
  ];

  let passed = 0;
  let total = tests.length;

  tests.forEach(test => {
    const cached = cache.getCached(test.prompt);
    const status = cached?.result === test.expected ? '✅' : '❌';

    if (cached?.result === test.expected) passed++;

    console.log(`${status} "${test.prompt}"`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${cached?.result || 'null'}`);

    if (cached) {
      console.log(`   Similarity: ${cache.getLastSimilarity()}%`);
    }
    console.log('');
  });

  console.log(`📊 Cache Test Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`);
  console.log('✅ Semantic Cache test completed!');
}

testCache();