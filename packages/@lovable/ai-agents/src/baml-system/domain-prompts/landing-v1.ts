/**
 * Landing Page Prompt - Version 1 (Simple mais efficace)
 * 
 * ÉVOLUTIONS PRÉVUES :
 * - V2: Ajouter A/B testing variants, conversion optimization
 * - V3: Ajouter personalization, advanced analytics
 */

import { BAMLPrompt } from '../baml-core.js';

export const landingPromptV1: BAMLPrompt = {
  id: 'landing-v1',
  name: 'Landing Page Generator',
  version: '1.0.0',
  domain: 'landing',
  
  model: {
    name: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 3000
  },
  
  prompts: {
    system: `You are a landing page expert. Generate complete landing pages optimized for conversions.`,
    
    userTemplate: `Create a landing page for: {{description}}

Return a JSON with this structure:
{
  "projectType": "landing",
  "businessType": "startup|product|service",
  "targetAudience": "b2b|b2c|developers",
  "features": {
    "heroSection": true,
    "featuresShowcase": true,
    "testimonials": boolean,
    "pricingSection": boolean,
    "contactForm": true,
    "newsletter": boolean,
    "socialProof": boolean
  },
  "pages": [
    "index",
    "about",
    "contact",
    "privacy",
    "terms"
  ],
  "components": [
    "Hero",
    "Features", 
    "Testimonials",
    "CTA",
    "ContactForm",
    "Footer"
  ],
  "designSystem": {
    "primaryColor": "#hexcode",
    "style": "modern|minimal|bold",
    "cta": "primary button text"
  },
  "seo": {
    "title": "SEO title",
    "description": "Meta description"
  }
}`
  },
  
  validation: {
    minPages: 3,
    minComponents: 4,
    requiredFeatures: ['heroSection', 'contactForm']
  }
  
  // TODO V2: Ajouter conversion rate optimization
  // TODO V3: Ajouter A/B testing templates
};