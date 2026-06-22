# 🍷 Vini

**L'app des amis qui organisent, partagent et profitent ensemble.**

Prototype mobile (PWA) fidèle aux maquettes : groupes privés, événements & sondages, paiements simplifiés, cagnottes et **commandes groupées de vin**.

> ⚠️ **Prototype front-end.** Les paiements Stripe sont **simulés** (écran de paiement réaliste, frais de service, mais aucune carte n'est débitée). Toutes les données restent **localement** sur l'appareil (localStorage).

## ✨ Ce que fait l'app

| | |
|---|---|
| 👥 **Groupes privés** | Crée tes cercles d'amis (nom, emoji, couleur) et invite des membres. |
| 📅 **Activités** | Dîner, sport (tennis/padel), sortie… avec date, lieu, description. |
| ✅ **RSVP** | Je participe / Peut-être / Non, avec compteurs en direct. |
| 📊 **Sondages** | « Quel jour ? », « Quel resto ? » — votez et ajoutez des options. |
| 🐷 **Cagnottes** | Objectif + anneau de progression, liste des contributeurs. |
| 🛍️ **Commandes groupées** | Vin, nourriture, cadeaux ou autre : catalogue de lots, quantités, seuil minimum, suivi (En préparation / Livrée). |
| 📷 **Photos** | Galerie par groupe, ajout **depuis la pellicule iPhone**, **téléchargement / enregistrement** natif (partage iOS). Stockage local (IndexedDB). |
| 💳 **Paiement (simulé)** | Écran façon Stripe : récap, frais de service, carte •••• 4242, confirmation. |

Un groupe de démo **« Les amis du dimanche »** est pré-chargé au premier lancement.

## 📱 Lancer

Ouvre `index.html` dans un navigateur, ou héberge le dossier sur une URL HTTPS (GitHub Pages / Vercel) puis « Ajouter à l'écran d'accueil ».

## 🗂️ Fichiers
- `index.html` — toute l'app (UI + logique).
- `manifest.webmanifest` · `sw.js` · `icon.svg` — PWA / hors-ligne.

## 🚀 Passer en réel
La version full-stack (comptes, paiements Stripe réels, données partagées) est dans le dossier **`../tribu-app`** (Next.js + Supabase + Stripe), qui couvre déjà groupes, événements, paiements, cagnottes et le back-end des commandes de vin. Cette interface « Vini » sert de référence visuelle à y appliquer.
