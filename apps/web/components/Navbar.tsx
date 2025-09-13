'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();
      
      if (data) setCredits(data.credits);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Ne pas afficher la navbar sur les pages auth
  if (pathname?.includes('/login') || pathname?.includes('/signup')) {
    return null;
  }

  return (
    <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href={user ? '/dashboard' : '/'} className="text-xl font-bold text-white">
              Lovable Clone
            </Link>
            
            {/* Navigation Links */}
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className={`text-sm ${
                    pathname === '/dashboard' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/generate"
                  className={`text-sm ${
                    pathname === '/generate' 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-white'
                  } transition-colors`}
                >
                  Generate
                </Link>
                <Link
                  href="/templates"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Templates
                </Link>
                <Link
                  href="/docs"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Docs
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Credits */}
                <div className="bg-gray-700/50 px-4 py-2 rounded-lg">
                  <span className="text-gray-400 text-sm">Credits:</span>
                  <span className="text-white font-semibold ml-2">{credits}</span>
                </div>
                
                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}