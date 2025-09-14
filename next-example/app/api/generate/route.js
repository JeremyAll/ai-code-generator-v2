// app/api/generate/route.js (Next.js App Router)
import { StreamingHandler } from '../../../src/streaming-handler.js';

export async function POST(req) {
  const { prompt } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const handler = new StreamingHandler();

      try {
        // Utilise Haiku 3.5 pour test rapide ou Sonnet-4 pour production
        const model = req.headers.get('x-fast-mode')
          ? 'claude-3-5-haiku-20241022'
          : 'claude-sonnet-4-20250514';

        const streamResponse = await handler.generateWithStream(prompt, model);

        for await (const chunk of streamResponse) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  });
}