// src/test/test-api-simple.js
async function testAPISimple() {
  console.log('🧪 SIMPLE API TEST\n');

  const API_URL = 'http://localhost:3002/api/generate';

  try {
    console.log('📡 Testing fast mode (Haiku 3.5)...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-fast-mode': 'true'
      },
      body: JSON.stringify({
        prompt: 'simple button component'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('✅ Connection established');
    console.log('📊 Reading stream...\n');

    let chunks = [];
    let chunkCount = 0;

    // Simple streaming reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          chunkCount++;
          if (chunkCount % 50 === 0) {
            process.stdout.write('.');
          }
        } else if (line.includes('[DONE]')) {
          console.log('\n✅ Stream completed');
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`📊 Received ${chunkCount} chunks in ${duration}ms`);
    console.log('✅ Fast mode API test PASSED!\n');

    return true;

  } catch (error) {
    console.log(`❌ API Test failed: ${error.message}`);
    console.log('💡 Make sure your server is running on port 3002');
    return false;
  }
}

// Run the test
testAPISimple().then(success => {
  process.exit(success ? 0 : 1);
});