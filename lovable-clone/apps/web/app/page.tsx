export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            🤖 Lovable Clone
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Modern AI-powered application generator with enterprise-grade architecture.
            Built with Next.js 14, NestJS, Turborepo, and advanced AI agents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">🚀 Next.js 14</h3>
              <p className="text-gray-200">App Router with modern React patterns</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">🧠 AI Agents</h3>
              <p className="text-gray-200">Multi-agent system for specialized generation</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">⚡ Turborepo</h3>
              <p className="text-gray-200">Lightning-fast monorepo builds</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}