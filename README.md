# Portfolio — Cécile Moinard

Site statique (HTML/CSS/JS, sans build), esthétique « collage papier » : trombones, scotch, kraft, typo machine à écrire.

## Voir le site
Ouvrir `index.html` dans un navigateur, ou lancer un petit serveur :

    python3 -m http.server 8000

## Structure
- `index.html` : tout le contenu (textes, projets, parcours, compétences, contact)
- `css/style.css` : couleurs et typos dans `:root`, en haut du fichier
- `js/main.js` : animations (GSAP + ScrollTrigger + Lenis, dans `js/vendor/`)
- `assets/` : images (portrait, `projets/`, CV en PDF)

## Remplacer le contenu
- **Portrait** : dans `.card--photo`, remplacer le `<div class="placeholder">` par `<img src="assets/portrait.jpg" alt="…">` (effet duotone olive automatique).
- **Projets** : une `<article class="planche">` par projet (3 visuels découpés `.cut`, couleurs `--a`/`--b`) ; remplacer chaque `.placeholder` par `<img src="assets/projets/xxx.jpg" alt="…">`.
- **Contact** : email, téléphone, liens réseaux et `assets/CV-Cecile-Moinard.pdf`.

## Animations
- Hero : les papiers « tombent » sur la table, parallaxe au scroll, fractions qui suivent la souris
- Manifeste : les mots s'allument au défilement
- Projets : défilement horizontal épinglé (ordinateur), apparition en cascade (mobile)
- Parcours : panneaux qui glissent, astérisques qui tournent, yeux qui suivent la souris
- Compétences : la carte mentale se dessine au scroll
- Contact : bandeau défilant qui accélère avec la vitesse du scroll
- `prefers-reduced-motion` respecté : aucune animation, contenu intact.

## Mise en ligne
GitHub Pages (Settings → Pages → branche), Netlify ou Vercel : glisser le dossier, aucun build nécessaire.
