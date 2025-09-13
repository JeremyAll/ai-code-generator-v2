/**
 * E-commerce Prompt - Version 1 (Simple mais efficace)
 * 
 * ÉVOLUTIONS PRÉVUES :
 * - V2: Ajouter inventaire, reviews, recommendations
 * - V3: Ajouter AI recommendations, abandoned cart, multi-langue
 */

import { BAMLPrompt } from '../baml-core.js';

export const ecommercePromptV1: BAMLPrompt = {
  id: 'ecommerce-v1',
  name: 'E-commerce Generator',
  version: '1.0.0',
  domain: 'ecommerce',
  
  model: {
    name: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 3000  // PHASE 1: On limite pour économiser
  },
  
  prompts: {
    system: `You are an e-commerce expert. Generate complete e-commerce apps.`,
    
    userTemplate: `Create an e-commerce application for: {{description}}

Return a JSON with this structure:
{
  "projectType": "ecommerce",
  "businessType": "b2c",
  "productCategory": "string",
  "features": {
    "cart": true,
    "checkout": true,
    "search": true,
    "filters": true,
    "userAccounts": true,
    "wishlist": boolean,
    "reviews": boolean
  },
  "pages": [
    "home",
    "products",
    "product-detail",
    "cart", 
    "checkout",
    "confirmation",
    "account",
    "search-results"
  ],
  "components": [
    "Header",
    "ProductCard",
    "CartItem",
    "CheckoutForm",
    "SearchBar",
    "FilterSidebar",
    "Footer"
  ],
  "designSystem": {
    "primaryColor": "#hexcode",
    "style": "modern|classic|minimal"
  }
}`
  },
  
  validation: {
    minPages: 6,
    minComponents: 5,
    requiredFeatures: ['cart', 'checkout', 'search']
  }
  
  // TODO V2: Ajouter examples pour few-shot learning
  // TODO V3: Ajouter chain of thought
};