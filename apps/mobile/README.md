# PlayLink Android et iPhone

Application Expo / React Native reliée au même projet Supabase que le site. Les écrans sont natifs ; le composant cartographique affiche Leaflet / OpenStreetMap dans une WebView dédiée, sans clé Google Maps.

## Fonctionnalités

- Connexion, inscription et profil sportif ; session conservée dans SecureStore.
- Exploration par liste et carte, recherche et filtre de sport.
- Création avec point précis obligatoire, date et heure natives, détails sportifs, visibilité amis/groupe/public et récurrence.
- Inscription immédiate ou sur validation, attente, désistement, confirmation, invitations et annulation.
- Discussion par session, amis, groupes, notifications internes et signalement/blocage.
- Même compte et mêmes événements sur le site et l’application.

## Développement

```sh
npm ci
npx expo start
npx expo-doctor
npx expo export --platform all
```

Le projet utilise Expo SDK 54. Utiliser un client de développement compatible ; la dernière version d’Expo Go disponible sur un téléphone peut nécessiter un autre SDK. La compilation native EAS permet une installation indépendante d’Expo Go.

## Builds

Projet : https://expo.dev/accounts/fabienlebrun/projects/playlink

```sh
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile simulator
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

- `preview` Android génère un APK de test installable.
- `simulator` génère une application iOS pour le simulateur sur Mac, **pas pour un iPhone physique**.
- `production` génère les formats de distribution des stores. Le compte Apple Developer et les identifiants de signature sont nécessaires pour iPhone ; Google Play Console est nécessaire pour distribuer via Google Play.
- Identifiant choisi : `com.kingdadidou.playlink` pour les deux plateformes.

Les comptes Apple/Google ne sont pas encore créés. Aucun achat, abonnement ou dépôt sur un store n’a été effectué.

## Avant ouverture au public

- Terminer SMTP et le domaine d’envoi pour confirmer les comptes externes.
- Préparer les informations éditeur, la politique de confidentialité, les fiches de confidentialité des stores et le parcours de suppression de compte.
- Tester l’APK et l’application iOS sur des appareils physiques, notamment saisie, clavier, carte, navigation et reconnexion.
- Les alertes push ne sont pas activées. L’écran Nouvelles affiche les notifications conservées en base ; tirer pour actualiser.
- La carte nécessite Internet et dépend de `https://playlink-mvp.vercel.app/mobile-map.html`.
- Des alertes npm subsistent dans les dépendances de l’outillage Expo 54 malgré les correctifs non cassants ; elles doivent être réévaluées lors de la mise à niveau du SDK avant production. Ne pas lancer `npm audit fix --force` sans vérifier la compatibilité native.

## Vérifications réalisées

Les bundles JavaScript/Hermes Android et iOS s’exportent. Expo Doctor valide les 18 contrôles de configuration. Cela ne remplace pas la recette sur téléphone ni la validation des stores.

Compilations natives réussies le 3 octobre 2026 :

- [APK Android de test](https://expo.dev/accounts/fabienlebrun/projects/playlink/builds/1ab64e12-33de-4f3d-b903-210708f3d625)
- [Application pour simulateur iOS](https://expo.dev/accounts/fabienlebrun/projects/playlink/builds/fa7a9a82-90d1-490d-9abd-9a014a983185)

Les artefacts de test Expo ont une durée de conservation limitée ; les commandes ci-dessus permettent de les régénérer.
