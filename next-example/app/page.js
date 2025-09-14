export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🚀 BAML Streaming API Demo
        </h1>

        <div className="text-center">
          <p className="text-lg mb-4">
            Streaming API is ready at <code>/api/generate</code>
          </p>

          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h2 className="font-bold mb-2">Fast Mode (Haiku)</h2>
              <p className="text-sm text-gray-600">
                Add header: <code>x-fast-mode: true</code>
              </p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <h2 className="font-bold mb-2">Production Mode (Sonnet)</h2>
              <p className="text-sm text-gray-600">
                Default mode for comprehensive generation
              </p>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="/test-interface"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Open Test Interface
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}