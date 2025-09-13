/**
 * SaaS Prompt - Version 1 (Simple mais efficace)
 * 
 * ÉVOLUTIONS PRÉVUES :
 * - V2: Ajouter API management, webhooks, SSO
 * - V3: Ajouter white-label, multi-tenant, advanced analytics
 */

import { BAMLPrompt } from '../baml-core.js';

export const saasPromptV1: BAMLPrompt = {
  id: 'saas-v1',
  name: 'SaaS Generator',
  version: '1.0.0',
  domain: 'saas',
  
  model: {
    name: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 3000
  },
  
  prompts: {
    system: `You are a SaaS expert. Generate complete SaaS applications.`,
    
    userTemplate: `Create a SaaS application for: {{description}}

Return a JSON with this structure:
{
  "projectType": "saas",
  "businessModel": "subscription",
  "targetAudience": "b2b|b2c",
  "features": {
    "authentication": true,
    "dashboard": true,
    "billing": true,
    "teamManagement": boolean,
    "api": boolean,
    "adminPanel": boolean
  },
  "pages": [
    "landing",
    "login",
    "register",
    "dashboard",
    "settings",
    "billing",
    "team",
    "admin"
  ],
  "components": [
    "Navbar",
    "Sidebar",
    "MetricCard",
    "Chart",
    "DataTable",
    "UserMenu"
  ],
  "integrations": ["stripe", "auth0", "sendgrid"]
}`
  },
  
  validation: {
    minPages: 5,
    minComponents: 5,
    requiredFeatures: ['authentication', 'dashboard', 'billing']
  }
};