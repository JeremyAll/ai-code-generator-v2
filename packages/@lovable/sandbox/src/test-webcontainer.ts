import { SandboxManager } from './sandbox-manager.js';

async function test() {
  const manager = new SandboxManager();
  
  // Fichiers de test
  const testFiles = new Map([
    ['src/main.jsx', `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`],
    ['src/App.jsx', `
import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🚀 WebContainer Works!</h1>
      <p>This is running in a browser-based Node.js environment!</p>
      <button onClick={() => alert('Hello from WebContainer!')}>
        Click me!
      </button>
    </div>
  );
}
`]
  ]);
  
  // Créer sandbox
  const sandbox = await manager.createSandbox('test-1', testFiles);
  console.log(`\n🎉 Preview URL: ${sandbox.previewUrl}\n`);
}

// Run test
test().catch(console.error);