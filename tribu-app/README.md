# 🍷 Vini — application réelle (Next.js + Supabase + Stripe)

Version **full-stack** de Vini : comptes utilisateurs, groupes partagés et **paiements Stripe réels**, avec reversement aux organisateurs via **Stripe Connect**. PWA installable.

> Pour la maquette visuelle 100 % locale (paiement simulé), voir le dossier `../vini`.

## ✨ Fonctionnalités

- 🔐 **Connexion** Google, Facebook et email + mot de passe (création de compte)
- 👥 **Groupes** privés (réutilisables ou **éphémères**) + invitation par code/lien
- 🍝 **Dîners** : on invite les gens **par email**, le **groupe se crée automatiquement** au moment de valider ; les invités rejoignent en se connectant
- 📅 **Activités** (dîner/sport/sortie) avec **RSVP** Je participe / Peut-être / Non + parts d'addition
- 📊 **Sondages** : votez, ajoutez des options
- 🐷 **Cagnottes** : objectif, anneau de progression, contributeurs, paiement Stripe
- 🍷 **Commandes groupées de vin** : catalogue (lots de N bouteilles), quantités, seuil minimum, paiement du panier
- ⚖️ **Soldes** calculés automatiquement
- 📲 **PWA** installable (manifest + service worker)

## 🧱 Stack

- **Next.js 14** (App Router, Server Actions, Route Handlers) — front + API serverless
- **Supabase** — auth (Google/Facebook/email) + Postgres avec **RLS**
- **Stripe** — Checkout + **Connect Express** (reversement organisateur) + Webhooks
- **Resend** (optionnel) — emails d'invitation
- Déployable sur **Vercel**

> ℹ️ Le schéma [`supabase/schema.sql`](supabase/schema.sql) est **idempotent** : tu peux le relancer après une mise à jour pour ajouter les nouvelles tables (sondages, cagnottes, invitations, vin…) sans rien casser.

## ⚙️ Mise en route (≈ 15 min)

### 1. Installer
```bash
cd tribu-app
npm install
cp .env.example .env.local   # puis remplis les valeurs (voir ci-dessous)
```

### 2. Supabase
1. Crée un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → colle tout le contenu de [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. **Project Settings → API** : copie `Project URL`, `anon public` et `service_role` dans `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. **Authentication → URL Configuration** : ajoute `http://localhost:3000/auth/callback`
   (et l'URL Vercel en prod) dans *Redirect URLs*.
5. **Authentication → Providers** : active les méthodes de connexion proposées sur l'écran d'accueil :
   - **Email** (avec mot de passe) — activé par défaut.
   - **Google** : crée un OAuth Client ID sur Google Cloud, colle Client ID/Secret dans Supabase.
   - **Facebook** : crée une app sur Facebook Developers, colle App ID/Secret dans Supabase.
   Le bouton correspondant n'apparaît comme fonctionnel qu'une fois le provider activé côté Supabase.

### 3. Stripe
1. Crée un compte [stripe.com](https://stripe.com), reste en **mode test**.
2. **Developers → API keys** : copie `Secret key` (`STRIPE_SECRET_KEY`) et `Publishable key`
   (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
3. Active **Connect** (Settings → Connect) pour permettre le reversement aux organisateurs.
4. **Webhooks** : crée un endpoint vers `https://<ton-app>/api/stripe/webhook`, écoute
   `checkout.session.completed` et `account.updated`, puis copie le `Signing secret`
   (`STRIPE_WEBHOOK_SECRET`).
   - En local, utilise la CLI Stripe :
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
     (elle affiche un `whsec_...` à mettre dans `.env.local`).

### 4. Lancer
```bash
npm run dev   # http://localhost:3000
```
Carte de test Stripe : `4242 4242 4242 4242`, date future, n'importe quel CVC.

## 🚀 Déploiement (Vercel)
1. Pousse le dossier `tribu-app` sur un repo GitHub.
2. Importe-le sur [vercel.com](https://vercel.com).
3. Ajoute toutes les variables de `.env.example` dans **Settings → Environment Variables**
   (mets `NEXT_PUBLIC_APP_URL` = ton URL Vercel).
4. Mets à jour les *Redirect URLs* Supabase et l'URL du webhook Stripe avec le domaine de prod.

## 💸 Comment circule l'argent
- **Partage d'addition** : chaque participant paie sa part. Si l'organisateur a activé Connect,
  l'argent lui est **reversé** automatiquement (`transfer_data.destination`). Sinon il est collecté
  sur le compte de la plateforme.
- **Cagnotte** : chacun contribue du montant qu'il veut, reversé à l'organisateur (idem Connect).
- Un **webhook** (`checkout.session.completed`) enregistre chaque paiement en base — c'est la
  source de vérité (jamais le navigateur).

## 🔒 Sécurité
- **RLS** activée sur toutes les tables : on ne voit que les groupes dont on est membre.
- La clé `service_role` n'est utilisée **que** côté serveur (webhook) et jamais exposée.
- La clé secrète Stripe ne quitte jamais le serveur ; le front ne reçoit que des URLs de Checkout.

## 🗺️ Structure
```
app/
  page.tsx                 Accueil : groupes + réglages (profil, Connect)
  login/                   Connexion par lien magique
  auth/callback/           Échange du code → session
  group/[id]/              Groupe : onglets Événements / Soldes / Membres
  event/[id]/              Détail événement + paiement
  join/[code]/             Rejoindre via lien d'invitation
  api/checkout/            Crée une session Stripe Checkout
  api/stripe/webhook/      Confirme les paiements (source de vérité)
  api/connect/             Onboarding Stripe Connect (organisateurs)
  actions.ts               Server Actions (groupes, événements, profil)
lib/                       Clients Supabase/Stripe, types, calculs (parts, soldes)
supabase/schema.sql        Schéma Postgres + RLS
```

## 🛣️ Pistes suivantes
- Notifications (rappel de paiement, nouvel événement) via Supabase Realtime / e‑mail.
- Remboursements et clôture d'un événement.
- Frais de plateforme (`application_fee_amount`) si tu veux monétiser.
- App mobile native (Expo) réutilisant la même base Supabase.
