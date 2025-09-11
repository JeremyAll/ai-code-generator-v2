/**
 * Utilitaire pour réparer les JSON tronqués ou malformés
 */

export class JSONFixer {
  /**
   * Tente de réparer et parser un JSON potentiellement tronqué
   */
  static parseWithFix(jsonString: string): any {
    // Essai direct d'abord
    try {
      return JSON.parse(jsonString);
    } catch (initialError) {
      console.warn('JSON invalide, tentative de réparation...');
    }

    // Nettoyage de base
    let fixed = jsonString
      .trim()
      .replace(/\/\/.*$/gm, '') // Supprimer les commentaires //
      .replace(/\/\*[\s\S]*?\*\//g, '') // Supprimer les commentaires /* */
      .replace(/,\s*([}\]])/g, '$1') // Supprimer les virgules trailing
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Ajouter les quotes aux clés non quotées
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Remplacer single quotes par double quotes
      .replace(/\\'/g, "'") // Unescape single quotes
      .replace(/\r\n/g, '\n'); // Normaliser les sauts de ligne

    // Essayer après nettoyage
    try {
      return JSON.parse(fixed);
    } catch (e) {
      // Continuer avec les réparations plus agressives
    }

    // Détecter et réparer les structures incomplètes
    fixed = this.fixIncompleteStructures(fixed);

    // Dernier essai
    try {
      return JSON.parse(fixed);
    } catch (finalError) {
      console.error('Impossible de réparer le JSON:', finalError);
      // Retourner un objet minimal plutôt que de crasher
      return this.extractPartialData(fixed);
    }
  }

  /**
   * Répare les structures JSON incomplètes
   */
  private static fixIncompleteStructures(json: string): string {
    let fixed = json;

    // Compter les délimiteurs
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    // Ajouter les accolades manquantes
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }

    // Ajouter les crochets manquants
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }

    // Fermer les strings non terminées
    const quotes = (fixed.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      // Trouver la dernière quote et fermer la string
      const lastQuoteIndex = fixed.lastIndexOf('"');
      const afterLastQuote = fixed.substring(lastQuoteIndex + 1);
      
      // Si pas de quote de fermeture, en ajouter une
      if (!afterLastQuote.includes('"')) {
        // Chercher où fermer logiquement (avant une virgule, accolade ou crochet)
        const endMatch = afterLastQuote.match(/[,}\]]/);
        if (endMatch && endMatch.index !== undefined) {
          fixed = fixed.substring(0, lastQuoteIndex + 1 + endMatch.index) + 
                  '"' + 
                  fixed.substring(lastQuoteIndex + 1 + endMatch.index);
        } else {
          fixed += '"';
        }
      }
    }

    // Réparer les valeurs incomplètes
    fixed = fixed.replace(/:\s*,/g, ': null,'); // Valeurs manquantes
    fixed = fixed.replace(/:\s*}/g, ': null}'); // Valeur manquante avant accolade
    fixed = fixed.replace(/:\s*]/g, ': null]'); // Valeur manquante avant crochet

    return fixed;
  }

  /**
   * Extrait les données partielles d'un JSON corrompu
   */
  private static extractPartialData(json: string): any {
    const result: any = {};

    // Essayer d'extraire les paires clé-valeur simples
    const kvPattern = /"(\w+)"\s*:\s*"([^"]+)"/g;
    let match;
    while ((match = kvPattern.exec(json)) !== null) {
      result[match[1]] = match[2];
    }

    // Essayer d'extraire les nombres
    const numPattern = /"(\w+)"\s*:\s*(\d+(?:\.\d+)?)/g;
    while ((match = numPattern.exec(json)) !== null) {
      result[match[1]] = parseFloat(match[2]);
    }

    // Essayer d'extraire les booléens
    const boolPattern = /"(\w+)"\s*:\s*(true|false)/g;
    while ((match = boolPattern.exec(json)) !== null) {
      result[match[1]] = match[2] === 'true';
    }

    // Essayer d'extraire les tableaux simples
    const arrayPattern = /"(\w+)"\s*:\s*\[([^\]]*)\]/g;
    while ((match = arrayPattern.exec(json)) !== null) {
      try {
        result[match[1]] = JSON.parse('[' + match[2] + ']');
      } catch {
        // Si l'array ne peut pas être parsé, le laisser comme string
        result[match[1]] = match[2].split(',').map(s => s.trim().replace(/['"]/g, ''));
      }
    }

    return result;
  }

  /**
   * Valide si une string est un JSON valide
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Nettoie et formate un JSON pour une meilleure lisibilité
   */
  static prettify(json: any): string {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  }
}

/**
 * Fonction helper pour utilisation directe
 */
export function parseWithJSONFix(jsonString: string): any {
  return JSONFixer.parseWithFix(jsonString);
}

/**
 * Fonction pour extraire un objet JSON d'une réponse mixte
 */
export function extractJSONFromResponse(response: string): any {
  // Chercher un bloc JSON dans la réponse
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return parseWithJSONFix(jsonMatch[0]);
  }

  // Chercher un tableau JSON
  const arrayMatch = response.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return parseWithJSONFix(arrayMatch[0]);
  }

  // Si pas de JSON trouvé, essayer de parser toute la réponse
  return parseWithJSONFix(response);
}