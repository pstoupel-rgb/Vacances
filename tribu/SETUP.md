# 🔐 Passer Tribu en mode privé & sécurisé (ton propre Firebase)

Par défaut, Tribu synchronise via un **projet de démo partagé** (pratique pour tester, mais
non sécurisé et mutualisé). Pour ta version à toi — privée, sécurisée, prête à être vendue —
crée ton propre projet Firebase. **Gratuit**, ~2 minutes, aucune carte bancaire.

> Tu n'as **pas besoin de toucher au code** : tout se fait depuis l'écran **⚙︎ Synchro**
> de l'app (bouton en bas de la liste des voyages).

## Étapes

1. **Crée le projet** — va sur [console.firebase.google.com](https://console.firebase.google.com)
   → « Ajouter un projet » → nomme-le (ex. `tribu-voyages`) → crée.

2. **Active Firestore** — menu **Build → Firestore Database** → « Créer une base de données »
   → mode **production** → région **Europe** (`europe-west`).

3. **Déploie les règles de sécurité** — onglet **Règles** → colle tout le contenu du fichier
   [`firestore.rules`](./firestore.rules) → **Publier**.
   Ces règles empêchent d'énumérer les voyages (il faut le lien), valident les données et
   bloquent les suppressions à distance.

4. **Récupère la config web** — roue ⚙︎ **Paramètres du projet** → section « Tes applications »
   → icône **`</>`** (Web) → enregistre l'app → copie l'objet **`firebaseConfig`** affiché :

   ```js
   const firebaseConfig = {
     apiKey: "…",
     authDomain: "ton-projet.firebaseapp.com",
     projectId: "ton-projet",
     storageBucket: "…",
     messagingSenderId: "…",
     appId: "…"
   };
   ```

5. **Colle-la dans l'app** — écran **⚙︎ Synchro** → champ « Config Firebase » → colle l'objet
   → **Enregistrer** → recharge. L'app affiche alors `projet : ton-projet 🔒`.

C'est tout. Toutes les tribus utilisent désormais **ta** base, isolée et sécurisée.

## Pour vendre (étapes suivantes)

- **Comptes** (Firebase Auth email/Google) : le bloc de règles « version comptes » est déjà
  prêt en commentaire dans `firestore.rules` — accès limité aux membres de chaque voyage.
- **Paiement** : Stripe (abonnement ou par voyage).
- **Légal** : politique de confidentialité + CGU (RGPD), tu stockes des données perso.
