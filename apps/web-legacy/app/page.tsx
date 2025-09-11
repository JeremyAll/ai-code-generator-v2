'use client';
import { useState, useRef } from 'react';

interface AppType {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

interface Example {
  title: string;
  desc: string;
  prompt: string;
}

export default function HomePage() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('complete');
  const [selectedTech, setSelectedTech] = useState<string>('nextjs');
  const [selectedStyle, setSelectedStyle] = useState<string>('modern');
  const [description, setDescription] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appTypes: AppType[] = [
    { id: 'webapp', icon: '🌐', name: 'Web App', desc: 'Application web complète' },
    { id: 'mobile', icon: '📱', name: 'Mobile App', desc: 'App iOS/Android' },
    { id: 'dashboard', icon: '📊', name: 'Dashboard', desc: 'Analytics & Admin' },
    { id: 'landing', icon: '🎨', name: 'Landing Page', desc: 'Page marketing' },
    { id: 'internal', icon: '🔧', name: 'Internal Tool', desc: 'Outil métier' },
    { id: 'ecommerce', icon: '🛍️', name: 'E-commerce', desc: 'Boutique en ligne' }
  ];

  const examples: Example[] = [
    {
      title: '🚀 Lovable Clone',
      desc: 'Plateforme de génération IA avec interface split-screen',
      prompt: 'Créer un clone de Lovable avec génération de code IA temps réel'
    },
    {
      title: '📝 Notion Clone', 
      desc: 'Workspace collaboratif avec éditeur de blocs',
      prompt: 'Clone de Notion avec éditeur riche et collaboration temps réel'
    },
    {
      title: '🎨 Figma Clone',
      desc: 'Outil de design avec canvas infini et collaboration',
      prompt: 'Créer un outil de design comme Figma avec canvas et multi-curseurs'
    },
    {
      title: '🛍️ Shopify Clone',
      desc: 'Plateforme e-commerce avec admin dashboard',
      prompt: 'Plateforme e-commerce complète avec storefront et admin'
    },
    {
      title: '💬 Discord Clone',
      desc: 'Plateforme de communication avec chat et vocal',
      prompt: 'Clone de Discord avec chat temps réel et appels vocaux'
    },
    {
      title: '📊 Analytics SaaS',
      desc: 'Plateforme analytics avec dashboard customisable',
      prompt: 'Plateforme SaaS d\'analytics avec dashboards personnalisables'
    }
  ];

  const calculateCost = () => {
    let credits = 1;
    if (selectedScope === 'complete') credits = 2;
    if (selectedScope === 'mvp') credits = 1;
    if (selectedScope === 'landing') credits = 0.5;
    
    if (selectedType === 'webapp' || selectedType === 'mobile') {
      credits *= 1.5;
    }
    
    return credits;
  };

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const buildEnrichedPrompt = () => {
    let prompt = `
Type: ${selectedType}
Scope: ${selectedScope}
Tech Stack: ${selectedTech}
Design Style: ${selectedStyle}

Description: ${description}`;

    if (uploadedImages.length > 0) {
      prompt += `\n\nImages de référence: ${uploadedImages.length} image(s) uploadée(s)`;
    }
    
    return prompt.trim();
  };

  const handleGenerate = () => {
    if (!selectedType) {
      alert('Veuillez sélectionner un type de projet');
      return;
    }
    
    if (!description.trim()) {
      alert('Veuillez décrire votre projet');
      return;
    }
    
    const enrichedPrompt = buildEnrichedPrompt();
    console.log('Prompt enrichi:', enrichedPrompt);
    
    // Redirection vers la page de génération
    window.location.href = `/generate?prompt=${encodeURIComponent(enrichedPrompt)}`;
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-xl border-b border-white/[0.08] z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span>🚀</span>
            <span>AI App Generator</span>
          </div>
          <div className="text-gray-400 text-sm">
            2 crédits disponibles
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-8 pt-24 pb-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Que souhaitez-vous créer aujourd'hui ?
          </h1>
          <p className="text-gray-400 text-lg">
            Choisissez le type d'application et décrivez votre vision
          </p>
        </div>

        {/* App Type Selector */}
        <div className="mb-12">
          <div className="text-center mb-6 text-gray-400">
            Sélectionnez le type de projet :
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {appTypes.map((type) => (
              <div
                key={type.id}
                className={`bg-[#111113] border-2 rounded-xl p-6 cursor-pointer transition-all text-center relative ${
                  selectedType === type.id
                    ? 'border-purple-600 bg-purple-600/10'
                    : 'border-white/[0.08] hover:border-purple-600/30 hover:-translate-y-0.5'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                {selectedType === type.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white">
                    ✓
                  </div>
                )}
                <div className="text-3xl mb-3">{type.icon}</div>
                <div className="font-semibold mb-1">{type.name}</div>
                <div className="text-xs text-gray-400">{type.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scope Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: 'complete', label: 'Application Complète (15-30 pages)' },
            { id: 'mvp', label: 'MVP Simple (5-10 pages)' },
            { id: 'landing', label: 'Landing Page Uniquement' }
          ].map((scope) => (
            <button
              key={scope.id}
              className={`px-6 py-3 rounded-lg border transition-all text-sm ${
                selectedScope === scope.id
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-[#111113] text-gray-400 border-white/[0.08] hover:bg-[#1a1a1d]'
              }`}
              onClick={() => setSelectedScope(scope.id)}
            >
              {scope.label}
            </button>
          ))}
        </div>

        {/* Main Input Section */}
        <div className="max-w-4xl mx-auto">
          {/* Description Input */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <label className="font-medium">Décrivez votre projet</label>
              <span className="text-sm text-gray-400">{description.length} / 500</span>
            </div>
            <textarea
              className="w-full min-h-[120px] bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 text-white placeholder-gray-500 resize-y outline-none transition-all focus:border-purple-600/30 focus:bg-white/[0.03]"
              placeholder="Ex: Une application de livraison de nourriture comme Uber Eats mais avec un système de gamification où les utilisateurs gagnent des points..."
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image Upload Section */}
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span>📸</span>
                <span className="font-medium">Inspiration visuelle</span>
                <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                  Optionnel
                </span>
              </div>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-purple-600 bg-purple-600/5'
                  : 'border-white/[0.08] hover:border-purple-600/30 hover:bg-purple-600/[0.02]'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <div className="text-5xl mb-4 opacity-50">⬆️</div>
              <div className="text-gray-400 mb-2">Glissez vos images ici ou cliquez pour parcourir</div>
              <div className="text-sm text-gray-500">Captures d'écran, maquettes, charte graphique...</div>
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-6 gap-3 mt-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-white/[0.08]"
                    />
                    <button
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-700 transition-colors"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="mb-8">
            <button
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              <span>Options avancées</span>
            </button>
            
            {showAdvanced && (
              <div className="bg-white/[0.02] rounded-lg p-4 space-y-4">
                <div>
                  <label className="font-medium block mb-2">Stack technique préférée :</label>
                  <div className="flex flex-wrap gap-2">
                    {['nextjs', 'react', 'vue', 'svelte', 'remix'].map((tech) => (
                      <button
                        key={tech}
                        className={`px-4 py-2 rounded-full border text-sm transition-all ${
                          selectedTech === tech
                            ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                            : 'bg-[#0a0a0b] border-white/[0.08] text-gray-400 hover:border-purple-600/30'
                        }`}
                        onClick={() => setSelectedTech(tech)}
                      >
                        {tech === 'nextjs' ? 'Next.js 14' : tech.charAt(0).toUpperCase() + tech.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="font-medium block mb-2">Style de design :</label>
                  <div className="flex flex-wrap gap-2">
                    {['modern', 'minimal', 'playful', 'corporate', 'glassmorphism'].map((style) => (
                      <button
                        key={style}
                        className={`px-4 py-2 rounded-full border text-sm transition-all ${
                          selectedStyle === style
                            ? 'bg-purple-600/20 border-purple-600 text-purple-400'
                            : 'bg-[#0a0a0b] border-white/[0.08] text-gray-400 hover:border-purple-600/30'
                        }`}
                        onClick={() => setSelectedStyle(style)}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Section */}
          <div className="flex justify-between items-center mb-12">
            <div className="text-sm text-gray-400">
              <span>Coût estimé : </span>
              <span className="text-purple-400 font-medium">
                {calculateCost()} crédit{calculateCost() !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50"
              onClick={handleGenerate}
              disabled={!selectedType || !description.trim()}
            >
              <span>Générer l'application</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Examples Section */}
        <div className="pt-8 border-t border-white/[0.08]">
          <div className="text-center text-gray-400 mb-6">
            🚀 Templates SaaS populaires - Génération optimisée
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {examples.map((example, index) => (
              <div
                key={index}
                className="bg-[#111113] border border-white/[0.08] rounded-lg p-4 cursor-pointer transition-all hover:border-purple-600/30 hover:-translate-y-0.5 relative group"
                onClick={() => setDescription(example.prompt)}
              >
                {/* Badge "Template Pro" */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Template
                </div>
                
                <div className="font-medium text-purple-400 mb-1">{example.title}</div>
                <div className="text-sm text-gray-400 mb-2">{example.desc}</div>
                
                {/* Features preview */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {index === 0 && (
                    <>
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">Split-screen</span>
                      <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">Real-time</span>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">Rich Editor</span>
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">Collaboration</span>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-1 rounded">Canvas</span>
                      <span className="text-xs bg-pink-600/20 text-pink-400 px-2 py-1 rounded">Multi-users</span>
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">E-commerce</span>
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">Payments</span>
                    </>
                  )}
                  {index === 4 && (
                    <>
                      <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">Chat</span>
                      <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">Voice</span>
                    </>
                  )}
                  {index === 5 && (
                    <>
                      <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded">Analytics</span>
                      <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded">Dashboard</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Template Benefits */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-400 mb-2">🧠 Templates intelligents avec enrichissement automatique</div>
            <div className="flex justify-center gap-6 text-xs text-gray-500">
              <span>✨ Cache optimisé (-50% tokens)</span>
              <span>⚡ Génération 3x plus rapide</span>
              <span>🎯 Architecture pré-validée</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}