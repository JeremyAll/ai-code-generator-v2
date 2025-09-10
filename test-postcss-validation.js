import fs from 'fs';
import path from 'path';

// Vérifier si le fix est appliqué en regardant le code compilé
const compiledFile = './dist/services/anthropic-service.js';

if (!fs.existsSync(compiledFile)) {
  console.log('❌ Fichier compilé introuvable');
  process.exit(1);
}

const content = fs.readFileSync(compiledFile, 'utf8');

// Chercher les occurrences de postcss.config.js
const postcssMatches = [...content.matchAll(/postcss\.config\.js.*?\n.*?\n.*?module\.exports = \{/gs)];

console.log('🔍 Analyse du fichier compilé:');
console.log(`✅ Trouvé ${postcssMatches.length} occurences de postcss.config.js avec module.exports`);

// Chercher les mauvaises occurrences (exports = { sans module.)
const badMatches = [...content.matchAll(/postcss\.config\.js.*?\n.*?[^.]exports = \{/gs)];

if (badMatches.length > 0) {
  console.log(`❌ PROBLÈME: ${badMatches.length} occurences avec exports = { trouvées`);
  badMatches.forEach((match, i) => {
    console.log(`\n--- Occurrence ${i + 1} ---`);
    console.log(match[0]);
  });
} else {
  console.log('✅ Aucune occurrence problématique trouvée');
}

console.log('\n📊 Résumé:');
console.log(`- module.exports = {: ${postcssMatches.length}`);
console.log(`- exports = {: ${badMatches.length}`);

if (badMatches.length === 0 && postcssMatches.length > 0) {
  console.log('✅ Fix PostCSS: SUCCÈS');
} else {
  console.log('❌ Fix PostCSS: ÉCHEC');
}