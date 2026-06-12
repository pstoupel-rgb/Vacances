# ✈️ Mon Carnet de Voyage

Une application **mobile, gratuite et 100 % privée** pour organiser tous vos voyages — un seul fichier, aucun compte, aucune donnée envoyée sur internet.

## ✨ Fonctionnalités

| | |
|---|---|
| 🧳 **Multi-voyages** | Gérez tous vos voyages au même endroit, avec compte à rebours, statut (à venir / en cours / terminé) et statistiques. |
| 📅 **Planning** | Construisez votre itinéraire jour par jour, avec horaires, types d'activités et boutons « Y aller » (Waze / Google Maps). |
| 💰 **Dépenses partagées** | Suivi type Tricount : qui a payé quoi, répartition entre participants, équilibre du groupe et **remboursements calculés automatiquement**. Budget + répartition par catégorie. |
| 📸 **Photos** | Galerie par voyage, ajout depuis l'appareil photo ou la pellicule, agrandissement, **partage natif** (WhatsApp, Messages, Mail, AirDrop…). |
| 🪪 **Coffre à documents** | Billets d'avion, carte d'identité, passeport, visa, permis, réservations… photographiés ou en PDF, accessibles **hors-ligne**. |
| 🛡️ **Assurance voyage** | Carte d'urgence dédiée (compagnie, n° de contrat, **numéro d'assistance 24h/24 appelable en un tap** — style Europ Assistance). |

## 🔒 Confidentialité

- Tout est stocké **localement sur votre appareil** (localStorage + IndexedDB).
- **Aucun serveur, aucun cloud, aucun upload.** Vos billets et votre passeport ne quittent jamais votre téléphone.
- Le partage de photos/documents utilise le **partage natif du système** : vous choisissez vous-même où et à qui envoyer.
- Sauvegardez/restaurez vos données via les boutons **« Sauvegarder »** / **« Importer »** (fichier `.json`).

## 📱 Installation sur téléphone (comme une vraie app)

1. Hébergez le dossier sur une URL HTTPS — le plus simple : **GitHub Pages**
   (Settings → Pages → branche `main` → `/root`).
2. Ouvrez l'URL sur votre téléphone.
3. **iPhone** : bouton Partager → *Sur l'écran d'accueil*.
   **Android** : menu ⋮ → *Installer l'application* / *Ajouter à l'écran d'accueil*.
4. L'app fonctionne ensuite **hors-ligne**, en plein écran, avec son icône. ✈️

> Vous pouvez aussi simplement ouvrir `index.html` dans un navigateur — tout fonctionne, sauf le mode hors-ligne installé (qui nécessite HTTPS).

## 🗂️ Fichiers

- `index.html` — toute l'application (interface + logique), autonome.
- `manifest.webmanifest` — métadonnées PWA (installation).
- `sw.js` — service worker pour le mode hors-ligne.
- `icon.svg` — icône de l'app.

Un exemple **« Corse 2026 »** est pré-chargé au premier lancement pour découvrir l'app. Supprimez-le quand vous voulez.
