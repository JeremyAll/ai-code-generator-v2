# @lovable/generator

Core AI-powered application generation engine migrated from app-generator.

## 🚀 Features

- **AI-Powered Generation**: Uses Claude Sonnet 4 for intelligent code generation
- **Multi-Phase Workflow**: 7-step generation process with validation
- **Domain Intelligence**: Recognizes 40+ business domains
- **Template System**: Pre-built components and contexts
- **Quality Validation**: Automatic code validation and error fixing

## 📦 Installation

```bash
# From monorepo root
pnpm install

# Build the package
pnpm --filter @lovable/generator build
```

## 🛠️ Usage

### CLI Commands

```bash
# Generate a new application
pnpm --filter @lovable/generator generate

# Show statistics
pnpm --filter @lovable/generator run stats

# View logs
pnpm --filter @lovable/generator run logs

# Clean old generations
pnpm --filter @lovable/generator run clean:old

# Create backup
pnpm --filter @lovable/generator run backup
```

### Direct CLI Usage

After building, you can use the CLI directly:

```bash
cd packages/@lovable/generator
node dist/cli.js generate
```

## 🏗️ Architecture

```
src/
├── cli.ts                 # Main CLI entry point
├── index.ts              # Package entry point
├── config/               # API and rate limiting config
├── intelligence/         # Semantic analysis and personalization
├── prompts/              # AI prompt management
├── services/             # Core services (Anthropic, caching, etc.)
├── templates/            # Domain-specific templates
├── utils/                # Utilities (logging, file management)
└── workflows/            # Generation workflow orchestration
```

## 📁 Working Directories

The generator creates these directories during operation:

- `generated-apps/` - Generated application output
- `logs/` - Generation and error logs
- `cache/` - Component and template cache
- `sessions/` - Session data and history

## 🔧 Configuration

Copy `.env.example` from the monorepo root and configure:

- `ANTHROPIC_API_KEY` - Required for AI generation
- `UNSPLASH_ACCESS_KEY` - For image generation
- Other optional service keys

## 🧪 Testing

```bash
# Run tests
pnpm --filter @lovable/generator test

# Run specific test
node tests/test-complete-workflow.js
```

## 📈 Migration Notes

This package was migrated from the original app-generator with:

- ✅ All source code preserved and organized
- ✅ Complete functionality maintained  
- ✅ Modern TypeScript configuration
- ✅ Monorepo integration
- ✅ Enhanced build system

The original generation logic remains unchanged while being integrated into the modern Lovable architecture.