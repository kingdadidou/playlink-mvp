# Cahier des charges MVP — PlayLink

## Vision
PlayLink permet à des utilisateurs de créer des événements sportifs locaux (running, football, five, tennis, basket, etc.) et à d'autres utilisateurs de les découvrir puis de les rejoindre.

La V1 doit être accessible sur un site web et une application mobile dès le lancement. Les deux supports utilisent les mêmes comptes, événements, inscriptions et préférences.

## V1 — Fonctionnalités retenues

### Compte & profil
- Création de compte / connexion
- Profil utilisateur
- Ville / zone de référence
- Sports favoris
- Niveau sportif
- Préférences de notifications

### Amis
- Rechercher un utilisateur et lui envoyer une demande d'ami.
- Accepter, refuser ou annuler une demande ; retirer un ami.
- Voir sa liste d'amis et les demandes en attente.
- Une amitié n'existe qu'après acceptation de la demande.

### Événements
- Créer un événement
- Modifier / annuler son événement
- Sport
- Titre / description
- Date / heure
- Lieu
- Niveau attendu
- Nombre maximum de participants
- Deux modes d'inscription :
  1. inscription immédiate ;
  2. validation par l'organisateur.
- Liste des participants
- Visibilité choisie par l'organisateur : public ou amis uniquement.
- Un événement « amis uniquement » est visible uniquement par l'organisateur et ses amis acceptés ; il n'apparaît pas dans la carte ou la recherche des autres utilisateurs.
- La visibilité et le mode d'inscription sont deux réglages indépendants : un événement public ou réservé aux amis peut proposer une inscription immédiate ou soumise à validation.

### Découverte
- Carte des événements à venir sur le site web et dans l'application mobile
- Vue liste
- Filtres :
  - sport ;
  - date ;
  - niveau ;
  - distance ;
  - mode d'inscription.
- Fiche détaillée d'un événement
- Un repère sur la carte ouvre un aperçu avec sport, date, heure et places disponibles, puis la fiche détaillée.
- La carte et la liste appliquent les mêmes filtres et affichent les mêmes événements.

### Notifications
- Push mobile
- E-mail
- Déclenchement lorsqu'un nouvel événement correspondant aux préférences est créé dans le rayon choisi
- Paramètres :
  - rayon 5 / 10 / 25 / 50 km ;
  - sports favoris ;
  - activation/désactivation push ;
  - activation/désactivation e-mail.
- La ville choisie par l'utilisateur sert de point de référence si la géolocalisation n'est pas autorisée.
- Une même création d'événement ne doit déclencher qu'une alerte par canal et par utilisateur.
- L'utilisateur peut modifier ses préférences et se désabonner des e-mails d'alerte.
- Les événements « amis uniquement » ne déclenchent aucune alerte auprès des utilisateurs qui ne sont pas amis avec l'organisateur.

### Hors périmètre V1
- Paiement
- Réservation de terrains
- Abonnements premium
- Messagerie complète
- Notation / avis avancés
- Tournois
- Classements
- Vérification d'identité

## Critères de fonctionnement pour la V1
- Une inscription immédiate confirme la place si l'événement n'est pas complet ; une demande soumise à validation ne réserve une place qu'après acceptation par l'organisateur.
- L'organisateur peut accepter ou refuser une demande et les places disponibles restent cohérentes sur le site et dans l'application.
- Un événement annulé ou passé ne peut plus recevoir de nouvelles inscriptions et n'apparaît plus parmi les événements à venir de la carte.
- Les notifications de proximité respectent le sport, le rayon et les canaux activés par l'utilisateur.
- Aucun écran ni parcours de la V1 ne demande un paiement.
- Une demande d'ami en attente ne donne pas accès aux événements « amis uniquement ».
- Si une amitié est retirée, les événements « amis uniquement » de l'ancien ami cessent d'être visibles pour lui ; le traitement d'une participation déjà acceptée reste à définir.

## Décision à prendre ensemble
- Définir ce qu'il advient d'une participation déjà acceptée lorsqu'une amitié est retirée avant l'événement.

## Modèle de données minimal

### User
- id
- firstName
- lastName
- email
- passwordHash
- city
- latitude
- longitude
- favoriteSports[]
- level
- notificationRadius
- pushEnabled
- emailNotificationsEnabled

### Friendship
- id
- requesterId
- addresseeId
- status: pending | accepted | rejected
- createdAt
- respondedAt

### Event
- id
- organizerId
- sport
- title
- description
- date
- startTime
- locationName
- address
- latitude
- longitude
- level
- maxParticipants
- joinMode: instant | approval
- visibility: public | friends
- status: published | cancelled | completed
- createdAt

### Participation
- id
- eventId
- userId
- status: pending | accepted | rejected | cancelled
- createdAt

### Notification
- id
- userId
- type
- eventId
- channel: push | email
- sentAt
- readAt

## Priorité de développement
1. Authentification
2. Création / consultation d'événements
3. Carte + géolocalisation
4. Inscription immédiate / demande de validation
5. Notifications
6. Profil & préférences
7. Back-office simple de modération
