// src/test/test-connection.js
async function testConnection() {
  console.log('🔌 Testing API Connection...');

  try {
    const response = await fetch('http://localhost:3002/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-fast-mode': 'true'
      },
      body: JSON.stringify({
        prompt: 'test connection'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (response.status === 200) {
      console.log('✅ API Connection: WORKING');
      return true;
    } else {
      console.log('❌ API Connection: FAILED');
      return false;
    }

  } catch (error) {
    console.log(`❌ Connection Error: ${error.message}`);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});