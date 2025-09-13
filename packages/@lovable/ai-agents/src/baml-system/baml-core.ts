/**
 * BAML System - Version Pragmatique
 * 
 * PHASE 1 (MAINTENANT) : Validation + Retry basique
 * PHASE 2 (SEMAINE 2) : Cache + Chain of thought  
 * PHASE 3 (MOIS 2) : Cache sémantique + Métriques complètes
 */

import Anthropic from '@anthropic-ai/sdk';

export interface BAMLPrompt {
  id: string;
  name: string;
  version: string;
  domain: 'ecommerce' | 'saas' | 'landing' | 'dashboard';
  
  model: {
    name: string;
    temperature: number;
    maxTokens: number;
  };
  
  prompts: {
    system: string;
    userTemplate: string;
  };
  
  // PHASE 1: Validation basique
  validation: {
    minPages?: number;
    minComponents?: number;
    requiredFeatures?: string[];
  };
  
  // PHASE 2: À implémenter plus tard
  // chainOfThought?: string;
  // examples?: Array<{input: any, output: any}>;
  
  // PHASE 3: À implémenter plus tard
  // cache?: { enabled: boolean; ttl: number };
  // metrics?: { track: boolean };
}

export class BAMLCore {
  private prompts = new Map<string, BAMLPrompt>();
  
  // PHASE 1: Cache simple en mémoire (pas sémantique)
  private simpleCache = new Map<string, any>();
  
  // TODO PHASE 2: Ajouter LRU cache
  // TODO PHASE 3: Ajouter cache sémantique avec embeddings
  
  registerPrompt(prompt: BAMLPrompt) {
    this.prompts.set(prompt.id, prompt);
    console.log(`✅ Registered prompt: ${prompt.id}`);
  }
  
  async execute(
    promptId: string,
    input: { description: string; [key: string]: any }
  ): Promise<{
    success: boolean;
    output: any;
    quality: number;
    fromCache?: boolean;
  }> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);
    
    // PHASE 1: Cache simple par hash du prompt
    const cacheKey = `${promptId}:${input.description}`;
    if (this.simpleCache.has(cacheKey)) {
      console.log('📦 Cache hit!');
      return {
        success: true,
        output: this.simpleCache.get(cacheKey),
        quality: 10, // Cached = already validated
        fromCache: true
      };
    }
    
    // Build prompt
    const fullPrompt = this.buildPrompt(prompt, input);
    
    // Execute with 1 retry (PHASE 1: simple retry)
    let attempts = 0;
    let lastError = null;
    
    while (attempts < 2) {
      try {
        const result = await this.callClaude(fullPrompt, prompt.model);
        
        // PHASE 1: Validation basique
        const quality = this.validateBasic(result, prompt.validation);
        
        if (quality >= 7) {
          // Cache if good enough
          this.simpleCache.set(cacheKey, result);
          
          return {
            success: true,
            output: result,
            quality
          };
        } else {
          throw new Error(`Quality too low: ${quality}/10`);
        }
        
      } catch (error) {
        lastError = error;
        attempts++;
        console.log(`⚠️ Attempt ${attempts} failed, retrying...`);
        
        // TODO PHASE 2: Exponential backoff
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    throw lastError || new Error('Failed after retries');
  }
  
  private buildPrompt(prompt: BAMLPrompt, input: any): string {
    // Simple template replacement
    let userPrompt = prompt.prompts.userTemplate;
    
    Object.entries(input).forEach(([key, value]) => {
      userPrompt = userPrompt.replace(`{{${key}}}`, value);
    });
    
    return userPrompt;
  }
  
  private async callClaude(prompt: string, modelConfig: any): Promise<any> {
    // Actual Claude API call
    const client = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });
    
    const response = await client.messages.create({
      model: modelConfig.name || 'claude-sonnet-4-20250514',
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    // Parse JSON from response
    const text = response.content[0].text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try direct parse
    return JSON.parse(text);
  }
  
  private validateBasic(output: any, validation: any): number {
    let score = 10;
    
    // Check minimum requirements
    if (validation?.minPages && output.pages?.length < validation.minPages) {
      score -= 2;
    }
    
    if (validation?.minComponents && output.components?.length < validation.minComponents) {
      score -= 2;
    }
    
    if (validation?.requiredFeatures) {
      validation.requiredFeatures.forEach(feature => {
        if (!this.hasFeature(output, feature)) {
          score -= 1;
        }
      });
    }
    
    return Math.max(0, score);
  }
  
  private hasFeature(output: any, feature: string): boolean {
    // Check if feature exists in output
    const features = output.features || {};
    return Object.values(features).flat().includes(feature) ||
           output.pages?.some((p: string) => p.toLowerCase().includes(feature)) ||
           output.components?.some((c: string) => c.toLowerCase().includes(feature));
  }
}

// TODO PHASE 2: Ajouter la classe QualityEnhancer
// TODO PHASE 3: Ajouter la classe MetricsCollector