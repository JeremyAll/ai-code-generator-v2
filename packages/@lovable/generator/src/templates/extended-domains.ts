/**
 * PHASE 5.3 - TEMPLATES DOMAINES ÉTENDUS
 * Templates avancés pour SaaS, Blog/CMS, E-learning, et Portfolio amélioré
 */

export const EXTENDED_DOMAIN_TEMPLATES = {
  saas: {
    contexts: [
      {
        name: 'DashboardContext',
        file: 'contexts/DashboardContext.tsx',
        content: `'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Metric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  data: any;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardState {
  metrics: Metric[];
  widgets: Widget[];
  dateRange: { start: Date; end: Date };
  isLoading: boolean;
  error: string | null;
}

type DashboardAction = 
  | { type: 'SET_METRICS'; payload: Metric[] }
  | { type: 'ADD_WIDGET'; payload: Widget }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; updates: Partial<Widget> } }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: DashboardState = {
  metrics: [],
  widgets: [],
  dateRange: { 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    end: new Date() 
  },
  isLoading: false,
  error: null
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'ADD_WIDGET':
      return { ...state, widgets: [...state.widgets, action.payload] };
    case 'UPDATE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.map(w => 
          w.id === action.payload.id ? { ...w, ...action.payload.updates } : w
        )
      };
    case 'REMOVE_WIDGET':
      return {
        ...state,
        widgets: state.widgets.filter(w => w.id !== action.payload)
      };
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }

  const { state, dispatch } = context;

  const addWidget = (widget: Omit<Widget, 'id'>) => {
    const newWidget = { ...widget, id: \`widget-\${Date.now()}\` };
    dispatch({ type: 'ADD_WIDGET', payload: newWidget });
  };

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    dispatch({ type: 'UPDATE_WIDGET', payload: { id, updates } });
  };

  const removeWidget = (id: string) => {
    dispatch({ type: 'REMOVE_WIDGET', payload: id });
  };

  const updateMetrics = (metrics: Metric[]) => {
    dispatch({ type: 'SET_METRICS', payload: metrics });
  };

  const setDateRange = (start: Date, end: Date) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: { start, end } });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  return {
    ...state,
    addWidget,
    updateWidget,
    removeWidget,
    updateMetrics,
    setDateRange,
    setLoading,
    setError
  };
};`
      },
      {
        name: 'AnalyticsContext',
        file: 'contexts/AnalyticsContext.tsx',
        content: `'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

interface AnalyticsEvent {
  id: string;
  name: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

interface AnalyticsState {
  events: AnalyticsEvent[];
  sessionId: string;
  userId?: string;
  isTracking: boolean;
}

type AnalyticsAction =
  | { type: 'TRACK_EVENT'; payload: Omit<AnalyticsEvent, 'id' | 'timestamp' | 'sessionId'> }
  | { type: 'SET_USER'; payload: string }
  | { type: 'START_SESSION' }
  | { type: 'END_SESSION' }
  | { type: 'SET_TRACKING'; payload: boolean };

const initialState: AnalyticsState = {
  events: [],
  sessionId: \`session-\${Date.now()}\`,
  isTracking: true
};

function analyticsReducer(state: AnalyticsState, action: AnalyticsAction): AnalyticsState {
  switch (action.type) {
    case 'TRACK_EVENT':
      const event: AnalyticsEvent = {
        ...action.payload,
        id: \`event-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
        timestamp: new Date(),
        sessionId: state.sessionId
      };
      return {
        ...state,
        events: [...state.events, event]
      };
    case 'SET_USER':
      return { ...state, userId: action.payload };
    case 'START_SESSION':
      return { ...state, sessionId: \`session-\${Date.now()}\` };
    case 'END_SESSION':
      return { ...state, sessionId: '' };
    case 'SET_TRACKING':
      return { ...state, isTracking: action.payload };
    default:
      return state;
  }
}

const AnalyticsContext = createContext<{
  state: AnalyticsState;
  dispatch: React.Dispatch<AnalyticsAction>;
} | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);

  useEffect(() => {
    // Auto-track page views
    const trackPageView = () => {
      if (state.isTracking) {
        dispatch({
          type: 'TRACK_EVENT',
          payload: {
            name: 'page_view',
            properties: {
              path: window.location.pathname,
              referrer: document.referrer
            }
          }
        });
      }
    };

    trackPageView();
    window.addEventListener('popstate', trackPageView);
    
    return () => window.removeEventListener('popstate', trackPageView);
  }, [state.isTracking]);

  return (
    <AnalyticsContext.Provider value={{ state, dispatch }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }

  const { state, dispatch } = context;

  const track = (name: string, properties: Record<string, any> = {}) => {
    if (state.isTracking) {
      dispatch({
        type: 'TRACK_EVENT',
        payload: { name, properties, userId: state.userId }
      });
    }
  };

  const identify = (userId: string) => {
    dispatch({ type: 'SET_USER', payload: userId });
  };

  const startSession = () => {
    dispatch({ type: 'START_SESSION' });
  };

  const endSession = () => {
    dispatch({ type: 'END_SESSION' });
  };

  const setTracking = (enabled: boolean) => {
    dispatch({ type: 'SET_TRACKING', payload: enabled });
  };

  return {
    ...state,
    track,
    identify,
    startSession,
    endSession,
    setTracking
  };
};`
      }
    ],
    components: [
      {
        name: 'MetricsCard',
        file: 'components/business/MetricsCard.tsx',
        content: `'use client';

import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

interface MetricsCardProps {
  metricId?: string;
  title?: string;
  value?: number;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  metricId,
  title = "Métrique",
  value = 0,
  unit = "",
  change = 0,
  trend = 'stable',
  className = ''
}) => {
  const { metrics } = useDashboard();
  
  // Si un ID est fourni, utiliser les données du context
  const metric = metricId ? metrics.find(m => m.id === metricId) : null;
  const displayTitle = metric?.name || title;
  const displayValue = metric?.value || value;
  const displayUnit = metric?.unit || unit;
  const displayChange = metric?.change || change;
  const displayTrend = metric?.trend || trend;

  const formatValue = (val: number): string => {
    if (val >= 1000000) return \`\${(val / 1000000).toFixed(1)}M\`;
    if (val >= 1000) return \`\${(val / 1000).toFixed(1)}K\`;
    return val.toString();
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <div className={\`bg-white rounded-lg shadow-md p-6 border border-gray-100 \${className}\`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{displayTitle}</h3>
        <span className={\`text-lg \${getTrendColor(displayTrend)}\`}>
          {getTrendIcon(displayTrend)}
        </span>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-900">
          {formatValue(displayValue)}
        </span>
        {displayUnit && (
          <span className="text-sm text-gray-500">{displayUnit}</span>
        )}
      </div>
      
      {displayChange !== 0 && (
        <div className="mt-2 flex items-center">
          <span className={\`text-sm font-medium \${getTrendColor(displayTrend)}\`}>
            {displayChange > 0 ? '+' : ''}{displayChange}%
          </span>
          <span className="text-sm text-gray-500 ml-2">vs période précédente</span>
        </div>
      )}
    </div>
  );
};`
      },
      {
        name: 'AnalyticsChart',
        file: 'components/business/AnalyticsChart.tsx',
        content: `'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useAnalytics } from '../../contexts/AnalyticsContext';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface AnalyticsChartProps {
  title?: string;
  data?: ChartDataPoint[];
  type?: 'line' | 'bar' | 'area';
  height?: number;
  className?: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title = "Graphique Analytics",
  data = [],
  type = 'line',
  height = 300,
  className = ''
}) => {
  const { dateRange } = useDashboard();
  const { track } = useAnalytics();
  const [chartData, setChartData] = useState<ChartDataPoint[]>(data);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simuler le chargement de données basé sur la période
    setIsLoading(true);
    
    const generateMockData = () => {
      const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const mockData: ChartDataPoint[] = [];
      
      for (let i = 0; i < Math.min(days, 30); i++) {
        const date = new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
        mockData.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 1000) + 100,
          label: \`Jour \${i + 1}\`
        });
      }
      
      return mockData;
    };

    setTimeout(() => {
      if (data.length === 0) {
        setChartData(generateMockData());
      } else {
        setChartData(data);
      }
      setIsLoading(false);
    }, 500);

    // Track chart view
    track('chart_viewed', {
      chart_title: title,
      chart_type: type,
      date_range: { start: dateRange.start, end: dateRange.end }
    });

  }, [dateRange, data, title, type, track]);

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));

  const renderLineChart = () => {
    if (chartData.length < 2) return null;

    const points = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = ((maxValue - point.value) / (maxValue - minValue)) * 80 + 10;
      return \`\${x},\${y}\`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {chartData.map((point, index) => {
          const x = (index / (chartData.length - 1)) * 100;
          const y = ((maxValue - point.value) / (maxValue - minValue)) * 80 + 10;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1"
              fill="#3B82F6"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    );
  };

  const renderBarChart = () => {
    const barWidth = 80 / chartData.length;
    
    return (
      <svg width="100%" height={height} viewBox="0 0 100 100">
        {chartData.map((point, index) => {
          const x = (index / chartData.length) * 100 + 10;
          const barHeight = ((point.value - minValue) / (maxValue - minValue)) * 80;
          const y = 90 - barHeight;
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth * 0.8}
              height={barHeight}
              fill="#3B82F6"
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  };

  const renderAreaChart = () => {
    if (chartData.length < 2) return null;

    const points = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = ((maxValue - point.value) / (maxValue - minValue)) * 80 + 10;
      return \`\${x},\${y}\`;
    }).join(' ');

    const areaPoints = \`0,90 \${points} 100,90\`;

    return (
      <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points={areaPoints}
          fill="#3B82F6"
          opacity="0.3"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar': return renderBarChart();
      case 'area': return renderAreaChart();
      default: return renderLineChart();
    }
  };

  if (isLoading) {
    return (
      <div className={\`bg-white rounded-lg shadow-md p-6 \${className}\`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={\`bg-white rounded-lg shadow-md p-6 \${className}\`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-sm text-gray-500">
          {chartData.length} points de données
        </span>
      </div>
      
      <div className="relative" style={{ height: height }}>
        {chartData.length > 0 ? (
          <div className="w-full h-full">
            {renderChart()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Aucune donnée disponible
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>Min: {minValue}</span>
        <span className="text-lg font-medium text-blue-600">
          Moyenne: {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length || 0)}
        </span>
        <span>Max: {maxValue}</span>
      </div>
    </div>
  );
};`
      }
    ]
  },

  blog: {
    contexts: [
      {
        name: 'BlogContext',
        file: 'contexts/BlogContext.tsx',
        content: `'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  categories: string[];
  tags: string[];
  publishedAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  views: number;
  likes: number;
  comments: Comment[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  email?: string;
  content: string;
  createdAt: Date;
  approved: boolean;
  replies?: Comment[];
}

interface BlogState {
  posts: BlogPost[];
  categories: string[];
  tags: string[];
  currentPost: BlogPost | null;
  searchQuery: string;
  selectedCategory: string;
  selectedTags: string[];
  isLoading: boolean;
  error: string | null;
}

type BlogAction =
  | { type: 'SET_POSTS'; payload: BlogPost[] }
  | { type: 'ADD_POST'; payload: BlogPost }
  | { type: 'UPDATE_POST'; payload: { id: string; updates: Partial<BlogPost> } }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SET_CURRENT_POST'; payload: BlogPost | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORY'; payload: string }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] }
  | { type: 'ADD_COMMENT'; payload: { postId: string; comment: Comment } }
  | { type: 'LIKE_POST'; payload: string }
  | { type: 'INCREMENT_VIEWS'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: BlogState = {
  posts: [],
  categories: [],
  tags: [],
  currentPost: null,
  searchQuery: '',
  selectedCategory: '',
  selectedTags: [],
  isLoading: false,
  error: null
};

function blogReducer(state: BlogState, action: BlogAction): BlogState {
  switch (action.type) {
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload,
        categories: [...new Set(action.payload.flatMap(p => p.categories))],
        tags: [...new Set(action.payload.flatMap(p => p.tags))]
      };
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts]
      };
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      };
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(p => p.id !== action.payload)
      };
    case 'SET_CURRENT_POST':
      return { ...state, currentPost: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SELECTED_CATEGORY':
      return { ...state, selectedCategory: action.payload };
    case 'SET_SELECTED_TAGS':
      return { ...state, selectedTags: action.payload };
    case 'ADD_COMMENT':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.postId
            ? { ...p, comments: [...p.comments, action.payload.comment] }
            : p
        )
      };
    case 'LIKE_POST':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload ? { ...p, likes: p.likes + 1 } : p
        )
      };
    case 'INCREMENT_VIEWS':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload ? { ...p, views: p.views + 1 } : p
        )
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const BlogContext = createContext<{
  state: BlogState;
  dispatch: React.Dispatch<BlogAction>;
} | null>(null);

export function BlogProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(blogReducer, initialState);

  return (
    <BlogContext.Provider value={{ state, dispatch }}>
      {children}
    </BlogContext.Provider>
  );
}

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }

  const { state, dispatch } = context;

  const addPost = (post: Omit<BlogPost, 'id' | 'views' | 'likes' | 'comments' | 'publishedAt' | 'updatedAt'>) => {
    const newPost: BlogPost = {
      ...post,
      id: \`post-\${Date.now()}\`,
      views: 0,
      likes: 0,
      comments: [],
      publishedAt: new Date(),
      updatedAt: new Date()
    };
    dispatch({ type: 'ADD_POST', payload: newPost });
  };

  const updatePost = (id: string, updates: Partial<BlogPost>) => {
    dispatch({ type: 'UPDATE_POST', payload: { id, updates: { ...updates, updatedAt: new Date() } } });
  };

  const deletePost = (id: string) => {
    dispatch({ type: 'DELETE_POST', payload: id });
  };

  const setCurrentPost = (post: BlogPost | null) => {
    if (post) {
      dispatch({ type: 'INCREMENT_VIEWS', payload: post.id });
    }
    dispatch({ type: 'SET_CURRENT_POST', payload: post });
  };

  const addComment = (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'approved'>) => {
    const newComment: Comment = {
      ...comment,
      id: \`comment-\${Date.now()}\`,
      createdAt: new Date(),
      approved: true // Auto-approve for demo
    };
    dispatch({ type: 'ADD_COMMENT', payload: { postId, comment: newComment } });
  };

  const likePost = (postId: string) => {
    dispatch({ type: 'LIKE_POST', payload: postId });
  };

  const searchPosts = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const filterByCategory = (category: string) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  };

  const filterByTags = (tags: string[]) => {
    dispatch({ type: 'SET_SELECTED_TAGS', payload: tags });
  };

  const getFilteredPosts = () => {
    let filtered = state.posts;

    if (state.searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(state.searchQuery.toLowerCase()))
      );
    }

    if (state.selectedCategory) {
      filtered = filtered.filter(post => post.categories.includes(state.selectedCategory));
    }

    if (state.selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        state.selectedTags.some(tag => post.tags.includes(tag))
      );
    }

    return filtered.filter(post => post.status === 'published');
  };

  return {
    ...state,
    addPost,
    updatePost,
    deletePost,
    setCurrentPost,
    addComment,
    likePost,
    searchPosts,
    filterByCategory,
    filterByTags,
    getFilteredPosts
  };
};`
      }
    ],
    components: [
      {
        name: 'BlogPost',
        file: 'components/business/BlogPost.tsx',
        content: `'use client';

import React, { useState } from 'react';
import { useBlog } from '../../contexts/BlogContext';

interface BlogPostProps {
  postId?: string;
  showComments?: boolean;
  className?: string;
}

export const BlogPost: React.FC<BlogPostProps> = ({
  postId,
  showComments = false,
  className = ''
}) => {
  const { currentPost, addComment, likePost } = useBlog();
  const [commentForm, setCommentForm] = useState({
    author: '',
    email: '',
    content: ''
  });
  const [showCommentForm, setShowCommentForm] = useState(false);

  if (!currentPost) {
    return (
      <div className={\`animate-pulse \${className}\`}>
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    likePost(currentPost.id);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentForm.author && commentForm.content) {
      addComment(currentPost.id, {
        postId: currentPost.id,
        author: commentForm.author,
        email: commentForm.email,
        content: commentForm.content
      });
      setCommentForm({ author: '', email: '', content: '' });
      setShowCommentForm(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <article className={\`max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden \${className}\`}>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
          {currentPost.categories.map((category, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {category}
            </span>
          ))}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {currentPost.title}
        </h1>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {currentPost.author.avatar && (
                <img
                  src={currentPost.author.avatar}
                  alt={currentPost.author.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>Par {currentPost.author.name}</span>
            </div>
            <span>•</span>
            <time>{formatDate(currentPost.publishedAt)}</time>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>{currentPost.views} vues</span>
            <span>•</span>
            <span>{currentPost.comments.length} commentaires</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="prose max-w-none">
          {currentPost.content.split('\\n\\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="px-8 py-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {currentPost.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="px-8 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            <span className="text-xl">♥</span>
            <span>{currentPost.likes} J'aime</span>
          </button>
          
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <span className="text-xl">💬</span>
            <span>Commenter</span>
          </button>
        </div>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="px-8 py-6 border-t border-gray-100 bg-white">
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Votre nom *"
                value={commentForm.author}
                onChange={(e) => setCommentForm({ ...commentForm, author: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Votre email (optionnel)"
                value={commentForm.email}
                onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              placeholder="Votre commentaire *"
              rows={4}
              value={commentForm.content}
              onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCommentForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Publier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments */}
      {showComments && currentPost.comments.length > 0 && (
        <div className="px-8 py-6 border-t border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Commentaires ({currentPost.comments.length})
          </h3>
          <div className="space-y-6">
            {currentPost.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {comment.author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">{comment.author}</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};`
      }
    ]
  }
};

// Fonction utilitaire pour obtenir les templates par domaine
export function getExtendedDomainTemplate(domain: string) {
  const normalizedDomain = domain.toLowerCase().replace(/[_\-\s]/g, '');
  
  const domainMap: Record<string, string> = {
    'ecommerce': 'ecommerce',
    'ecommerceb2c': 'ecommerce',
    'saas': 'saas',
    'dashboard': 'saas',
    'analytics': 'saas',
    'blog': 'blog',
    'cms': 'blog',
    'article': 'blog',
    'portfolio': 'portfolio',
    'vitrine': 'portfolio',
    'agency': 'portfolio'
  };

  const mappedDomain = domainMap[normalizedDomain];
  return mappedDomain ? EXTENDED_DOMAIN_TEMPLATES[mappedDomain as keyof typeof EXTENDED_DOMAIN_TEMPLATES] : null;
}