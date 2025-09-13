'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'settings'>('preview');
  const [selectedFile, setSelectedFile] = useState<string>('index.html');

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setProject(data);
      
      // Set first file as selected
      if (data.files) {
        const files = Object.keys(data.files);
        if (files.length > 0) setSelectedFile(files[0]);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!project?.files) return;

    // Create a zip file with all project files
    const files = project.files;
    const content = Object.entries(files).map(([name, content]) => 
      `// File: ${name}\n${content}`
    ).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeploy = async () => {
    // Placeholder for deployment
    alert('Deployment feature coming soon! This will deploy to Vercel.');
  };

  const handlePushToGithub = async () => {
    // Placeholder for GitHub integration
    alert('GitHub integration coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Project Header */}
      <div className="bg-gray-800/30 border-b border-gray-700 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">
                {project.domain}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePushToGithub}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                📤 Push to GitHub
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                💾 Export
              </button>
              <button
                onClick={handleDeploy}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                🚀 Deploy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {(['preview', 'code', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'preview' && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-600">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-gray-400 ml-4">Preview</span>
              </div>
            </div>
            <div className="p-8">
              <iframe
                srcDoc={project.files?.['index.html'] || '<p>No preview available</p>'}
                className="w-full h-[600px] bg-white rounded"
                title="Project Preview"
              />
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="grid grid-cols-4 gap-6">
            {/* File list */}
            <div className="col-span-1 bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Files</h3>
              <div className="space-y-1">
                {project.files && Object.keys(project.files).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setSelectedFile(filename)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedFile === filename
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    📄 {filename}
                  </button>
                ))}
              </div>
            </div>

            {/* Code viewer */}
            <div className="col-span-3 bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700">
              <div className="bg-gray-700/50 px-4 py-2 border-b border-gray-600 flex justify-between items-center">
                <span className="text-sm text-gray-400">{selectedFile}</span>
                <button
                  onClick={() => {
                    if (project.files?.[selectedFile]) {
                      navigator.clipboard.writeText(project.files[selectedFile]);
                      alert('Copied to clipboard!');
                    }
                  }}
                  className="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-auto h-[600px]">
                <code className="text-gray-300 text-sm">
                  {project.files?.[selectedFile] || '// No content'}
                </code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Project Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={project.name}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={project.description}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white h-24"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Created At
                </label>
                <input
                  type="text"
                  value={new Date(project.created_at).toLocaleString()}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                  readOnly
                />
              </div>

              <div className="pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this project?')) {
                      // Delete project logic
                      alert('Delete feature coming soon!');
                    }
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-colors"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}