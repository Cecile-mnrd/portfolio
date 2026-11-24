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

## Pages projet
Une page par projet dans `projets/` (contexte, mission, réalisations, chiffres, ce que j'en retiens, projet suivant).
Les images vont dans `assets/projets/<nom-du-projet>/` ; remplacer chaque `.placeholder` par une `<img>`.
Les passages entre crochets `[À compléter …]` sont à réécrire.

## Email et téléphone protégés
Ils ne sont jamais écrits en clair dans le code : chaque valeur est inversée puis encodée en base64 dans `data-v`, et ne s'affiche qu'au clic.
Pour encoder la tienne, dans la console du navigateur :

    btoa([...'prenom.nom@domaine.fr'].reverse().join(''))

Cela arrête les robots qui aspirent les adresses, pas une personne déterminée.

## À compléter avant la mise en ligne
Les mentions « à compléter » apparaissent en corail italique sur le site (rechercher `class="todo"`).
- Point Comm' : taux d'ouverture, taux de clic, abonnés, effet d'un test A/B
- Réseaux sociaux : impressions, engagement, évolution des abonnés
- Office de Tourisme : trafic web
- RDV PRO : participants, périmètre exact
- Micro-trottoir : personnes interrogées, vues, autorisation de diffusion
- Mémoire : conclusions en 3 phrases une fois rendu
- « Ce que j'en retiens » sur chaque page projet
- Vérifier les dates : Office de Tourisme (2022–2025) et master (2025–2027)
- Photo portrait (accueil) et photo près de la mer (à propos), visuels de projets, CV en PDF, email et téléphone encodés
