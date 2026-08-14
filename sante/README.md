# 🫀 Ma Santé

Une application **mobile, gratuite et 100 % privée** pour suivre ta santé et bien vieillir — un seul fichier, aucun compte, **aucune donnée envoyée sur internet**.

## ✨ Ce que fait l'app

| | |
|---|---|
| 🏠 **Aperçu** | VO2 max, FC de repos, volume de course, répartition d'effort (règle du 80/20) et petites projections « si tu continues comme ça ». |
| 🩺 **Coach** | Des conseils personnalisés **à partir de tes propres chiffres** — casquette médecin + préparateur physique « longévité ». Tes 3 priorités, cardio, force, sommeil, nutrition/inflammation, suivi médical, et un plan-type de la semaine. |
| 🩸 **Bilan sanguin** | Courbes de tes marqueurs (CRP, cholestérol, foie, PSA, ferritine, vitamine D…), points d'attention **générés automatiquement** face aux seuils du labo, et âge biologique (FidAge). |
| 🌙 **Sommeil** | Durée, sommeil profond / REM / léger, évolution semaine par semaine. |
| ⚖️ **Poids** | Courbe de poids (balance connectée + pesées saisies à la main). |
| 🏃 **Courses** & 🏒 **Autres sports** | Détail de tes sorties et de tes autres activités (vélo, plongée, hockey…). |

## 📲 « Pomper » les données de l'iPhone (Apple Santé)

1. iPhone → app **Santé** → touche ta **photo** (en haut à droite).
2. Tout en bas : **Exporter toutes les données Santé** → tu obtiens un fichier **`export.zip`**.
3. Enregistre-le dans **Fichiers** (ou reçois-le par AirDrop).
4. Dans l'app, onglet **📥 Données** → *Choisir export.zip* → l'analyse se fait **entièrement dans le navigateur, hors-ligne**.

On récupère automatiquement : VO2 max, FC de repos, poids, sommeil (avec phases), courses (allure, FC, effort) et autres sports.

> Le dézippage utilise `DecompressionStream`, intégré à Safari iOS (16.4+) et aux navigateurs récents — **aucune librairie externe, rien ne quitte l'appareil**. Si ton navigateur est trop ancien, dézippe l'archive sur ordinateur et choisis directement `export.xml`.

## ✍️ Saisir tes autres infos santé

Onglet **📥 Données** :
- **Pesées** — date + poids, la courbe se met à jour.
- **Bilans sanguins** — date + les marqueurs que tu as (les autres restent vides), plus l'âge biologique FidAge en option. Les points d'attention et les courbes se recalculent tout seuls.

## 🔒 Confidentialité

- Tout est stocké **localement** (localStorage). **Aucun serveur, aucun cloud, aucun upload.**
- L'import Apple Santé est analysé dans le navigateur : le fichier ne part **jamais** sur internet.
- Sauvegarde / restauration via un simple fichier **`.json`** (onglet Données) — tu le gardes où tu veux.

## ⚠️ Important

Les conseils de l'onglet **Coach** et les points d'attention du **Bilan** ne sont **pas des diagnostics** : ce sont tes propres chiffres comparés à des repères généraux. Pour toute décision (supplément, médicament, dépistage), parles-en à ton médecin.

## 📱 Installation

1. Héberge le dossier sur une URL HTTPS (le plus simple : **GitHub Pages**).
2. Ouvre l'URL sur ton téléphone.
3. **iPhone** : Partager → *Sur l'écran d'accueil*. **Android** : menu ⋮ → *Installer l'application*.
4. L'app fonctionne ensuite **hors-ligne**, en plein écran, avec son icône. 🫀

## 🗂️ Fichiers

- `index.html` — toute l'application (interface + logique + import Apple Santé), autonome.
- `manifest.webmanifest` — métadonnées PWA.
- `sw.js` — service worker (mode hors-ligne).
- `icon.svg` — icône de l'app.

Un **exemple réel** (snapshot du 14 août 2026) est pré-chargé au premier lancement. Importe ton propre export ou remets l'exemple à zéro depuis l'onglet Données quand tu veux.
