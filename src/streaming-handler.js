// src/streaming-handler.js - SIMPLE ET EFFICACE
import Anthropic from '@anthropic-ai/sdk';

export class StreamingHandler {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 3,
      timeout: 60000
    });
    this.model = 'claude-sonnet-4-20250514';
    this.systemPromptCache = null;
  }

  async generateWithStream(prompt, onProgress = () => {}) {
    // 1. Compression basique du prompt
    const optimized = this.compressPrompt(prompt);

    // 2. UN SEUL appel streaming
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: 12000,
      temperature: 0.7,
      stream: true, // CRITIQUE
      system: this.getSystemPrompt(), // Mis en cache après 1er appel
      messages: [{
        role: 'user',
        content: optimized
      }]
    });

    // 3. Handler pour SSE avec progression
    return this.handleStreamWithProgress(stream, onProgress);
  }

  compressPrompt(prompt) {
    // Compression simple mais efficace
    return prompt
      .replace(/please|could you|would you|can you/gi, '')
      .replace(/\s+/g, ' ')
      .replace(/[.]{2,}/g, '...')
      .trim();
  }

  getSystemPrompt() {
    if (!this.systemPromptCache) {
      this.systemPromptCache = `You are an expert web application generator.
Generate complete, production-ready applications with:
- Modern React/Next.js architecture
- Tailwind CSS styling
- Complete file structure
- Working components and pages
- API routes when needed
- Responsive design

Output ONLY valid JSON in this structure:
{
  "name": "app-name",
  "description": "brief description",
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "complete file content",
      "type": "component|page|api|style|config"
    }
  ],
  "dependencies": ["list", "of", "npm", "packages"],
  "instructions": ["setup", "steps"]
}`;
    }
    return this.systemPromptCache;
  }

  async handleStreamWithProgress(stream, onProgress) {
    const chunks = [];
    let totalChunks = 0;
    let processedChunks = 0;

    try {
      for await (const message of stream) {
        if (message.type === 'content_block_delta') {
          const text = message.delta?.text || '';
          chunks.push(text);
          totalChunks++;

          // Callback de progression tous les 10 chunks
          if (totalChunks % 10 === 0) {
            onProgress({
              type: 'streaming',
              processed: totalChunks,
              preview: chunks.slice(-50).join('').slice(-200)
            });
          }
        }
      }

      const fullResult = chunks.join('');

      // Progression finale
      onProgress({
        type: 'complete',
        totalChunks,
        length: fullResult.length
      });

      return fullResult;

    } catch (error) {
      onProgress({
        type: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Méthode pour génération par chunks si nécessaire
  async generateLargeContent(prompt, maxChunkSize = 8000) {
    const sections = this.splitPromptIntoSections(prompt);
    const results = [];

    for (let i = 0; i < sections.length; i++) {
      const result = await this.generateWithStream(sections[i], (progress) => {
        console.log(`Section ${i + 1}/${sections.length}:`, progress);
      });
      results.push(result);
    }

    return this.combineResults(results);
  }

  splitPromptIntoSections(prompt) {
    // Simple splitting par phrases
    const sentences = prompt.split('. ');
    const sections = [];
    let currentSection = '';

    for (const sentence of sentences) {
      if ((currentSection + sentence).length > 1000) {
        if (currentSection) {
          sections.push(currentSection.trim());
          currentSection = sentence + '. ';
        }
      } else {
        currentSection += sentence + '. ';
      }
    }

    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }

    return sections.length > 0 ? sections : [prompt];
  }

  combineResults(results) {
    // Simple combinaison - peut être améliorée
    return results.join('\n\n');
  }
}