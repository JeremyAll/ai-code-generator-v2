import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Types importés directement (évite problèmes de path)
interface UserInput {
  type: string;
  scope: string;
  description: string;
  tech: string;
  style: string;
  images: string[];
}

interface StreamMessage {
  type: 'analysis' | 'cost-estimate' | 'cache-optimization' | 'compression' | 'step' | 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
  timestamp: number;
}

// Mode dry-run - génère des fichiers mockés pour test
async function dryRunGeneration(userInput: UserInput): Promise<Map<string, string>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const files = new Map<string, string>();
      
      // Fichiers mockés pour restaurant
      files.set('app/page.tsx', `import { Metadata } from 'next'
import Hero from '@/components/Hero'
import Menu from '@/components/Menu'
import Contact from '@/components/Contact'

export const metadata: Metadata = {
  title: 'Restaurant La Belle Époque',
  description: 'Cuisine traditionnelle française dans un cadre chaleureux'
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Menu />
      <Contact />
    </main>
  )
}`);

      files.set('components/Hero.tsx', `export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-amber-50 to-orange-100 py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Restaurant La Belle Époque
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Découvrez notre cuisine traditionnelle française
        </p>
        <button className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors">
          Voir le Menu
        </button>
      </div>
    </section>
  )
}`);

      files.set('components/Menu.tsx', `const dishes = [
  { name: 'Coq au Vin', price: '24€', description: 'Coq braisé au vin rouge avec légumes' },
  { name: 'Bouillabaisse', price: '32€', description: 'Soupe de poissons traditionnelle provençale' },
  { name: 'Tarte Tatin', price: '12€', description: 'Tarte aux pommes caramélisées' }
]

export default function Menu() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Notre Menu
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {dishes.map((dish, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{dish.name}</h3>
              <p className="text-gray-600 mb-4">{dish.description}</p>
              <span className="text-2xl font-bold text-orange-600">{dish.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}`);

      files.set('components/Contact.tsx', `export default function Contact() {
  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Contact
        </h2>
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Adresse</h3>
              <p className="text-gray-600">123 Rue de la Gastronomie, 75001 Paris</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Téléphone</h3>
              <p className="text-gray-600">01 23 45 67 89</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Horaires</h3>
              <p className="text-gray-600">Mar-Dim: 12h-14h / 19h-22h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}`);

      files.set('tailwind.config.js', `module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ea580c',
        secondary: '#f97316'
      }
    },
  },
  plugins: [],
}`);

      resolve(files);
    }, 3000);
  });
}

// Fonction pour appeler le vrai CLI
async function realCliGeneration(userInput: UserInput): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const cliPath = path.resolve('../');
    const command = 'npm';
    
    // Nettoyer le prompt des caractères problématiques
    const cleanPrompt = userInput.description
      .replace(/\n/g, ' ')
      .replace(/"/g, '\\"')
      .trim();
    
    const args = [
      'start', 
      'generate',
      '-p', 
      cleanPrompt
    ];

    console.log('🚀 Appel CLI réel:', command, args.join(' '));
    console.log('📂 Répertoire:', cliPath);
    
    const child = spawn(command, args, { 
      cwd: cliPath,
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log('📤 CLI stdout:', chunk);
    });

    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      console.log('⚠️ CLI stderr:', chunk);
    });

    child.on('error', (error) => {
      console.error('❌ Erreur spawn:', error);
      reject(new Error(`Failed to spawn CLI: ${error.message}`));
    });

    child.on('close', (code) => {
      console.log(`🏁 CLI terminé avec code: ${code}`);
      console.log(`📝 Output complet: ${output}`);
      console.log(`⚠️ Error complet: ${errorOutput}`);
      
      if (code === 0) {
        // Pour l'instant, retourner les fichiers mockés en attendant le parsing
        const files = new Map<string, string>();
        files.set('success', 'CLI execution completed successfully');
        files.set('output', output);
        resolve(files);
      } else {
        reject(new Error(`CLI exited with code ${code}\nOutput: ${output}\nError: ${errorOutput}`));
      }
    });
  });
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const { prompt, type, scope, tech, style, images } = body;
  
  // Construction de l'input utilisateur
  const userInput: UserInput = {
    type: type || 'webapp',
    scope: scope || 'mvp', 
    description: prompt,
    tech: tech || 'nextjs',
    style: style || 'modern',
    images: images || []
  };

  // Configuration SSE (Server-Sent Events)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Simulation des étapes de génération avec streaming
      const steps = [
        { type: 'analysis', message: '🧠 Démarrage de la génération intelligente...', delay: 500 },
        { type: 'cost-estimate', message: '💰 Estimation des coûts...', delay: 800, data: { estimatedCost: 0.15, tokensEstimated: 8500 } },
        { type: 'cache-optimization', message: '🚀 Optimisation via cache (composants trouvés)', delay: 600 },
        { type: 'compression', message: '📦 Compression du prompt (30% tokens économisés)', delay: 400 },
        { type: 'step', message: '🏗️ Génération architecture YAML...', delay: 1000 },
        { type: 'step', message: '⚡ Génération Step 2.1: Structure de base', delay: 1200 },
        { type: 'step', message: '🎨 Génération Step 2.2: Composants UI', delay: 1000 },
        { type: 'step', message: '📄 Génération Step 2.3: Pages spécifiques', delay: 800 },
      ];

      // Envoie chaque message avec délai
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await new Promise(resolve => setTimeout(resolve, step.delay));
        
        const message: StreamMessage = {
          type: step.type as any,
          message: step.message,
          data: step.data || { progress: ((i + 1) / steps.length) * 90 },
          timestamp: Date.now()
        };
        
        const data = `data: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }
      
      // Génération finale (mode dry-run temporairement)
      const files = await dryRunGeneration(userInput);
      
      // Message final avec tous les fichiers
      const finalMessage: StreamMessage = {
        type: 'complete',
        message: `🎉 Génération terminée ! ${files.size} fichiers créés`,
        data: { 
          files: Array.from(files.entries()),
          totalFiles: files.size,
          metrics: {
            tokensUsed: 7200,
            tokensSaved: 3100,
            creditsUsed: 0.12,
            savingsPercent: 30
          }
        },
        timestamp: Date.now()
      };
      
      const finalData = `data: ${JSON.stringify(finalMessage)}\n\n`;
      controller.enqueue(encoder.encode(finalData));
      
      // Fermeture du stream
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
    
    cancel() {
      console.log('Generation stream cancelled by client');
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Note: Cette version utilise une simulation pour démonstration
// Pour production, il faudrait soit:
// 1. Compiler les services TypeScript en JavaScript 
// 2. Utiliser un proxy vers le CLI backend
// 3. Ou restructurer l'architecture pour partager le code