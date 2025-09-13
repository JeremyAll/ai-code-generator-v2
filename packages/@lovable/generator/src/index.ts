// Mock simple pour tester l'infrastructure
export function generateApp(prompt: string, options?: any) {
  console.log('Mock generator called with:', prompt);
  
  // Retourne une structure minimale mais valide
  return Promise.resolve({
    files: new Map([
      ['index.html', `<!DOCTYPE html>
<html>
<head><title>Generated App</title></head>
<body>
  <h1>App generated from: ${prompt}</h1>
  <p>Domain: ${options?.domain || 'default'}</p>
</body>
</html>`],
      ['package.json', JSON.stringify({
        name: 'generated-app',
        version: '1.0.0',
        dependencies: { react: '^18.0.0' }
      }, null, 2)]
    ]),
    blueprint: {
      name: 'Generated App',
      description: prompt,
      domain: options?.domain || 'default',
      components: ['Header', 'Main', 'Footer']
    },
    previewUrl: 'http://localhost:3000',
    code: '<h1>Generated</h1>'
  });
}

export default generateApp;