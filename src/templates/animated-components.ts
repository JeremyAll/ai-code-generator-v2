/**
 * Templates de composants React avec animations premium
 * Ces templates sont garantis de fonctionner et peuvent être injectés directement
 */

export const ANIMATED_COMPONENTS = {
  // Card 3D avec effet de perspective
  'Card3D': `'use client';
import React from 'react';

export const Card3D = ({ children, className = "" }) => {
  const [transform, setTransform] = React.useState('');
  const cardRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTransform(\`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg)\`);
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  return (
    <div
      ref={cardRef}
      className={\`relative bg-white rounded-xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl \${className}\`}
      style={{ transform, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative z-10">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-xl" />
    </div>
  );
};`,

  // Bouton magnétique avec effet d'attraction
  'MagneticButton': `'use client';
import React from 'react';

export const MagneticButton = ({ children, onClick, className = "" }) => {
  const ref = React.useRef(null);
  const [transform, setTransform] = React.useState('');

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTransform(\`translate(\${x * 0.2}px, \${y * 0.2}px)\`);
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={\`relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300 overflow-hidden group \${className}\`}
      style={{ transform }}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-300" />
    </button>
  );
};`,

  // Compteur animé
  'AnimatedCounter': `'use client';
import React from 'react';

export const AnimatedCounter = ({ value, duration = 2000, prefix = '', suffix = '' }) => {
  const [count, setCount] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isVisible) return;

    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, duration, isVisible]);

  return (
    <div ref={ref} className="text-4xl font-bold">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
};`,

  // Hero avec effet Parallax
  'HeroParallax': `'use client';
import React from 'react';

export const HeroParallax = ({ title, subtitle, backgroundImage }) => {
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative h-screen overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: \`url(\${backgroundImage || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920'})\`,
          transform: \`translateY(\${offsetY * 0.5}px)\`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
      <div className="relative h-full flex items-center justify-center text-white text-center px-4">
        <div className="max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 animate-fade-up">
            {title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-up animation-delay-200">
            {subtitle}
          </p>
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 animate-fade-up animation-delay-400">
            Commencer →
          </button>
        </div>
      </div>
    </div>
  );
};`,

  // Modal avec animation
  'AnimatedModal': `'use client';
import React from 'react';

export const AnimatedModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {title && (
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
};`,

  // Loading Spinner animé
  'LoadingSpinner': `'use client';
import React from 'react';

export const LoadingSpinner = ({ size = 'md', color = 'purple' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={\`\${sizeClasses[size]} relative\`}>
        <div className={\`absolute inset-0 border-4 border-\${color}-200 rounded-full\`} />
        <div className={\`absolute inset-0 border-4 border-\${color}-600 rounded-full border-t-transparent animate-spin\`} />
      </div>
    </div>
  );
};`,

  // Progress Bar animée
  'AnimatedProgress': `'use client';
import React from 'react';

export const AnimatedProgress = ({ value, max = 100, label = '', showPercentage = true }) => {
  const [width, setWidth] = React.useState(0);
  const percentage = Math.round((value / max) * 100);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: \`\${width}%\` }}
        />
      </div>
    </div>
  );
};`
};

// CSS pour les animations (à ajouter dans globals.css)
export const ANIMATION_CSS = `
/* Animations Premium */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-up {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(147, 51, 234, 0.6);
  }
}

/* Classes d'animation */
.animate-fade-up {
  animation: fade-up 0.7s ease-out forwards;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-scale-up {
  animation: scale-up 0.3s ease-out forwards;
}

.animate-slide-in-right {
  animation: slide-in-right 0.5s ease-out forwards;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Délais d'animation */
.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}

.animation-delay-600 {
  animation-delay: 600ms;
}

/* Transitions smooth */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Effets de hover premium */
.hover-lift {
  transition: transform 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
}

.hover-grow {
  transition: transform 0.3s ease;
}

.hover-grow:hover {
  transform: scale(1.05);
}

/* Glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Gradient Text */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`;

/**
 * Fonction pour obtenir le code d'un composant
 */
export function getAnimatedComponent(name: string): string | undefined {
  return ANIMATED_COMPONENTS[name as keyof typeof ANIMATED_COMPONENTS];
}

/**
 * Fonction pour obtenir tous les composants
 */
export function getAllAnimatedComponents(): typeof ANIMATED_COMPONENTS {
  return ANIMATED_COMPONENTS;
}

/**
 * Template de base pour une page avec animations
 */
export const ANIMATED_PAGE_TEMPLATE = `'use client';
import React from 'react';
import { Card3D } from '@/components/ui/Card3D';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { HeroParallax } from '@/components/ui/HeroParallax';

export default function AnimatedPage() {
  return (
    <div className="min-h-screen">
      <HeroParallax 
        title="Application Premium"
        subtitle="Avec animations fluides et modernes"
        backgroundImage="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920"
      />
      
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
            Fonctionnalités Premium
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card3D>
              <h3 className="text-2xl font-bold mb-4">Statistiques</h3>
              <AnimatedCounter value={1234} prefix="+" suffix=" utilisateurs" />
              <p className="mt-4 text-gray-600">
                Croissance rapide et constante
              </p>
            </Card3D>
            
            <Card3D>
              <h3 className="text-2xl font-bold mb-4">Performance</h3>
              <AnimatedCounter value={99} suffix="%" />
              <p className="mt-4 text-gray-600">
                Disponibilité garantie
              </p>
            </Card3D>
            
            <Card3D>
              <h3 className="text-2xl font-bold mb-4">Satisfaction</h3>
              <AnimatedCounter value={4.9} suffix="/5" />
              <p className="mt-4 text-gray-600">
                Note moyenne des utilisateurs
              </p>
            </Card3D>
          </div>
          
          <div className="text-center mt-12">
            <MagneticButton onClick={() => console.log('Action!')}>
              Découvrir Plus →
            </MagneticButton>
          </div>
        </div>
      </section>
    </div>
  );
}`;