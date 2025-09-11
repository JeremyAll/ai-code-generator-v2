# @lovable/sandbox

🏖️ **WebContainer-powered sandbox for instant app previews like Lovable/StackBlitz**

## 🚀 Features

- **WebContainer Integration**: Browser-based Node.js execution
- **Instant Preview**: Real-time app preview in iframe
- **Hot Reload**: Automatic updates when files change
- **React Component**: Ready-to-use Preview component
- **Docker Fallback**: Server-side execution when needed

## 📦 Installation

```bash
pnpm add @lovable/sandbox
```

## 🛠️ Usage

### Basic Sandbox Manager

```typescript
import { SandboxManager } from '@lovable/sandbox';

const manager = new SandboxManager();

// Create sandbox with React app files
const files = new Map([
  ['src/App.jsx', reactAppCode],
  ['src/main.jsx', entryPointCode]
]);

const sandbox = await manager.createSandbox('my-app', files);
console.log(`Preview: ${sandbox.previewUrl}`);
```

### React Component

```tsx
import { PreviewComponent } from '@lovable/sandbox';

function AppPreview() {
  const files = new Map([
    ['src/App.jsx', '// Your React code here'],
    ['src/main.jsx', '// Entry point']
  ]);

  return (
    <div className="h-96 w-full">
      <PreviewComponent 
        files={files}
        onReady={(url) => console.log('Preview ready:', url)}
        onError={(err) => console.error('Preview error:', err)}
      />
    </div>
  );
}
```

### WebContainer Service (Advanced)

```typescript
import { WebContainerService } from '@lovable/sandbox';

const container = new WebContainerService();
await container.boot();

// Write files
await container.writeFiles(new Map([
  ['package.json', packageJsonContent],
  ['src/App.jsx', appContent]
]));

// Install dependencies
await container.installDependencies();

// Start dev server
await container.startDevServer();
const url = await container.getPreviewUrl();
```

## 🌐 Browser Requirements

WebContainers require modern browsers with:
- **Cross-origin isolation** (COOP/COEP headers)
- **SharedArrayBuffer** support
- **Modern JavaScript** (ES2022+)

## 🐳 Docker Fallback

For server-side execution or older browsers:

```typescript
import { DockerSandbox } from '@lovable/sandbox';

const docker = new DockerSandbox();
const container = await docker.createContainer('app-id', files);
```

## 🔧 Integration with AI Generator

```typescript
// In your generator workflow
import { SandboxManager } from '@lovable/sandbox';

export class GeneratorWithPreview {
  private sandbox = new SandboxManager();
  
  async generateAndPreview(prompt: string) {
    // Generate files with AI
    const files = await this.generateFiles(prompt);
    
    // Create instant preview
    const preview = await this.sandbox.createSandbox(
      `gen-${Date.now()}`, 
      files
    );
    
    return {
      files,
      previewUrl: preview.previewUrl
    };
  }
}
```

## 📁 Package Structure

```
src/
├── webcontainer-service.ts  # Core WebContainer wrapper
├── sandbox-manager.ts       # Multi-sandbox management
├── docker-fallback.ts       # Docker alternative
├── preview-component.tsx    # React component
└── index.ts                # Main exports
```

## 🎯 Next Steps

1. **Web UI Integration**: Add to `apps/web` for live previews
2. **Generator Integration**: Connect to AI workflows
3. **Real-time Collaboration**: Multi-user sandbox editing
4. **Advanced Features**: Templates, themes, plugins

## 🤝 Contributing

This is part of the Lovable AI generator monorepo. See main README for contribution guidelines.

## 📜 License

MIT - Part of Lovable open-source ecosystem