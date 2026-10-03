# PlayLink — version communauté

Cette version remplace le fonctionnement local simulé du site décrit dans le README initial. Aucun paiement.

## Fonctions du site

- Comptes e-mail / mot de passe, profils sportifs, niveaux et disponibilités.
- Amis, demandes, invitations, blocage et signalement.
- Sessions publiques, entre amis ou dans un groupe.
- Inscription immédiate ou validation ; capacité incluant l’organisateur.
- Liste d’attente avec promotion lors d’un désistement.
- Discussion réservée aux participants acceptés.
- Groupes et récurrence hebdomadaire (4, 8 ou 12 séances, heure de Paris conservée).
- Mes activités : à venir, demandes et organisation ; confirmation de présence.
- Notifications dans le site, invitations, rappels la veille et sélection de proximité.
- Filtre « Il manque un joueur », détails par sport et interface de modération.

## Backend et publication

Projet Supabase dédié : `sugtwrzvpaidmvpeyvju`. Les données partagées sont persistées en base. RLS et RPC contrôlent les autorisations côté serveur. Les écritures directes aux tables depuis le navigateur sont interdites ; la capacité est vérifiée sous verrou en base.

Pour un nouveau projet : exécuter `supabase.sql` puis `supabase-community-fixes.sql`. Les deux scripts sont déjà appliqués au projet PlayLink : ne pas rejouer le schéma initial dessus.

`apps/web/config.js` contient uniquement l’URL et la clé publique publishable. Ne jamais y mettre de clé secrète ou service-role. L’URL Auth est `https://playlink-mvp.vercel.app`.

Vercel publie `apps/web` via `vercel.json`. `main` est la production, `community` la prévisualisation. Utiliser HTTP(S), pas `file://`.

## Vérifications

```sh
node --check apps/web/community.js
node --test apps/web/map-fallback.test.cjs
git diff --check
```

Tests transactionnels Supabase exécutés puis annulés : capacité, inscription répétée, liste d’attente, visibilité entre amis, validation, confidentialité des discussions, invitations de groupes, blocage, refus de modération non autorisée et récurrence au changement d’heure.

## Configuration restante et limites

- Les confirmations destinées au public attendent un service SMTP et un domaine vérifié. La confirmation e-mail reste activée. `bonjour@playlink-sport.fr` est une proposition : ni adresse créée ni domaine acheté.
- Le rôle modérateur doit être attribué à un compte de confiance après inscription (instruction en bas de `supabase.sql`). Aucun inscrit ne devient administrateur automatiquement.
- Les notifications sont dans le site ; push et alertes événementielles par e-mail non activés.
- La carte situe le centre de la ville choisie. Le lieu précis est indiqué dans la fiche. Une carte simplifiée remplace les tuiles si elles sont indisponibles.
- Préférences de proximité et session conservées dans ce navigateur. Données actualisées toutes les 30 secondes si la page est visible et sans saisie en cours.
- Retirer un ami conserve son inscription acceptée. Bloquer annule les participations futures entre le joueur et l’organisateur concernés et libère la place.
- Les profils sont visibles aux membres connectés, sauf entre personnes bloquées. Discussions réservées aux participants acceptés.
- Chaque occurrence hebdomadaire est indépendante ; l’annulation porte sur une séance.
- `apps/mobile` reste le prototype Expo distinct, non raccordé à ce backend.
