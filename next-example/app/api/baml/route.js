// app/api/baml/route.js - BAML Pragmatic API Integration
import { BAMLPragmatic } from '../../../src/baml-system/baml-pragmatic.js';

export async function POST(req) {
  const { prompt, options = {} } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const baml = new BAMLPragmatic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('🎯 BAML Pragmatic API: Starting generation');

        // 1. Détection du domaine
        const domain = await baml.detectDomain(prompt);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'domain',
            domain: domain,
            message: `Domain detected: ${domain}`
          })}\n\n`)
        );

        // 2. Enhancement SCoT
        const enhancedPrompt = baml.enhanceWithSCoT(prompt);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'enhancement',
            length: enhancedPrompt.length,
            message: `Prompt enhanced with SCoT: ${enhancedPrompt.length} chars`
          })}\n\n`)
        );

        // 3. Domain expertise
        const domainExpertise = baml.domainPrompts[domain];
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'expertise',
            domain: domain,
            message: `Domain expertise loaded: ${domain}`
          })}\n\n`)
        );

        // 4. Génération avec streaming
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'generation_start',
            message: 'Starting AI generation...'
          })}\n\n`)
        );

        // Simuler le streaming pour le moment (en attendant l'intégration complète)
        const result = await baml.streamingHandler.generateWithStream(enhancedPrompt);

        // Stream des chunks de résultat
        const chunks = result.split('');
        for (let i = 0; i < chunks.length; i += 10) {
          const chunk = chunks.slice(i, i + 10).join('');
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              chunk: chunk
            })}\n\n`)
          );

          // Petite pause pour simuler le streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // 5. Finalisation
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            domain: domain,
            message: 'BAML Pragmatic generation completed',
            stats: {
              domain: domain,
              promptLength: prompt.length,
              enhancedLength: enhancedPrompt.length,
              resultLength: result.length
            }
          })}\n\n`)
        );

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

      } catch (error) {
        console.error('BAML Pragmatic API Error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
          })}\n\n`)
        );
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}