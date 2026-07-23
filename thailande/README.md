# 🐘 Thaïlande — Voyage en famille

Une petite app **sobre, privée et hors-ligne** pour notre voyage en Thaïlande à 4.
Un seul fichier (`index.html`), aucun compte, aucune donnée envoyée sur internet.

## Ce qu'elle contient

- **🏠 Accueil** — compte à rebours (dates modifiables), la famille (prénoms + photos), l'itinéraire en 3 étapes.
- **📅 Planning** — jour par jour (Bangkok → Chiang Mai → Krabi), avec bouton « 🗺️ Y aller » et « 📄 Résa ».
- **📍 Carte** — tous les lieux du séjour épinglés (Leaflet / OpenStreetMap).
- **🎫 Résa** — le **coffre à réservations** : attache tes vrais billets d'avion, confirmations d'hôtel,
  transferts, activités et documents (PDF ou photo). Tout est stocké **localement, hors-ligne**.
- **ℹ️ Infos** — visa, monnaie, décalage, prises, numéros d'urgence, carte d'assurance.

## Personnaliser

- **Dates** : bouton « ✏️ Modifier les dates » sur l'accueil.
- **Prénoms & photos** : appuie sur un membre de la famille.
- **Itinéraire** : c'est une proposition de départ (2 semaines). Modifie le tableau `PLAN` dans `index.html`.
- **Réservations** : appuie sur une ligne dans l'onglet Résa → « 📎 Attacher un PDF ou une photo ».

## Confidentialité

Tout est stocké **sur ton téléphone** (localStorage + IndexedDB). Aucun serveur, aucun cloud.
Tes billets et passeports ne quittent jamais l'appareil. Changer de téléphone = ré-attacher les fichiers.

## Installation (comme une vraie app)

Héberge le dossier en HTTPS (GitHub Pages), ouvre l'URL `.../thailande/` sur ton téléphone,
puis **iPhone** : Partager → *Sur l'écran d'accueil* · **Android** : ⋮ → *Installer l'application*.

> Les infos pratiques (visa, taux de change…) sont **indicatives** — à vérifier avant le départ.
