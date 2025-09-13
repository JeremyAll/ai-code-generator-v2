import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge'; // Edge runtime = 30 secondes

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Créer un stream de réponse
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Auth check
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          controller.enqueue(encoder.encode('data: {"error": "No token"}\n\n'));
          controller.close();
          return;
        }

        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (!user) {
          controller.enqueue(encoder.encode('data: {"error": "Invalid token"}\n\n'));
          controller.close();
          return;
        }

        // Get request data
        const { prompt, domain = 'web' } = await request.json();
        
        // Send initial response
        controller.enqueue(encoder.encode('data: {"status": "starting"}\n\n'));

        // Generate with Anthropic using streaming
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY!
        });

        const stream = await anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          temperature: 0.7,
          stream: true, // STREAMING activé
          system: `Create a complete HTML application. Return ONLY code.`,
          messages: [{
            role: 'user',
            content: `Create a ${domain} app: ${prompt}`
          }]
        });

        let fullContent = '';
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullContent += chunk.delta.text;
            // Envoyer des updates périodiques
            controller.enqueue(encoder.encode(`data: {"status": "generating", "progress": ${fullContent.length}}\n\n`));
          }
        }

        // Sauvegarder en base
        const filesObject = {
          'index.html': fullContent,
          'README.md': `Generated from: ${prompt}`
        };

        const { data: project } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: 'Generated App',
            description: prompt.substring(0, 200),
            domain: domain,
            files: filesObject
          })
          .select()
          .single();

        // Envoyer le résultat final
        controller.enqueue(encoder.encode(`data: {"status": "complete", "projectId": "${project?.id}"}\n\n`));
        
      } catch (error: any) {
        console.error('Generation error:', error);
        controller.enqueue(encoder.encode(`data: {"error": "${error.message}"}\n\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}