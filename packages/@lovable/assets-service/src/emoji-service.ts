export interface EmojiMapping {
  category: string;
  emojis: string[];
  context: string[];
}

export class EmojiService {
  private domainEmojis: Record<string, Record<string, string[]>> = {
    ecommerce: {
      navigation: ['🛍️', '🛒', '💳', '📦', '🏪'],
      products: ['👕', '👟', '💍', '📱', '💻', '🎧', '📷', '⌚'],
      actions: ['❤️', '⭐', '🔍', '🛒', '💳', '✅', '❌'],
      feedback: ['⭐', '👍', '👎', '💬', '📝', '✨'],
      shipping: ['📦', '🚚', '✈️', '🌍', '⏰', '📍'],
      payments: ['💳', '💰', '🔒', '✅', '💎', '🎁']
    },
    
    saas: {
      features: ['⚡', '🚀', '🔧', '📊', '🎯', '🔐', '☁️', '🤖'],
      navigation: ['📊', '⚙️', '👥', '📈', '💬', '🔔', '🎯'],
      actions: ['✅', '❌', '▶️', '⏸️', '🔄', '📤', '📥'],
      analytics: ['📊', '📈', '📉', '🎯', '💡', '🔍', '⚡'],
      team: ['👥', '🤝', '💬', '📝', '🎯', '⚙️', '🔔'],
      security: ['🔐', '🛡️', '🔒', '🔑', '🏆', '✅', '⚠️']
    },
    
    landing: {
      hero: ['🚀', '✨', '🎯', '💡', '⚡', '🔥', '🌟'],
      features: ['⚡', '🛡️', '🎯', '📱', '💻', '🔧', '📊'],
      testimonials: ['⭐', '💬', '👍', '❤️', '🏆', '✨', '🎉'],
      cta: ['🚀', '▶️', '✅', '🎯', '💪', '🔥', '⚡'],
      contact: ['📧', '📞', '💬', '📍', '🌍', '📱', '✉️']
    },
    
    blog: {
      content: ['📝', '💡', '📚', '🎯', '💬', '📖', '✍️'],
      categories: ['📂', '🏷️', '📋', '🗂️', '📑', '📄', '📰'],
      social: ['👍', '💬', '🔗', '📤', '❤️', '⭐', '👥'],
      navigation: ['🏠', '📝', '👤', '📞', '🔍', '📂', '⚙️'],
      reading: ['👁️', '⏱️', '📊', '💡', '📚', '🔖', '📄']
    },
    
    portfolio: {
      projects: ['🎨', '💻', '📱', '🌐', '🎯', '✨', '🚀'],
      skills: ['⚡', '🔧', '🎨', '💡', '🎯', '💪', '🏆'],
      contact: ['📧', '💬', '🤝', '📱', '🌐', '📍', '✉️'],
      social: ['🔗', '👥', '💬', '📤', '🌟', '👍', '❤️']
    },
    
    restaurant: {
      menu: ['🍕', '🍔', '🍝', '🥗', '🍰', '☕', '🍷'],
      services: ['🍽️', '🚚', '⏰', '📞', '📍', '💳', '⭐'],
      atmosphere: ['🕯️', '🎵', '🌟', '❤️', '🎉', '🥂', '✨']
    },
    
    fitness: {
      activities: ['💪', '🏃', '🚴', '🏋️', '🧘', '🏊', '⚽'],
      goals: ['🎯', '📈', '🏆', '💯', '⚡', '🔥', '💪'],
      nutrition: ['🥗', '🍎', '💧', '⚖️', '📊', '🥤', '🍌']
    },
    
    education: {
      learning: ['📚', '🎓', '📖', '💡', '🧠', '✏️', '📝'],
      progress: ['📊', '⭐', '🏆', '🎯', '💯', '✅', '📈'],
      tools: ['💻', '📱', '🎥', '🎧', '📊', '🔧', '⚙️']
    }
  };

  private contextualEmojis: Record<string, string[]> = {
    // States and status
    loading: ['⏳', '🔄', '⚡', '💫'],
    success: ['✅', '🎉', '✨', '🏆', '💚'],
    error: ['❌', '⚠️', '💥', '🚨', '❗'],
    warning: ['⚠️', '🟡', '⚡', '❗', '🔔'],
    info: ['ℹ️', '💡', '💭', '📢', '🔵'],
    
    // Actions
    save: ['💾', '✅', '💚', '📁', '🔒'],
    delete: ['🗑️', '❌', '💥', '🚮', '❗'],
    edit: ['✏️', '📝', '🔧', '⚙️', '✨'],
    search: ['🔍', '🔎', '💡', '🎯', '⚡'],
    filter: ['🔽', '📊', '🎯', '⚙️', '🔧'],
    sort: ['📊', '🔢', '📈', '📉', '⚡'],
    
    // Navigation
    home: ['🏠', '🏡', '🏢', '🔝', '🎯'],
    back: ['⬅️', '🔙', '↩️', '🔄', '🏠'],
    next: ['➡️', '⏭️', '▶️', '🔜', '⚡'],
    previous: ['⬅️', '⏮️', '🔙', '↩️', '🔄'],
    close: ['❌', '✖️', '🔒', '⏹️', '🚪'],
    
    // Communication
    message: ['💬', '💭', '📨', '✉️', '📧'],
    notification: ['🔔', '📢', '⚡', '💬', '📨'],
    email: ['📧', '✉️', '💌', '📨', '💬'],
    phone: ['📞', '📱', '☎️', '💬', '🔔'],
    
    // Time and dates
    calendar: ['📅', '📆', '🗓️', '⏰', '📋'],
    time: ['⏰', '⏱️', '🕐', '⌚', '📅'],
    deadline: ['⏰', '⚠️', '🔥', '⏳', '🎯'],
    
    // Quality and ratings
    rating: ['⭐', '🌟', '💫', '🏆', '👍'],
    quality: ['✨', '💎', '🏆', '⭐', '💯'],
    premium: ['💎', '👑', '🏆', '✨', '🌟'],
    
    // Technology
    api: ['⚡', '🔧', '🔗', '💻', '🌐'],
    database: ['💾', '🗄️', '📊', '💻', '🔧'],
    cloud: ['☁️', '🌐', '💾', '⚡', '🔧'],
    mobile: ['📱', '📞', '💻', '⚡', '🌐'],
    
    // Business
    analytics: ['📊', '📈', '📉', '💡', '🎯'],
    revenue: ['💰', '💵', '💎', '📈', '🏆'],
    growth: ['📈', '🚀', '⚡', '🌱', '💪'],
    performance: ['⚡', '📊', '🎯', '🚀', '💪']
  };

  getEmoji(category: string, context?: string): string {
    if (context && this.contextualEmojis[context]) {
      const emojis = this.contextualEmojis[context];
      return emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    // Default emojis for common categories
    const defaultEmojis: Record<string, string[]> = {
      button: ['🚀', '⚡', '✨', '🎯', '💪'],
      link: ['🔗', '➡️', '👉', '▶️', '🌐'],
      text: ['📝', '💬', '📖', '💡', '✍️'],
      image: ['🖼️', '📸', '🎨', '✨', '👁️'],
      video: ['🎥', '▶️', '🎬', '📹', '🎞️'],
      audio: ['🎵', '🔊', '🎧', '🎤', '🔉'],
      file: ['📄', '📁', '📋', '📊', '💾'],
      user: ['👤', '👥', '🧑‍💻', '👨‍💼', '👩‍💼'],
      settings: ['⚙️', '🔧', '🛠️', '📋', '🔒']
    };

    const emojis = defaultEmojis[category] || ['✨'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  getEmojisForDomain(domain: string): Record<string, string[]> {
    return this.domainEmojis[domain] || this.domainEmojis['saas'];
  }

  getContextualEmoji(context: string, count: number = 1): string[] {
    const emojis = this.contextualEmojis[context] || ['✨'];
    const result: string[] = [];
    
    for (let i = 0; i < count; i++) {
      result.push(emojis[Math.floor(Math.random() * emojis.length)]);
    }
    
    return result;
  }

  generateEmojiForElement(elementType: string, domain: string, context?: string): string {
    // Domain-specific emoji selection
    const domainEmojis = this.getEmojisForDomain(domain);
    
    // Map element types to domain categories
    const elementToDomainCategory: Record<string, string> = {
      'button': 'actions',
      'nav': 'navigation',
      'card': 'features',
      'testimonial': 'feedback',
      'contact': 'contact',
      'product': 'products',
      'feature': 'features',
      'team': 'team',
      'analytics': 'analytics',
      'security': 'security'
    };

    const domainCategory = elementToDomainCategory[elementType];
    if (domainCategory && domainEmojis[domainCategory]) {
      const categoryEmojis = domainEmojis[domainCategory];
      return categoryEmojis[Math.floor(Math.random() * categoryEmojis.length)];
    }

    // Fallback to contextual or default emoji
    return this.getEmoji(elementType, context);
  }

  injectEmojisIntoCode(
    code: string,
    domain: string,
    options: {
      probability?: number;
      contextAware?: boolean;
      preserveExisting?: boolean;
    } = {}
  ): string {
    const { probability = 0.3, contextAware = true, preserveExisting = true } = options;
    let enhancedCode = code;

    // Patterns to match elements that could use emojis
    const patterns = [
      {
        regex: /<button[^>]*>([^<]+)<\/button>/gi,
        type: 'button',
        context: 'actions'
      },
      {
        regex: /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi,
        type: 'heading',
        context: 'features'
      },
      {
        regex: /<a[^>]*class="[^"]*nav[^"]*"[^>]*>([^<]+)<\/a>/gi,
        type: 'nav',
        context: 'navigation'
      },
      {
        regex: /<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<h[^>]*>([^<]+)<\/h[^>]*>/gi,
        type: 'card',
        context: 'features'
      },
      {
        regex: /<span[^>]*class="[^"]*badge[^"]*"[^>]*>([^<]+)<\/span>/gi,
        type: 'badge',
        context: 'info'
      }
    ];

    patterns.forEach(({ regex, type, context }) => {
      enhancedCode = enhancedCode.replace(regex, (match, content) => {
        // Skip if already has emoji and preserveExisting is true
        if (preserveExisting && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content)) {
          return match;
        }

        // Apply probability check
        if (Math.random() > probability) {
          return match;
        }

        const emoji = this.generateEmojiForElement(
          type,
          domain,
          contextAware ? context : undefined
        );

        return match.replace(content, `${emoji} ${content.trim()}`);
      });
    });

    return enhancedCode;
  }

  generateEmojiComponent(
    emoji: string,
    label: string,
    framework: 'react' | 'vue' | 'angular' | 'html' = 'react'
  ): string {
    switch (framework) {
      case 'react':
        return `
export const EmojiIcon = ({ emoji = "${emoji}", label = "${label}", className = "" }) => {
  return (
    <span 
      className={\`inline-block text-lg \${className}\`}
      role="img" 
      aria-label={label}
    >
      {emoji}
    </span>
  );
};`;

      case 'vue':
        return `
<template>
  <span 
    :class="['inline-block', 'text-lg', className]"
    role="img" 
    :aria-label="label"
  >
    {{ emoji }}
  </span>
</template>

<script>
export default {
  name: 'EmojiIcon',
  props: {
    emoji: {
      type: String,
      default: '${emoji}'
    },
    label: {
      type: String,
      default: '${label}'
    },
    className: {
      type: String,
      default: ''
    }
  }
}
</script>`;

      case 'angular':
        return `
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-emoji-icon',
  template: \`
    <span 
      class="inline-block text-lg {{ className }}"
      role="img" 
      [attr.aria-label]="label"
    >
      {{ emoji }}
    </span>
  \`
})
export class EmojiIconComponent {
  @Input() emoji: string = '${emoji}';
  @Input() label: string = '${label}';
  @Input() className: string = '';
}`;

      case 'html':
        return `
<span 
  class="inline-block text-lg"
  role="img" 
  aria-label="${label}"
>
  ${emoji}
</span>`;

      default:
        return emoji;
    }
  }

  getAllEmojis(): Record<string, any> {
    return {
      domain: this.domainEmojis,
      contextual: this.contextualEmojis
    };
  }

  searchEmojis(query: string): string[] {
    const results: string[] = [];
    const queryLower = query.toLowerCase();

    // Search in contextual emojis
    Object.entries(this.contextualEmojis).forEach(([context, emojis]) => {
      if (context.toLowerCase().includes(queryLower)) {
        results.push(...emojis);
      }
    });

    // Search in domain emojis
    Object.values(this.domainEmojis).forEach(domain => {
      Object.entries(domain).forEach(([category, emojis]) => {
        if (category.toLowerCase().includes(queryLower)) {
          results.push(...emojis);
        }
      });
    });

    // Remove duplicates and return
    return [...new Set(results)];
  }
}

export default EmojiService;