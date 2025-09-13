# AI Code Generator - Lovable App Generator

🤖 **Complete AI-powered application generator with real-time streaming capabilities**

## 🚀 Live Demo

**Production Application**: https://nexa-3pac6nhr6-jeremys-projects-438137cd.vercel.app

## ✨ Key Features

- **Real-time AI Generation** using Anthropic Claude Sonnet 4
- **Streaming Implementation** to bypass timeout limitations  
- **Multiple App Types**: E-commerce, SaaS, Landing Pages, Blogs, Portfolios, Dashboards
- **Complete Applications** with HTML, CSS, and JavaScript
- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Supabase
- **Production Ready** with Vercel deployment

## 🏗️ Architecture

### Monorepo Structure
```
├── apps/web/                 # Main Next.js application
├── packages/@lovable/        # Modular package system
│   ├── ai-agents/           # AI orchestration agents
│   ├── design-system/       # Design tokens and themes
│   ├── editor/              # Visual editing components
│   ├── generator/           # Core generation logic
│   └── backend/             # Backend services
└── templates/               # Base templates
```

## 🚦 Quick Start

1. **Setup Environment**
```bash
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
```

2. **Configure Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

3. **Run Development**
```bash
pnpm install
cd apps/web && pnpm dev
```

## 🛠️ Technical Highlights

- **Edge Runtime** with 30s timeout limits
- **Server-Sent Events** for real-time streaming
- **Optimized Prompts** for quality generation
- **Secure Authentication** via Supabase
- **Comprehensive Error Handling**

## 🎯 Usage

1. Sign up/Login to the application
2. Choose your app type (E-commerce, SaaS, etc.)
3. Describe your vision in detail
4. Watch real-time generation progress
5. Download your complete application

---

🤖 Built with AI assistance from Claude Code
