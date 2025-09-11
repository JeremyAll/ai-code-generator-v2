/**
 * PHASE 4 - COMPOSANTS MÉTIER
 * Composants avec logique métier par domaine qui utilisent les contextes
 */

export interface BusinessComponent {
  name: string;
  filePath: string;
  code: string;
  dependencies: string[];
  contexts: string[]; // Contextes utilisés
  description: string;
}

export interface DomainBusinessComponents {
  components: BusinessComponent[];
  imports: string[];
}

/**
 * Templates de composants métier par domaine
 */
export const BusinessComponents: { [key: string]: DomainBusinessComponents } = {
  
  // E-COMMERCE
  'ecommerce': {
    components: [
      {
        name: 'AddToCartButton',
        filePath: 'components/business/AddToCartButton.tsx',
        contexts: ['useCart'],
        dependencies: ['lucide-react'],
        description: 'Bouton d\'ajout au panier avec état et feedback',
        code: `'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    size?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const { addToCart, items } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Vérifier si le produit est déjà dans le panier
  const isInCart = items.some(item => item.id === product.id);

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        size: product.size,
        image: product.image
      });
      
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      
    } catch (error) {
      console.error('Erreur ajout panier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border border-black hover:bg-gray-50'
  };

  if (justAdded) {
    return (
      <button
        disabled
        className={\`\${sizeClasses[size]} \${variantClasses.primary} rounded-lg font-medium transition-all duration-200 flex items-center gap-2 bg-green-600 hover:bg-green-600 \${className}\`}
      >
        <Check className="w-4 h-4" />
        Ajouté !
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={\`\${sizeClasses[size]} \${variantClasses[variant]} rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed \${className}\`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4" />
      )}
      {isLoading ? 'Ajout...' : (isInCart ? 'Ajouter encore' : 'Ajouter au panier')}
    </button>
  );
};
`
      },
      {
        name: 'ProductGrid',
        filePath: 'components/business/ProductGrid.tsx',
        contexts: ['useCart'],
        dependencies: ['lucide-react'],
        description: 'Grille de produits avec actions rapides',
        code: `'use client';

import React from 'react';
import { Heart, Eye } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { AddToCartButton } from './AddToCartButton';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  badge?: string;
}

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  showQuickActions?: boolean;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 3,
  showQuickActions = true,
  className = ''
}) => {
  const { items } = useCart();

  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={\`grid \${gridClasses[columns]} gap-6 \${className}\`}>
      {products.map((product) => {
        const isInCart = items.some(item => item.id === product.id);
        
        return (
          <div key={product.id} className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded">
                  {product.badge}
                </div>
              )}
              
              {/* Stock Status */}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Épuisé</span>
                </div>
              )}
              
              {/* Quick Actions */}
              {showQuickActions && product.inStock && (
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="p-4">
              <div className="mb-2">
                <span className="text-sm text-gray-500 uppercase tracking-wide">{product.category}</span>
                <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-gray-900">{product.price}€</span>
                {isInCart && (
                  <span className="text-sm text-green-600 font-medium">Dans le panier</span>
                )}
              </div>
              
              {/* Add to Cart Button */}
              <AddToCartButton
                product={product}
                size="sm"
                className="w-full justify-center"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
`
      },
      {
        name: 'CartSidebar',
        filePath: 'components/business/CartSidebar.tsx',
        contexts: ['useCart'],
        dependencies: ['lucide-react'],
        description: 'Sidebar du panier avec gestion des quantités',
        code: `'use client';

import React from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CartSidebarProps {
  className?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ className = '' }) => {
  const {
    isOpen,
    closeCart,
    items,
    total,
    itemCount,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className={\`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 flex flex-col \${className}\`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Panier ({itemCount})</h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag className="w-12 h-12 mb-4" />
              <p>Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={\`\${item.id}-\${item.size || 'default'}\`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    {item.size && (
                      <p className="text-xs text-gray-500">Taille: {item.size}</p>
                    )}
                    <p className="font-semibold text-sm">{item.price}€</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-xl font-bold">{total.toFixed(2)}€</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Vider
              </button>
              <button className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Commander
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
`
      },
      {
        name: 'SearchBar',
        filePath: 'components/business/SearchBar.tsx',
        contexts: [],
        dependencies: ['lucide-react'],
        description: 'Barre de recherche avec suggestions',
        code: `'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';

interface SearchSuggestion {
  id: string;
  text: string;
  category: string;
  trending?: boolean;
}

interface SearchBarProps {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  onSearch?: (query: string) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher des produits...',
  suggestions = [],
  onSearch,
  onSuggestionClick,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      // Show trending suggestions when no query
      const trending = suggestions.filter(s => s.trending);
      setFilteredSuggestions(trending.slice(0, 5));
    }
  }, [query, suggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    onSuggestionClick?.(suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={\`relative w-full max-w-md \${className}\`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            <>
              {query.length === 0 && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  Tendances
                </div>
              )}
              
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {suggestion.trending && <TrendingUp className="w-3 h-3 text-orange-500" />}
                      <span className="text-sm">{suggestion.text}</span>
                    </div>
                    <div className="text-xs text-gray-500">{suggestion.category}</div>
                  </div>
                  <Search className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                </button>
              ))}
            </>
          ) : query.length > 0 ? (
            <div className="px-3 py-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">
              <p className="text-sm">Commencez à taper pour rechercher</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
`
      }
    ],
    imports: [
      "import { AddToCartButton } from '../business/AddToCartButton';",
      "import { ProductGrid } from '../business/ProductGrid';",
      "import { CartSidebar } from '../business/CartSidebar';",
      "import { SearchBar } from '../business/SearchBar';"
    ]
  },

  // SaaS
  'saas': {
    components: [
      {
        name: 'UsageIndicator',
        filePath: 'components/business/UsageIndicator.tsx',
        contexts: ['useUser'],
        dependencies: ['lucide-react'],
        description: 'Indicateur d\'usage avec barre de progression',
        code: `'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface UsageIndicatorProps {
  showUpgrade?: boolean;
  className?: string;
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  showUpgrade = true,
  className = ''
}) => {
  const { user, incrementUsage } = useUser();

  if (!user) return null;

  const percentage = (user.usage.current / user.usage.limit) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-600';
    if (isNearLimit) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getIcon = () => {
    if (isAtLimit) return <AlertTriangle className="w-4 h-4" />;
    if (isNearLimit) return <TrendingUp className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className={\`bg-white rounded-lg border p-4 \${className}\`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Utilisation</h3>
        <div className={\`flex items-center gap-1 \${getStatusColor()}\`}>
          {getIcon()}
          <span className="text-sm font-medium">
            {user.usage.current} / {user.usage.limit}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={\`h-2 rounded-full transition-all duration-300 \${getProgressColor()}\`}
            style={{ width: \`\${Math.min(percentage, 100)}%\` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>0</span>
          <span>{percentage.toFixed(1)}%</span>
          <span>{user.usage.limit}</span>
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-3">
        {isAtLimit ? (
          <p className="text-sm text-red-600">
            ⚠️ Limite atteinte. Mettez à niveau pour continuer.
          </p>
        ) : isNearLimit ? (
          <p className="text-sm text-orange-600">
            🔔 Attention, vous approchez de votre limite.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            ✅ Vous êtes dans les limites de votre plan.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={incrementUsage}
          disabled={isAtLimit}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Tester (+1)
        </button>
        
        {showUpgrade && (isAtLimit || isNearLimit) && (
          <button className="flex-1 px-3 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors">
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};
`
      },
      {
        name: 'PlanCard',
        filePath: 'components/business/PlanCard.tsx',
        contexts: ['useSubscription'],
        dependencies: ['lucide-react'],
        description: 'Carte de plan d\'abonnement avec upgrade',
        code: `'use client';

import React from 'react';
import { Check, Star, Zap } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  onUpgrade?: (planId: string) => void;
  className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onUpgrade,
  className = ''
}) => {
  const { subscription, upgradePlan } = useSubscription();
  const isCurrent = subscription?.plan === plan.name.toLowerCase();

  const handleUpgrade = () => {
    upgradePlan(plan.name.toLowerCase());
    onUpgrade?.(plan.id);
  };

  return (
    <div className={\`relative bg-white rounded-xl border-2 p-6 \${
      plan.popular ? 'border-black' : 'border-gray-200'
    } \${isCurrent ? 'ring-2 ring-green-500' : ''} \${className}\`}>
      
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-1 bg-black text-white px-3 py-1 rounded-full text-xs font-medium">
            <Star className="w-3 h-3" />
            Populaire
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Actuel
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{plan.price}€</span>
          <span className="text-gray-500">/{plan.billing === 'monthly' ? 'mois' : 'an'}</span>
        </div>
        {plan.billing === 'yearly' && (
          <div className="text-sm text-green-600 font-medium">
            💰 2 mois offerts !
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleUpgrade}
        disabled={isCurrent}
        className={\`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 \${
          isCurrent
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : plan.popular
            ? 'bg-black text-white hover:bg-gray-800 hover:scale-105'
            : 'bg-gray-900 text-white hover:bg-black hover:scale-105'
        }\`}
      >
        {isCurrent ? (
          'Plan actuel'
        ) : plan.name === 'Free' ? (
          'Gratuit'
        ) : (
          <>
            <Zap className="w-4 h-4 inline mr-2" />
            Choisir {plan.name}
          </>
        )}
      </button>

      {/* Money-back guarantee */}
      {!isCurrent && plan.name !== 'Free' && (
        <p className="text-xs text-center text-gray-500 mt-3">
          Garantie 30 jours satisfait ou remboursé
        </p>
      )}
    </div>
  );
};
`
      }
    ],
    imports: [
      "import { UsageIndicator } from '../business/UsageIndicator';",
      "import { PlanCard } from '../business/PlanCard';"
    ]
  },

  // PORTFOLIO
  'portfolio': {
    components: [
      {
        name: 'ThemeToggle',
        filePath: 'components/business/ThemeToggle.tsx',
        contexts: ['useTheme'],
        dependencies: ['lucide-react'],
        description: 'Toggle pour changer de thème avec animation',
        code: `'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const { theme, toggleTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={\`flex items-center gap-2 \${className}\`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {theme === 'light' ? 'Clair' : 'Sombre'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        className={\`
          \${sizeClasses[size]}
          relative rounded-full
          bg-gray-200 dark:bg-gray-700
          border-2 border-gray-300 dark:border-gray-600
          transition-all duration-300 ease-in-out
          hover:scale-110 hover:border-gray-400 dark:hover:border-gray-500
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white
          group overflow-hidden
        \`}
        title={\`Passer en mode \${theme === 'light' ? 'sombre' : 'clair'}\`}
      >
        {/* Background Animation */}
        <div 
          className={\`
            absolute inset-0 rounded-full transition-all duration-500 ease-in-out
            \${theme === 'light' 
              ? 'bg-gradient-to-br from-yellow-300 to-orange-400 scale-0 group-hover:scale-100' 
              : 'bg-gradient-to-br from-blue-600 to-purple-700 scale-100'
            }
          \`}
        />
        
        {/* Sun Icon */}
        <div 
          className={\`
            absolute inset-0 flex items-center justify-center
            transition-all duration-500 ease-in-out
            \${theme === 'light' 
              ? 'scale-100 rotate-0 opacity-100' 
              : 'scale-0 rotate-180 opacity-0'
            }
          \`}
        >
          <Sun className={\`\${iconSizes[size]} text-orange-600 dark:text-yellow-400\`} />
        </div>
        
        {/* Moon Icon */}
        <div 
          className={\`
            absolute inset-0 flex items-center justify-center
            transition-all duration-500 ease-in-out
            \${theme === 'dark' 
              ? 'scale-100 rotate-0 opacity-100' 
              : 'scale-0 -rotate-180 opacity-0'
            }
          \`}
        >
          <Moon className={\`\${iconSizes[size]} text-blue-400\`} />
        </div>
        
        {/* Rotating Border Effect */}
        <div className={\`
          absolute inset-0 rounded-full border-2 border-transparent
          bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          animate-spin
        \`} style={{
          background: theme === 'light' 
            ? 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fbbf24)'
            : 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)',
          maskComposite: 'subtract',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          padding: '2px'
        }} />
      </button>
    </div>
  );
};
`
      },
      {
        name: 'ContactForm',
        filePath: 'components/business/ContactForm.tsx',
        contexts: [],
        dependencies: ['lucide-react'],
        description: 'Formulaire de contact avec validation',
        code: `'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Mail, User, MessageCircle } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  className?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  className = ''
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Le message doit faire au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
    } catch (error) {
      console.error('Erreur envoi formulaire:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className={\`bg-green-50 border border-green-200 rounded-lg p-8 text-center \${className}\`}>
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-800 mb-2">Message envoyé !</h3>
        <p className="text-green-700 mb-4">
          Merci pour votre message. Je vous répondrai dans les plus brefs délais.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-green-600 hover:text-green-800 font-medium"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={\`space-y-6 \${className}\`}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Nom complet
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={\`
              w-full px-4 py-3 border rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
              \${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            \`}
            placeholder="Votre nom"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={\`
              w-full px-4 py-3 border rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
              \${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            \`}
            placeholder="votre@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Subject Field */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Sujet
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          className={\`
            w-full px-4 py-3 border rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            \${errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'}
          \`}
          placeholder="Le sujet de votre message"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          <MessageCircle className="w-4 h-4 inline mr-1" />
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          className={\`
            w-full px-4 py-3 border rounded-lg transition-colors resize-none
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            \${errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'}
          \`}
          placeholder="Votre message..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.message}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.message.length} caractères (minimum 10)
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium
                 hover:bg-gray-800 transition-colors duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Envoyer le message
          </>
        )}
      </button>
    </form>
  );
};
`
      }
    ],
    imports: [
      "import { ThemeToggle } from '../business/ThemeToggle';",
      "import { ContactForm } from '../business/ContactForm';"
    ]
  }
};

/**
 * Obtenir les composants métier pour un domaine donné
 */
export function getDomainBusinessComponents(domain: string): DomainBusinessComponents | null {
  // Utiliser la même logique de mapping que les contextes
  const normalizedDomain = domain.toLowerCase().replace(/[_\-\s]/g, '');
  
  const domainMapping: { [key: string]: string } = {
    'ecommerce': 'ecommerce',
    'ecommerceb2c': 'ecommerce',
    'ecommerceb2b': 'ecommerce',
    'shop': 'ecommerce',
    'store': 'ecommerce',
    'marketplace': 'ecommerce',
    'saas': 'saas',
    'saasanalytics': 'saas',
    'sass': 'saas',
    'app': 'saas',
    'dashboard': 'saas',
    'analytics': 'saas',
    'platform': 'saas',
    'portfolio': 'portfolio',
    'blog': 'portfolio',
    'personal': 'portfolio',
    'resume': 'portfolio'
  };

  const mappedDomain = domainMapping[normalizedDomain];
  return mappedDomain ? BusinessComponents[mappedDomain] : null;
}