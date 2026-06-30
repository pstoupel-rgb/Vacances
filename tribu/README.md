# 🌴 Tribu — l'app de vacances en groupe

> Vos vacances en groupe, enfin simples. Programme, dépenses partagées, valise, photos et météo — au même endroit, **hors-ligne**, **sans compte**.

Tribu est une **PWA autonome** (un seul fichier `index.html`, aucun backend). Tout est stocké
sur l'appareil (localStorage + IndexedDB pour les photos), donc ça marche sans réseau et sans inscription.
Inspirée d'une app de voyage perso « en dur », généralisée en **produit multi-voyages** réutilisable par n'importe quel groupe.

## ✨ Fonctionnalités

- **Multi-voyages** — créez autant de voyages que vous voulez, avec couverture, dates et participants.
- **Compte à rebours** intelligent (avant / pendant / après le séjour).
- **Programme jour par jour** — onglets de jours auto-générés depuis les dates ; activités avec heure, icône, lieu (lien Google Maps) et notes.
- **Dépenses partagées** — qui a payé, partage à la carte, **équilibre en temps réel** et **calcul automatique des remboursements** (algorithme de settlement minimal « qui doit combien à qui »).
- **Valise / packing** — checklist par catégories, barre de progression, suggestions toutes prêtes.
- **Photos** — galerie locale (IndexedDB), plein écran, enregistrement dans la pellicule via le partage natif iOS/Android.
- **Météo** — prévisions par jour du séjour via [Open-Meteo](https://open-meteo.com) (gratuit, **sans clé API**), géocodage automatique de la destination, mises en cache pour l'offline.
- **Sauvegarde / restauration** — export & import JSON d'un voyage ou de tout.
- **Installable** (Ajouter à l'écran d'accueil) et **offline-first** via service worker.

## 🚀 Lancer

C'est un site statique. Servez le dossier :

```bash
cd tribu
python3 -m http.server 8080
# puis ouvrez http://localhost:8080
```

Ou déposez le dossier sur n'importe quel hébergement statique (GitHub Pages, Netlify, Vercel…).

## 🧱 Stack

- HTML/CSS/JS pur, **zéro dépendance de build**.
- Polices : Fraunces + Inter (Google Fonts).
- Stockage : `localStorage` (état) + `IndexedDB` (photos).
- API externe : Open-Meteo (météo + géocodage), sans clé.

## 🗺️ Pistes produit (next)

- Synchronisation temps réel multi-appareils (Firebase) pour partager un voyage entre membres.
- Comptes & liens d'invitation, isolation des données par voyage.
- Mode white-label pour locations de villas / conciergeries.
- Notifications de rappel (résa, vol) et import .ics.

---

Fait avec ❤️ — un point de départ solide pour la meilleure app de vacances en groupe.
