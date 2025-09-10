# 🛡️ Configuration Sécurisée

## Configuration Requise

1. **Copiez `.env.example` vers `.env`**:
   ```bash
   cp .env.example .env
   ```

2. **Remplissez vos clés API dans `.env`**:
   - `ANTHROPIC_API_KEY`: Votre clé Anthropic Claude
   - `UNSPLASH_ACCESS_KEY`: Votre clé Unsplash (optionnelle)

## ⚠️ Important

- **JAMAIS** commiter le fichier `.env` 
- Les clés API sont exclues du repository par `.gitignore`
- Gardez vos clés confidentielles

## Clés Requises

### Anthropic API
- Obtenez votre clé sur: https://console.anthropic.com/
- Format: `sk-ant-api03-...`

### Unsplash API (Optionnelle)
- Obtenez votre clé sur: https://unsplash.com/developers
- Utilisée pour les images automatiques

