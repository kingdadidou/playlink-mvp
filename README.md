# PlayLink — Starter MVP

Premier dossier fonctionnel pour un site + une application permettant de créer et rejoindre des événements sportifs locaux.

## Contenu

### Site web
`apps/web/`

Fonctionnalités déjà simulées :
- carte Leaflet / OpenStreetMap ;
- liste des événements ;
- filtres ;
- création d'événement ;
- inscription immédiate ;
- demande avec validation ;
- paramètres d'alertes de proximité ;
- sauvegarde locale dans le navigateur.

La bibliothèque de carte est incluse dans `apps/web`. Si le fond OpenStreetMap ne se charge pas, une carte simplifiée intégrée affiche quand même les événements et permet de sélectionner leurs repères. Le fond détaillé nécessite une connexion Internet. Après une modification du code, actualiser l'onglet du navigateur.

Dans cette démo, la création d'événement propose une liste de villes et place le repère au centre de la ville choisie. Les inscriptions et préférences sont enregistrées uniquement dans le navigateur ; aucun message ou notification n'est réellement envoyé.

### Application mobile
`apps/mobile/`

Prototype Expo / React Native avec :
- écran d'accueil ;
- recherche ;
- liste d'événements ;
- boutons de participation ;
- structure prête pour ajouter carte, profil et notifications.

## Lancer le site web

Le plus simple :
1. ouvrir le dossier `apps/web`
2. double-cliquer sur `index.html`

Pour éviter certaines restrictions navigateur, tu peux aussi lancer un petit serveur local :

```bash
cd apps/web
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Lancer l'application mobile

Installer Node.js puis :

```bash
cd apps/mobile
npm install
npm start
```

Scanner ensuite le QR code avec Expo Go.

## Important
Ce dossier est un prototype front-end. Il n'y a pas encore :
- de vraie base de données ;
- d'authentification ;
- d'envoi réel d'e-mails ;
- de notifications push réelles ;
- de serveur API.

La prochaine étape recommandée est de transformer ce starter en une V1 avec Next.js + PostgreSQL + authentification + API.
