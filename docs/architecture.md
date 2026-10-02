# Architecture proposée

## Monorepo
- `apps/web` : prototype web HTML/CSS/JS
- `apps/mobile` : prototype Expo / React Native
- `shared` : données / types partageables
- `docs` : cahier des charges et architecture

## Stack recommandée pour la vraie V1
- Web : Next.js + TypeScript
- Mobile : Expo / React Native + TypeScript
- API : Node.js (NestJS ou API routes Next.js)
- Base : PostgreSQL
- ORM : Prisma
- Auth : Supabase Auth, Clerk ou Auth.js
- Carte : Mapbox ou Leaflet/OpenStreetMap
- Push : Expo Notifications / Firebase Cloud Messaging
- E-mail : Resend ou Brevo
- Hébergement : Vercel + Supabase / Railway / Render

## Endpoints API envisagés
- POST /auth/register
- POST /auth/login
- GET /events
- POST /events
- GET /events/:id
- PATCH /events/:id
- DELETE /events/:id
- POST /events/:id/join
- POST /events/:id/approve/:userId
- POST /events/:id/reject/:userId
- GET /users/me
- PATCH /users/me
- PATCH /users/me/notifications

## Logique notification proximité
Lors de la création d'un événement :
1. récupérer les utilisateurs abonnés au sport concerné ;
2. calculer la distance entre l'utilisateur et l'événement ;
3. comparer avec le rayon choisi ;
4. envoyer une notification push et/ou un e-mail ;
5. stocker la notification dans la base.
