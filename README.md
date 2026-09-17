# Zhilin Ou

Original, dependency-free academic homepage and photography gallery. Static HTML is generated from `data/site.json` using Node.js 20 or later. The committed pages are ready for GitHub Pages (main branch, repository root).

## Update content

1. Edit `data/site.json`.
2. Run `npm run build` and `npm run check`.
3. Commit the data and regenerated pages together.

`papers` contains public work only. Each entry needs `title`, ordered `authors`, `source`, `year`, a verified HTTPS `url`, and `public: true`. Zhilin Ou is emphasized automatically. An optional `figure` object accepts `src`, `width`, `height`, `alt`, `source`, and `caption`; the homepage shows the image with a click-to-enlarge preview. Do not put confidential or unreleased work in this public repository.

`news.enabled` is false and `news.items` is empty. Neither its navigation link nor its section is generated. To enable later, add items with `date`, `text`, and optional `url`, then set `enabled` to true and rebuild.

`researchLinks.planLab` sets the PLAN Lab link used in About and Experience. Each item of `about` is a separate paragraph. Experience and Education appear as separate chronological lists with dates in a dedicated column on desktop.

`links` controls the contact links. A verified Google Scholar profile can be added here when available. All photographs and the portrait belong to Zhilin Ou and were migrated from the previous personal homepage, resized and re-encoded without embedded metadata. Add images to `assets/photos/` and entries with `src`, `width`, `height`, and descriptive `alt` text to `photographs`.

## Files

- `scripts/build.mjs`: page generator, including the dormant News component.
- `scripts/check.mjs`: content, asset, and internal-link checks.
- `assets/site.css`: typography, layout, responsive styles.
- `assets/site.js`: image lightbox, navigation, and subtle scroll reveals.
- `assets/research-scene.js`: original, dependency-free WebGL point-cloud renderer. A 42-second particle story moves through an irregular camera, Zhilin’s kapok-flower photograph, an illustrated flower, Baymax, and Baymax examining the flower. Matched poses articulate his arms and the flower before the particles return to the camera. Motion pauses offscreen or in a background tab, respects reduced motion, and has a pause control. The self-hosted still works without JavaScript/WebGL or if data loading fails.
- `assets/scene/`: story point data and static camera fallback. The generator documented in `assets/scene/README.md` creates the assets; it requires numpy/Pillow and is not needed to build the site.
- `index.html`, `photography/index.html`: generated public pages.
- `photography.html`: compatibility redirect for the previous gallery address.

## Preview

Run `python3 -m http.server 8765` and open `http://localhost:8765/`. On localhost only, `?scene=camera`, `photo`, `flower`, `baymax`, `hold`, or `hold2` freezes a chapter for visual review. Public pages always run the regular loop.

No framework, analytics, cookies, external font downloads, or client-side rendering dependencies. Main content remains readable without JavaScript.

## Ownership

Site implementation and point-cloud renderer written from scratch for Zhilin Ou. No previous template code or template-author assets are included. Personal content and photographs © Zhilin Ou. All rights reserved.

- TCellAlign's framework preview is Figure 1 from the coauthored paper, [arXiv:2607.24093v1](https://arxiv.org/html/2607.24093v1#S1.F1). The original scientific figure is reproduced without alterations.
- DM Sans and DM Serif Display are self-hosted under the SIL Open Font License. Their required notices are retained in `assets/fonts/`.
- The GitHub mark is from Simple Icons (CC0); the remaining interface icons are original inline SVGs. Institution marks identify the relevant universities.

- The point-cloud geometry is generated for this site without an external 3D model or scanned dataset. The flower is an illustration, not a 3D reconstruction. Baymax is a fan-art interpretation of the character from Disney’s Big Hero 6, included at Zhilin’s request.
