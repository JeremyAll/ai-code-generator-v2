// Test simple de connectivité API
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger .env depuis la racine
dotenv.config({ path: path.resolve(process.cwd(), '../../../.env') });

async function testApiConnectivity() {
  console.log('🧪 Test de connectivité API Claude\n');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY manquante dans .env');
    return;
  }
  
  console.log('✅ Clé API trouvée');
  console.log(`🤖 Modèle: ${model}`);
  console.log('📡 Test de connexion...\n');
  
  try {
    const client = new Anthropic({
      apiKey: apiKey
    });
    
    // Test simple avec prompt minimal
    const response = await client.messages.create({
      model: model,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Réponds juste "API connectée avec succès !" pour confirmer la connexion.'
        }
      ]
    });
    
    console.log('✅ SUCCÈS - API connectée !');
    console.log('📝 Réponse Claude:', response.content[0].text);
    console.log(`💰 Tokens utilisés: ${response.usage.input_tokens} input / ${response.usage.output_tokens} output`);
    
    console.log('\n🚀 Système multi-agents prêt pour génération complète !');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
  }
}

testApiConnectivity().catch(console.error);