# PlayLink — préparation de la bêta

## Ajouts du 4 octobre 2026

- Fabien dispose du rôle de modérateur dans Supabase.
- Suppression du compte avec confirmation explicite, retrait des messages/événements et transfert des groupes.
- Récupération du mot de passe sur le site, accessible depuis l’application.
- Modification du titre, date, adresse, point de rendez-vous, capacité et description par l’organisateur. Sport et règles d’accès conservés. Participants prévenus ; confirmations réinitialisées si rendez-vous modifié.
- Notifications d’invitation et infrastructure d’envoi Expo ; activation volontaire dans l’application, retrait du jeton avant déconnexion.
- Application : 20 sports, menus de sélection, photo de profil, niveaux et repères identiques au site, recherche d’adresse IGN, modification du rendez-vous, pictogrammes sur la carte.
- Pages de confidentialité, conditions et instructions de suppression.

## Vérifications effectuées

- Tests SQL dans une transaction annulée : refus de modification par un autre utilisateur, notifications après modification, réinitialisation de confirmation, refus de suppression sans confirmation, suppression du compte temporaire et transfert du groupe.
- Vérification syntaxique des fichiers web modifiés et test du point de rendez-vous obligatoire.
- Export des bundles Android et iOS réussi. Cet export ne constitue pas un test physique ni une validation par les stores.

## Conditions avant ouverture publique

- Domaine PlayLink à acquérir : disponibilité/prix et budget non confirmés. Resend connecté, seul nito-nature.fr est vérifié ; l’utilisateur a choisi un domaine PlayLink distinct.
- Configurer les DNS de ce domaine, vérifier Resend puis configurer le SMTP Supabase. Tester confirmation et récupération sur une adresse extérieure à l’équipe. Aucun e-mail réel ne peut encore être garanti.
- Vérifier les identifiants FCM/APNs nécessaires à Expo, puis réception des notifications sur téléphones physiques. Le déclencheur actuel envoie à Expo sans suivi des reçus ni nouvelle tentative : ce suivi reste à ajouter avant une exploitation à plus grande échelle.
- Faire un parcours complet avec deux personnes sur téléphones : comptes, demandes d’amis, visibilité privée, invitations, participation, désistement/liste d’attente, discussion, signalement, modification et suppression de compte.
- Finaliser les déclarations et validations Google Play ; publication iPhone conditionnée au compte Apple Developer et à une compilation signée.

Ne pas présenter cette version comme entièrement prête au public avant ces vérifications.
