# Global News AI Site

Site automatisé pour publier des daily news mondiales avec résumés courts, sources, image prompt IA et option de génération d'images IA.

## Fonctionnement

- `GET /api/cron/daily` récupère les news mondiales.
- Le système filtre les articles, crée des résumés en français et génère des prompts d'images IA.
- Les posts sont stockés dans Supabase.
- La homepage affiche les dernières news.

## Déploiement recommandé

1. Crée un projet Supabase.
2. Exécute le SQL dans `supabase/schema.sql`.
3. Crée un projet Vercel.
4. Ajoute les variables d'environnement ci-dessous.
5. Déploie.
6. Le cron Vercel appelle `/api/cron/daily` chaque jour à 8h UTC.

## Variables d'environnement

Copie `.env.example` en `.env.local`.

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=dev-secret

# Option 1: NewsAPI, recommandé pour commencer
NEWS_API_KEY=

# Optionnel: OpenAI pour résumés et images IA
OPENAI_API_KEY=
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=gpt-image-1
GENERATE_IMAGES=false
```

## Important légal / éthique

- Le site ne recopie pas les articles complets.
- Il publie des résumés courts + source originale.
- Les images IA doivent être clairement indiquées comme illustrations IA, pas comme vraies photos d'événements réels.
- Vérifie les conditions d'utilisation des APIs et des médias utilisés.

## Tester en local

```bash
npm install
npm run dev
```

Puis dans un autre terminal :

```bash
curl -X GET http://localhost:3000/api/cron/daily -H "Authorization: Bearer dev-secret"
```
