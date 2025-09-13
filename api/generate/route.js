// api/generate/route.js - Route API avec SSE (Server-Sent Events)
import { StreamingHandler } from '../../src/streaming-handler.js';
import { SCoTEnhancer } from '../../src/intelligence/scot-enhancer.js';
import { SemanticCache } from '../../src/cache/semantic-cache.js';
import { QualityEnhancer } from '../../src/quality/enhancer.js';

// Initialiser les services
const streamingHandler = new StreamingHandler();
const scotEnhancer = new SCoTEnhancer();
const semanticCache = new SemanticCache();
const qualityEnhancer = new QualityEnhancer();

// Initialiser le cache
await semanticCache.init();

export async function POST(req) {
  try {
    const { prompt, useCache = true, enhancePrompt = true } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Vérifier le cache sémantique d'abord
    if (useCache) {
      const cached = await semanticCache.getCached(prompt);
      if (cached) {
        console.log('🎯 Cache hit - Retour immédiat');
        return Response.json({
          success: true,
          result: cached,
          cached: true,
          processingTime: 0
        });
      }
    }

    const encoder = new TextEncoder();
    let fullResult = '';
    let processingSteps = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now();

          // Étape 1: Amélioration du prompt
          let finalPrompt = prompt;
          if (enhancePrompt) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'step',
              step: 'enhancing_prompt',
              message: 'Amélioration du prompt avec SCoT...'
            })}\n\n`));

            finalPrompt = scotEnhancer.enhancePrompt(prompt);
            processingSteps.push('Prompt amélioré avec Chain-of-Thought');
          }

          // Étape 2: Génération streaming
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            step: 'generating',
            message: 'Génération en cours...'
          })}\n\n`));

          fullResult = await streamingHandler.generateWithStream(finalPrompt, (progress) => {
            // Envoyer les updates de progression
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              ...progress
            })}\n\n`));
          });

          processingSteps.push('Génération complétée');

          // Étape 3: Amélioration qualité
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'step',
            step: 'enhancing_quality',
            message: 'Amélioration de la qualité...'
          })}\n\n`));

          const qualityResult = await qualityEnhancer.enhance(fullResult, prompt);
          fullResult = qualityResult.enhanced;
          processingSteps.push(`Qualité améliorée (score: ${qualityResult.score}/10)`);

          // Étape 4: Mise en cache
          if (useCache && qualityResult.score >= 8) {
            await semanticCache.setCached(prompt, fullResult, {
              processingSteps,
              qualityScore: qualityResult.score,
              generatedAt: Date.now()
            });
            processingSteps.push('Résultat mis en cache');
          }

          const totalTime = Date.now() - startTime;

          // Envoyer le résultat final
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            result: fullResult,
            processingTime: totalTime,
            processingSteps,
            qualityScore: qualityResult.score,
            improvements: qualityResult.improvements
          })}\n\n`));

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('Generation error:', error);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error.message,
            processingSteps
          })}\n\n`));

          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Route error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Gérer les OPTIONS pour CORS
export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// Route pour les stats du cache
export async function GET(req) {
  try {
    const stats = semanticCache.getStats();
    const performance = semanticCache.analyzePerformance();

    return Response.json({
      success: true,
      cache: {
        stats,
        performance,
        serverUptime: process.uptime()
      }
    });

  } catch (error) {
    return Response.json(
      { error: 'Could not get cache stats', details: error.message },
      { status: 500 }
    );
  }
}