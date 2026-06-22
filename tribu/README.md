# 🤝 Tribu

**Organise tes sorties entre amis — et réglez ensemble en un tap.**

Tribu est une application mobile (PWA) pour créer des **groupes d'amis**, lancer des **demandes de sortie** (dîner, tennis, padel, resto…) et **régler chacun sa part** ou **alimenter une cagnotte commune** via un paiement en ligne.

> ⚠️ **Ceci est un prototype front-end.** Les paiements Stripe sont **simulés** : aucune carte n'est débitée, et toutes les données restent **localement** sur l'appareil (localStorage). Voir [« Et après »](#-et-après-passer-en-vrai) pour brancher le vrai Stripe.

## ✨ Fonctionnalités

| | |
|---|---|
| 👥 **Groupes** | Crée des groupes d'amis, ajoute des membres, retrouve le solde de chacun. |
| 🎾 **Demandes de sortie** | Propose un dîner, un tennis, un padel, un resto ou une sortie — avec date, heure et lieu. |
| ⇄ **Partage d'addition** | Le montant est réparti entre les participants ; chacun règle sa part. Suivi « qui a payé ». |
| 🏆 **Cagnotte commune** | Un objectif à atteindre, chacun participe du montant qu'il veut, avec barre de progression. |
| 💳 **Paiement (simulé)** | Écran de paiement façon Stripe Checkout, confirmation animée. |
| ⚖️ **Soldes** | Qui doit quoi dans le groupe, calculé automatiquement. |
| 📲 **PWA hors-ligne** | Installable sur l'écran d'accueil, fonctionne sans connexion. |

Un groupe de démo **« Les Potes 🎾 »** est pré-chargé au premier lancement.

## 📱 Lancer / installer

1. Ouvre `index.html` dans un navigateur (ou héberge le dossier sur une URL HTTPS — ex. **GitHub Pages** / **Vercel**).
2. Sur mobile : **iPhone** → Partager → *Sur l'écran d'accueil* ; **Android** → menu ⋮ → *Installer l'application*.

## 🗂️ Fichiers

- `index.html` — toute l'app (interface + logique), autonome.
- `manifest.webmanifest` — métadonnées PWA.
- `sw.js` — service worker (hors-ligne).
- `icon.svg` — icône.

## 🚀 Et après : passer en vrai

Pour des paiements **réels** et un partage **multi-utilisateurs** (les amis se connectent sur leur propre téléphone), il faut un backend :

1. **Comptes & base de données** — ex. [Supabase](https://supabase.com) (auth + Postgres) pour les utilisateurs, groupes et événements partagés en temps réel.
2. **Paiements Stripe** — la clé secrète Stripe **ne doit jamais** être dans le code navigateur. Il faut une **fonction serveur** (serverless) qui :
   - crée une *PaymentIntent* / une *Checkout Session* côté serveur,
   - encaisse via **Stripe Connect** (pour reverser à l'organisateur d'une cagnotte),
   - écoute les **webhooks** Stripe pour confirmer les paiements.
3. **Hébergement** — Vercel / Netlify pour le front + les fonctions serverless.

La logique métier de ce prototype (parts, soldes, cagnottes) est déjà structurée pour être rebranchée sur ces API.
