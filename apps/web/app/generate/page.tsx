'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DOMAINS = [
  { id: 'ecommerce', name: 'E-commerce', icon: '🛍️' },
  { id: 'saas', name: 'SaaS', icon: '☁️' },
  { id: 'landing', name: 'Landing Page', icon: '🚀' },
  { id: 'blog', name: 'Blog', icon: '📝' },
  { id: 'portfolio', name: 'Portfolio', icon: '💼' },
  { id: 'dashboard', name: 'Dashboard', icon: '📊' }
];

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [domain, setDomain] = useState('landing');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ prompt, domain })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.status === 'complete' && data.projectId) {
                router.push(`/projects/${data.projectId}`);
                return;
              } else if (data.error) {
                setError(data.error);
                return;
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Generate Your App</h1>
          <p className="text-gray-400">Describe your idea and let AI build it for you</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
          {/* Domain Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Choose App Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DOMAINS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDomain(d.id)}
                  className={`p-4 rounded-lg border transition-all ${
                    domain === d.id
                      ? 'bg-blue-500/20 border-blue-500 text-white'
                      : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{d.icon}</div>
                  <div className="text-sm font-medium">{d.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe Your App
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Create a modern e-commerce site for selling handmade jewelry with product galleries, shopping cart, and secure checkout..."
              className="w-full h-32 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating your app...
              </span>
            ) : (
              'Generate App'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}