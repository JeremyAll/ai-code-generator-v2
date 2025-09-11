import { AppArchitecture } from '../workflows/types.js';
import { parseWithJSONFix } from '../utils/json-fixer.js';

export function developerPrompt(userPrompt: string, architecture: AppArchitecture): string {
  return `# ÉTAPE 2 : GÉNÉRATION AVEC ANIMATIONS PREMIUM GARANTIES

Architecture reçue : 
${JSON.stringify(architecture, null, 2)}

## STRATÉGIE : ANIMATIONS PREMIUM INCLUSES DIRECTEMENT

**RÈGLE ABSOLUE : Copier ces composants TELS QUELS dans chaque fichier.**

### COMPOSANTS PREMIUM À UTILISER OBLIGATOIREMENT

\`\`\`tsx
// 1. CARD 3D PREMIUM (COPIER DANS CHAQUE PAGE)
const Card3D = ({ children, className = "" }) => {
  const [transform, setTransform] = React.useState('')
  const cardRef = React.useRef(null)
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * 20
    const rotateX = (y - 0.5) * -20
    setTransform(\`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) scale(1.05)\`)
  }
  
  const handleMouseLeave = () => setTransform('')
  
  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={\`relative transition-transform duration-300 ease-out \${className}\`}
      style={{ transform, transformStyle: 'preserve-3d' }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-75 transition duration-1000"></div>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

// 2. BOUTON MAGNÉTIQUE (COPIER DANS CHAQUE PAGE)
const MagneticButton = ({ children, onClick }) => {
  const ref = React.useRef(null)
  const [transform, setTransform] = React.useState('')
  
  const handleMouseMove = (e) => {
    if (!ref.current) return
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) * 0.2
    const y = (e.clientY - top - height / 2) * 0.2
    setTransform(\`translate(\${x}px, \${y}px) scale(1.05)\`)
  }
  
  const handleMouseLeave = () => setTransform('translate(0, 0) scale(1)')
  
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl shadow-2xl transition-all duration-300"
      style={{ transform }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
      <span className="relative z-10">{children}</span>
    </button>
  )
}

// 3. COMPTEUR ANIMÉ OPTIMISÉ (COPIER DANS CHAQUE PAGE)
const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef(null)
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isVisible])
  
  React.useEffect(() => {
    if (!isVisible) return
    
    const startTime = performance.now()
    const startValue = 0
    const endValue = value
    
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4)
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easedProgress = easeOutQuart(progress)
      const currentValue = startValue + (endValue * easedProgress)
      
      setCount(Math.floor(currentValue))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(endValue)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration, isVisible])
  
  return (
    <span 
      ref={ref}
      className="tabular-nums font-bold text-4xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent"
      style={{ willChange: isVisible ? 'auto' : 'contents' }}
    >
      {count.toLocaleString()}
    </span>
  )
}

// 4. HERO PARALLAX (COPIER DANS PAGE.TSX)
const HeroParallax = ({ title, subtitle }) => {
  const [scrollY, setScrollY] = React.useState(0)
  
  React.useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <div className="relative h-screen overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600"
        style={{ 
          transform: \`translate3d(0, \${scrollY * 0.5}px, 0)\`,
          willChange: 'transform'
        }}
      />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl opacity-30 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
      <div 
        className="relative z-10 h-full flex items-center justify-center"
        style={{ 
          transform: \`translate3d(0, \${scrollY * 0.2}px, 0)\`,
          willChange: 'transform'
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700">{title}</h1>
          <p className="text-2xl mb-8 opacity-90 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">{subtitle}</p>
          <MagneticButton>Commencer →</MagneticButton>
        </div>
      </div>
    </div>
  )
}
\`\`\`

### CSS ANIMATIONS OBLIGATOIRES (globals.css)
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Animations Premium */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8), 0 0 60px rgba(139, 92, 246, 0.4); }
}

.animate-float { animation: float 6s ease-in-out infinite; }
.animate-shimmer { 
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
.animate-glow { animation: glow 2s ease-in-out infinite; }

/* Performance optimizations */
.animate-float, .animate-shimmer, .animate-glow {
  contain: layout style paint;
  will-change: transform, opacity;
}

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  contain: layout style;
}

/* Neon effects */
.neon-purple {
  box-shadow: 
    0 0 10px #a855f7,
    0 0 20px #a855f7,
    0 0 30px #a855f7,
    0 0 40px #a855f7;
  contain: layout style paint;
}

/* GPU acceleration for 3D transforms */
.preserve-3d {
  transform-style: preserve-3d;
  perspective: 1000px;
  contain: layout style paint;
}
\`\`\`

## GÉNÉRATION PAR FICHIER

**FORMAT STRICT - PAS D'EXPLICATIONS :**

\`\`\`
// Fichier: app/layout.tsx
[CODE incluant Navigation avec les liens de l'architecture]

// Fichier: app/page.tsx
[CODE incluant HeroParallax + sections avec Card3D]

// Fichier: app/dashboard/page.tsx
[CODE incluant AnimatedCounter pour métriques + Card3D pour widgets]

// Fichier: app/globals.css
[CSS ci-dessus EXACTEMENT]

// Fichier: components/ui/Button.tsx
[Export du MagneticButton]

// Fichier: components/ui/Card.tsx
[Export du Card3D]
\`\`\`

## DONNÉES SELON LE DOMAINE (utiliser celles de l'architecture)

Pour Education :
\`\`\`tsx
const data = {
  xp: 1250,
  level: 12,
  streak: 47,
  badges: ["Mathématicien", "Lecteur Assidu", "Champion Calcul"],
  courses: ["Maths CE2", "Français CM1", "Sciences CM2"]
}
\`\`\`

Pour Fintech :
\`\`\`tsx
const data = {
  balance: 12450.50,
  transactions: [
    { merchant: "Apple Store", amount: -999, date: "Aujourd'hui" },
    { merchant: "Salaire", amount: 3500, date: "01/11" }
  ]
}
\`\`\`

Pour SaaS/Analytics :
\`\`\`tsx
const data = {
  users: 24567,
  revenue: 156780,
  conversion: 3.2,
  charts: [
    { month: 'Jan', revenue: 45000, users: 12000 },
    { month: 'Fév', revenue: 52000, users: 14500 },
    { month: 'Mar', revenue: 61000, users: 16800 }
  ]
}
\`\`\`

Pour E-commerce :
\`\`\`tsx
const data = {
  products: [
    { id: 1, name: "MacBook Pro M3", price: 2499, image: "/api/placeholder/400/300", rating: 4.8 },
    { id: 2, name: "iPhone 15 Pro", price: 1199, image: "/api/placeholder/400/300", rating: 4.9 },
    { id: 3, name: "AirPods Pro", price: 249, image: "/api/placeholder/400/300", rating: 4.7 }
  ],
  cart: { items: 3, total: 3947 }
}
\`\`\`

**GÉNÈRE MAINTENANT. CODE UNIQUEMENT. COMPOSANTS PREMIUM INCLUS.**

REQUIS ABSOLUMENT :
1. Inclure les 4 composants premium dans chaque page
2. Utiliser les données spécifiques au domaine
3. Appliquer le CSS complet avec animations
4. Générer TOUS les fichiers de l'architecture
5. Code production-ready avec TypeScript
6. Responsive design avec Tailwind CSS`;
}

export function parseCodeResponse(response: string): Map<string, string> {
  const files = new Map<string, string>();
  
  try {
    // Pattern pour extraire les fichiers avec le nouveau format
    const filePattern = /\/\/ Fichier:\s*(.+?)\n([\s\S]*?)(?=\/\/ Fichier:|$)/g;
    let match;
    
    while ((match = filePattern.exec(response)) !== null) {
      const filePath = match[1].trim();
      let content = match[2].trim();
      
      // Nettoyer le contenu (supprimer les marqueurs de code si présents)
      content = content.replace(/^```[\w]*\n?/gm, '').replace(/```\s*$/gm, '');
      
      files.set(filePath, content);
    }
    
    // Fallback: essayer l'ancien format filepath:
    if (files.size === 0) {
      const fallbackPattern = /```filepath:(.+?)\n([\s\S]*?)```/g;
      
      while ((match = fallbackPattern.exec(response)) !== null) {
        const filePath = match[1].trim();
        const content = match[2].trim();
        files.set(filePath, content);
      }
    }
    
    // Si toujours aucun fichier, essayer les blocs de code généraux
    if (files.size === 0) {
      const generalPattern = /```(?:tsx?|jsx?|css|json)?\n([\s\S]*?)```/g;
      let generalMatch;
      let fileIndex = 0;
      
      while ((generalMatch = generalPattern.exec(response)) !== null) {
        const content = generalMatch[1].trim();
        if (content.length > 50) { // Éviter les petits snippets
          let extension = 'tsx';
          
          // Détecter le type de fichier basé sur le contenu
          if (content.includes('@tailwind') || content.includes('@keyframes')) {
            extension = 'css';
          } else if (content.includes('"name"') && content.includes('"dependencies"')) {
            extension = 'json';
          }
          
          files.set(`generated-file-${fileIndex}.${extension}`, content);
          fileIndex++;
        }
      }
    }
    
  } catch (error) {
    console.warn('Erreur lors du parsing des fichiers:', error);
  }
  
  return files;
}

export function extractProjectMetadata(response: string): {
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  description?: string;
} {
  try {
    // Chercher le contenu du package.json dans la réponse
    const packageJsonMatch = response.match(/(?:package\.json|"name"[\s\S]*?"dependencies"[\s\S]*?})/);
    
    if (packageJsonMatch) {
      try {
        // Essayer de parser le JSON avec réparation automatique
        const jsonContent = packageJsonMatch[0];
        const cleanJson = jsonContent.replace(/\/\/.*$/gm, ''); // Supprimer les commentaires
        const packageData = parseWithJSONFix(cleanJson);
        
        return {
          dependencies: packageData.dependencies || {},
          scripts: packageData.scripts || {},
          description: packageData.description || 'Generated by AI'
        };
      } catch (parseError) {
        console.warn('Erreur parsing package.json:', parseError);
      }
    }
    
    // Extraction basique via regex si parsing JSON échoue
    const dependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {};
    
    // Chercher les dépendances courantes
    const commonDeps = ['next', 'react', 'typescript', 'tailwindcss', 'lucide-react'];
    commonDeps.forEach(dep => {
      if (response.includes(dep)) {
        dependencies[dep] = '^14.0.0'; // Version par défaut
      }
    });
    
    // Scripts standards
    scripts['dev'] = 'next dev';
    scripts['build'] = 'next build';
    scripts['start'] = 'next start';
    scripts['lint'] = 'next lint';
    
    return {
      dependencies,
      scripts,
      description: 'AI Generated Application with Premium Animations'
    };
    
  } catch (error) {
    console.warn('Erreur extraction metadata:', error);
    return {
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.4.0'
      },
      scripts: {
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start'
      },
      description: 'Generated by AI'
    };
  }
}