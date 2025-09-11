/**
 * PHASE 3 - STATE MANAGEMENT SIMPLE
 * Templates de contextes React automatiques par domaine métier
 */

export interface DomainContext {
  name: string;
  filePath: string;
  code: string;
  dependencies?: string[];
}

export interface DomainStateTemplate {
  contexts: DomainContext[];
  providers: string[];
  hooks: string[];
}

/**
 * Templates de contextes par domaine métier
 */
export const DomainContexts: { [key: string]: DomainStateTemplate } = {
  // E-COMMERCE
  'ecommerce': {
    contexts: [
      {
        name: 'CartContext',
        filePath: 'contexts/CartContext.tsx',
        code: `'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        };
      }
      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'REMOVE_ITEM':
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        total: filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: filteredItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'UPDATE_QUANTITY':
      const quantityUpdatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: quantityUpdatedItems,
        total: quantityUpdatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: quantityUpdatedItems.reduce((sum, item) => sum + item.quantity, 0)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0
      };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    default:
      return state;
  }
};

// Initial state
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isOpen: false
};

// Context
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

// Provider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const { state, dispatch } = context;

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...item, quantity: item.quantity || 1 } });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  return {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart
  };
};
`
      },
      {
        name: 'AuthContext',
        filePath: 'contexts/AuthContext.tsx',
        code: `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Context
const AuthContext = createContext<{
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
} | null>(null);

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Simuler la vérification de session au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simuler un appel API
        const token = localStorage.getItem('auth-token');
        if (token) {
          // Simuler un utilisateur authentifié
          const user: User = {
            id: '1',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'user'
          };
          setState({
            user,
            isLoading: false,
            isAuthenticated: true
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simuler un appel API de login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: 'user'
      };

      localStorage.setItem('auth-token', 'fake-token');
      
      setState({
        user,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simuler un appel API de signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: '1',
        email,
        name,
        role: 'user'
      };

      localStorage.setItem('auth-token', 'fake-token');
      
      setState({
        user,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
`
      }
    ],
    providers: ['CartProvider', 'AuthProvider'],
    hooks: ['useCart', 'useAuth']
  },

  // SaaS
  'saas': {
    contexts: [
      {
        name: 'UserContext',
        filePath: 'contexts/UserContext.tsx',
        code: `'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  usage: {
    current: number;
    limit: number;
  };
}

// Context
const UserContext = createContext<{
  user: User | null;
  updateUser: (updates: Partial<User>) => void;
  incrementUsage: () => void;
} | null>(null);

// Provider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    plan: 'free',
    usage: { current: 5, limit: 10 }
  });

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const incrementUsage = () => {
    setUser(prev => 
      prev ? {
        ...prev,
        usage: {
          ...prev.usage,
          current: Math.min(prev.usage.current + 1, prev.usage.limit)
        }
      } : null
    );
  };

  return (
    <UserContext.Provider value={{ user, updateUser, incrementUsage }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
`
      },
      {
        name: 'SubscriptionContext',
        filePath: 'contexts/SubscriptionContext.tsx',
        code: `'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface Subscription {
  id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  features: string[];
}

// Context
const SubscriptionContext = createContext<{
  subscription: Subscription | null;
  upgradePlan: (plan: string) => void;
  cancelSubscription: () => void;
} | null>(null);

// Provider
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>({
    id: '1',
    plan: 'free',
    status: 'active',
    currentPeriodEnd: new Date('2024-12-31'),
    features: ['Basic features', '10 projects', '5GB storage']
  });

  const upgradePlan = (plan: string) => {
    setSubscription(prev => prev ? { ...prev, plan: plan as any } : null);
  };

  const cancelSubscription = () => {
    setSubscription(prev => prev ? { ...prev, status: 'canceled' } : null);
  };

  return (
    <SubscriptionContext.Provider value={{ subscription, upgradePlan, cancelSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Hook
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
`
      }
    ],
    providers: ['UserProvider', 'SubscriptionProvider'],
    hooks: ['useUser', 'useSubscription']
  },

  // PORTFOLIO
  'portfolio': {
    contexts: [
      {
        name: 'ThemeContext',
        filePath: 'contexts/ThemeContext.tsx',
        code: `'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
type Theme = 'light' | 'dark';

// Context
const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
} | null>(null);

// Provider
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
`
      }
    ],
    providers: ['ThemeProvider'],
    hooks: ['useTheme']
  }
};

/**
 * Obtenir les contextes pour un domaine donné
 */
export function getDomainContexts(domain: string): DomainStateTemplate | null {
  // Normaliser le domaine (supprimer underscores, hyphens, espaces)
  const normalizedDomain = domain.toLowerCase().replace(/[_\-\s]/g, '');
  
  console.log(`[DEBUG] getDomainContexts: "${domain}" -> "${normalizedDomain}"`);
  
  // Mapping des domaines
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
  console.log(`[DEBUG] mappedDomain: "${normalizedDomain}" -> "${mappedDomain}"`);
  
  return mappedDomain ? DomainContexts[mappedDomain] : null;
}

/**
 * Générer le layout wrapper avec tous les providers
 */
export function generateLayoutWrapper(providers: string[]): string {
  const imports = providers.map(provider => {
    const contextName = provider.replace('Provider', 'Context');
    return `import { ${provider} } from '../contexts/${contextName}';`;
  }).join('\n');

  const wrapperOpen = providers.map(provider => `    <${provider}>`).join('\n');
  const wrapperClose = providers.map(provider => `    </${provider}>`).reverse().join('\n');

  return `${imports}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
${wrapperOpen}
      {children}
${wrapperClose}
  );
}`;
}