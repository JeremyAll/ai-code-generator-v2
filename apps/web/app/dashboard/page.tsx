'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ Pas d\'utilisateur, redirection login');
      router.push('/login');
      return;
    }
    
    console.log('✅ Utilisateur Supabase trouvé:', user.email);
    
    // Auto-créer l'entrée user si elle n'existe pas
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userData) {
      console.log('🔨 Création de l\'entrée user...');
      await supabase.from('users').insert({
        id: user.id,
        email: user.email,
        credits: 100,
        subscription_tier: 'free'
      });
    }
    
    setUser(user);
    loadUserCredits(user.id);
    loadProjects();
  };

  const loadUserCredits = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();
    
    if (data) setCredits(data.credits);
  };

  const loadProjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setProjects(data);
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Total Projects</h3>
            <p className="text-3xl font-bold text-white mt-2">{projects.length}</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Credits Remaining</h3>
            <p className="text-3xl font-bold text-white mt-2">{credits}</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium">Plan</h3>
            <p className="text-3xl font-bold text-white mt-2">Free</p>
          </div>
        </div>

        {/* New Project Button */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">Your Projects</h2>
          <div className="flex items-center space-x-4">
            {/* Ajoute ce bouton temporaire pour les tests */}
            <button
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { error } = await supabase
                    .from('users')
                    .update({ credits: 100 })
                    .eq('id', user.id);
                  
                  if (!error) {
                    window.location.reload();
                  }
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Add 100 Credits (DEV ONLY)
            </button>
            
            <Link
              href="/generate"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-12 border border-gray-700 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">Start by creating your first AI-powered application</p>
            <Link
              href="/generate"
              className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Create First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View
                    </Link>
                    {project.deployed_url && (
                      <a
                        href={project.deployed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Live
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}