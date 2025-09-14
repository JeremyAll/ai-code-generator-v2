// src/test/test-api.js

async function testAPI() {
  console.log('🧪 TEST 2: API ENDPOINT WITH SSE\n');

  const API_URL = 'http://localhost:3002/api/generate';

  try {
    console.log('📡 Calling API...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Create a simple blog'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('✅ Connection established');
    console.log('📊 Reading stream...\n');

    // Lire le stream SSE
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            console.log('\n✅ Stream complete');
          } else {
            try {
              const parsed = JSON.parse(data);
              chunks.push(parsed.chunk || '');
              process.stdout.write('.');
            } catch (e) {
              // Ignorer les erreurs de parsing
            }
          }
        }
      }
    }

    const result = chunks.join('');
    console.log(`\n📊 Total received: ${result.length} chars`);
    console.log('✅ API Test passed!\n');

  } catch (error) {
    console.log(`❌ API Test failed: ${error.message}`);
    console.log('💡 Make sure your server is running on port 3002');
  }
}

// Test local (lance ton serveur Next.js d'abord)
testAPI();