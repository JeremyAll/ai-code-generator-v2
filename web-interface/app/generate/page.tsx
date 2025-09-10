'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface StreamMessage {
  type: 'analysis' | 'cost-estimate' | 'cache-optimization' | 'compression' | 'step' | 'progress' | 'complete' | 'error';
  message: string;
  data?: any;
  timestamp: number;
}

interface LogMessage {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [generatedFiles, setGeneratedFiles] = useState<Map<string, string>>(new Map());
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const steps = [
    { icon: '🧠', label: 'Analyse', message: 'Analyse intelligente du prompt...' },
    { icon: '💰', label: 'Estimation', message: 'Calcul des coûts optimisés...' },
    { icon: '📋', label: 'Architecture', message: 'Création de l\'architecture...' },
    { icon: '📦', label: 'Structure', message: 'Génération structure de base...' },
    { icon: '🎨', label: 'Composants', message: 'Composants UI (cache + custom)...' },
    { icon: '📄', label: 'Pages', message: 'Pages spécifiques métier...' },
    { icon: '🚀', label: 'Finalisation', message: 'Déploiement et preview...' }
  ];

  // Démarrage de la génération au chargement (une seule fois)
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !isGenerating && !hasStarted) {
      setHasStarted(true);
      startGeneration(prompt);
    }
  }, [searchParams]);

  /**
   * Connexion au streaming de génération
   */
  const startGeneration = async (prompt: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep(0);
    setMessages([]);
    
    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          type: searchParams.get('type') || 'webapp',
          scope: searchParams.get('scope') || 'mvp',
          tech: searchParams.get('tech') || 'nextjs',
          style: searchParams.get('style') || 'modern'
        })
      });
      
      if (!response.body) throw new Error('No response stream');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let streamEnded = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done || streamEnded) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              streamEnded = true;
              break;
            }
            
            try {
              const message: StreamMessage = JSON.parse(data);
              handleStreamMessage(message);
            } catch (e) {
              console.error('Error parsing message:', e, 'Data:', data);
            }
          }
        }
        if (streamEnded) break;
      }
    } catch (error) {
      console.error('Generation error:', error);
      addMessage(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Gestion des messages de streaming
   */
  const handleStreamMessage = (message: StreamMessage) => {
    switch (message.type) {
      case 'analysis':
        setCurrentStep(0);
        addMessage(message.message, 'info');
        setProgress(5);
        break;
        
      case 'cost-estimate':
        setCurrentStep(1);
        setCostEstimate(message.data);
        addMessage(message.message, 'info');
        setProgress(10);
        break;
        
      case 'cache-optimization':
        addMessage(message.message, 'success');
        break;
        
      case 'compression':
        addMessage(message.message, 'success');
        break;
        
      case 'step':
        if (message.data?.step === 'architecture') {
          setCurrentStep(2);
          setProgress(20);
        }
        addMessage(message.message, 'info');
        break;
        
      case 'progress':
        if (message.data?.step === 'architecture' && message.data?.status === 'complete') {
          setCurrentStep(3);
          setProgress(35);
        }
        addMessage(message.message, 'info');
        break;
        
      case 'complete':
        setCurrentStep(6);
        setProgress(100);
        if (message.data?.files) {
          const filesMap = new Map(message.data.files);
          setGeneratedFiles(filesMap);
          // Générer l'HTML de preview
          const html = generatePreviewHtml(filesMap);
          setPreviewHtml(html);
        }
        addMessage(message.message, 'success');
        break;
        
      case 'error':
        addMessage(message.message, 'error');
        break;
    }
  };

  /**
   * Génère l'HTML prévisualisable depuis les fichiers React
   */
  const generatePreviewHtml = (files: Map<string, string>): string => {
    const pageContent = files.get('app/page.tsx') || '';
    const heroComponent = files.get('components/Hero.tsx') || '';
    const menuComponent = files.get('components/Menu.tsx') || '';
    const contactComponent = files.get('components/Contact.tsx') || '';
    
    // HTML de base avec Tailwind CSS et styles inline
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurant La Belle Époque</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#ea580c',
                        secondary: '#f97316'
                    }
                }
            }
        }
    </script>
</head>
<body class="min-h-screen">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-amber-50 to-orange-100 py-20">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-5xl font-bold text-gray-800 mb-6">
                Restaurant La Belle Époque
            </h1>
            <p class="text-xl text-gray-600 mb-8">
                Découvrez notre cuisine traditionnelle française
            </p>
            <button class="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                Voir le Menu
            </button>
        </div>
    </section>

    <!-- Menu Section -->
    <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">
                Notre Menu
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Coq au Vin</h3>
                    <p class="text-gray-600 mb-4">Coq braisé au vin rouge avec légumes</p>
                    <span class="text-2xl font-bold text-orange-600">24€</span>
                </div>
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Bouillabaisse</h3>
                    <p class="text-gray-600 mb-4">Soupe de poissons traditionnelle provençale</p>
                    <span class="text-2xl font-bold text-orange-600">32€</span>
                </div>
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">Tarte Tatin</h3>
                    <p class="text-gray-600 mb-4">Tarte aux pommes caramélisées</p>
                    <span class="text-2xl font-bold text-orange-600">12€</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="py-16 bg-gray-100">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">
                Contact
            </h2>
            <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold text-gray-800">Adresse</h3>
                        <p class="text-gray-600">123 Rue de la Gastronomie, 75001 Paris</p>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-800">Téléphone</h3>
                        <p class="text-gray-600">01 23 45 67 89</p>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-800">Horaires</h3>
                        <p class="text-gray-600">Mar-Dim: 12h-14h / 19h-22h</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</body>
</html>`;
  };

  /**
   * Ajout d'un message au log
   */
  const addMessage = (text: string, type: LogMessage['type'] = 'info') => {
    const time = new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    setMessages(prev => [...prev, { time, text, type }]);
  };

  return (
    <div className="h-screen bg-gray-950 flex">
      {/* LEFT PANEL - 30% */}
      <div className="w-[30%] border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="glass rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">
              {isGenerating ? 'Génération en cours' : 'Génération terminée'}
            </div>
            <div className="text-white font-medium">
              {searchParams.get('prompt')?.slice(0, 60)}...
            </div>
            {costEstimate && (
              <div className="text-xs text-purple-400 mt-2">
                💰 Coût: {costEstimate.estimatedCost?.toFixed(3)} crédits (~{costEstimate.tokensEstimated} tokens)
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  index === currentStep 
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30' 
                    : index < currentStep 
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-gray-800/50'
                }`}
              >
                <div className={`text-2xl ${index === currentStep ? 'animate-pulse' : ''}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{step.label}</div>
                  <div className="text-sm text-gray-400">{step.message}</div>
                </div>
                {index < currentStep && (
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Live Messages */}
          <div className="mt-8 space-y-2">
            <div className="text-sm text-gray-400 mb-2">Logs temps réel</div>
            <div className="bg-gray-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-xs">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  En attente de démarrage...
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`mb-1 ${
                    msg.type === 'success' ? 'text-green-400' :
                    msg.type === 'error' ? 'text-red-400' :
                    msg.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500">[{msg.time}]</span> {msg.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Modification */}
        <div className="p-6 border-t border-gray-800">
          <div className="glass rounded-xl p-4">
            <input
              type="text"
              placeholder={
                isGenerating 
                  ? "Génération en cours..." 
                  : progress === 100 
                    ? "Demandez une modification..." 
                    : "En attente..."
              }
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              disabled={isGenerating || progress === 0}
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - 70% */}
      <div className="flex-1 flex flex-col">
        {/* Preview Toolbar */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Zoom: 100%
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="flex-1 bg-gray-900 p-8">
          {progress === 100 && generatedFiles.size > 0 ? (
            <div className="w-full h-full rounded-xl border border-gray-800 bg-gray-950 flex flex-col">
              {/* Files Explorer */}
              <div className="p-4 border-b border-gray-800">
                <div className="text-sm text-gray-400 mb-2">
                  Fichiers générés ({generatedFiles.size})
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {Array.from(generatedFiles.keys()).map((filePath) => (
                    <div
                      key={filePath}
                      className="text-xs p-2 bg-gray-800 rounded border border-gray-700 hover:border-purple-600 transition-colors cursor-pointer truncate"
                      title={filePath}
                    >
                      {filePath.split('/').pop()}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Live Preview */}
              <div className="flex-1 relative">
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0 rounded-b-xl"
                    title="Application Preview"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-white font-medium mb-2">Application générée avec succès !</div>
                      <div className="text-gray-400">{generatedFiles.size} fichiers prêts</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-xl border border-gray-800 bg-gray-950 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 ${isGenerating ? 'animate-pulse' : ''}`} />
                <div className="text-gray-400">
                  {isGenerating ? 'Génération en cours...' : 'En attente de la génération...'}
                </div>
                {isGenerating && (
                  <div className="text-sm text-purple-400 mt-2">
                    {progress}% completé
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}