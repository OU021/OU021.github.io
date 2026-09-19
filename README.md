# Zhilin Ou

Original, dependency-free academic homepage, photography gallery, and personal bookshelf. Static HTML is generated from `data/site.json` and `data/books.json` using Node.js 20 or later. The committed pages are ready for GitHub Pages (main branch, repository root).

## Update content

1. Edit `data/site.json`.
2. Run `npm run build` and `npm run check`.
3. Commit the data and regenerated pages together.

`papers` contains public work only. Each entry needs `title`, ordered `authors`, `source`, `year`, a verified HTTPS `url`, and `public: true`. Zhilin Ou is emphasized automatically. An optional `figure` object accepts `src`, `width`, `height`, `alt`, `source`, and `caption`; the homepage shows the image with a click-to-enlarge preview. Do not put confidential or unreleased work in this public repository.

`news.enabled` is false and `news.items` is empty. Neither its navigation link nor its section is generated. To enable later, add items with `date`, `text`, and optional `url`, then set `enabled` to true and rebuild.

`researchLinks.planLab` sets the PLAN Lab link used in About and Experience. Each item of `about` is a separate paragraph. Experience and Education appear as separate chronological lists with dates in a dedicated column on desktop.

`researchVision` states a shared research aspiration across 3D understanding, generation, and embodied AI: advancing AI that continually learns, improves through experience, and supports people with warmth and care. It appears once inside the profile panel between research interests and contact links. `sceneReference` introduces Zhilin as a photographer and explains how the animation brings together photography and this vision for AI, with Baymax as a concrete image of warmth and care; its first mention of photography links to the gallery. `sceneCaption` identifies the personal photograph. These passages use no additional box or disclosure. About retains the academic background, with institutions and advisor links given a little more weight for scanning.

`links` controls the contact links. A verified Google Scholar profile can be added here when available. All photographs and the portrait belong to Zhilin Ou and were migrated from the previous personal homepage, resized and re-encoded without embedded metadata. Add images to `assets/photos/` and entries with `src`, `width`, `height`, and descriptive `alt` text to `photographs`.

`photographyPreview` selects the three homepage prints by image path. Each photograph has a stable `id`, English `title` / `caption` / `alt`, and Chinese `titleZh` / `note` / `altZh`. The subtle print border uses `date` and optional `printLocation` for its date/place stamp. Optional `date` uses YYYY-MM, with `location` / `locationZh` and an explicitly confirmed `medium`. Missing dates or locations are omitted. The gallery and album share a Chinese/English toggle, saved locally as `zhilin-photography-language`. Captions and metadata appear when opening a photo, leaving the gallery itself uncluttered. Each print opens an album with previous/next buttons and arrow-key navigation. The main gallery uses the same controls. Only use personal anecdotes supplied by Zhilin.

`data/books.json` controls the independent `/bookshelf/` page under More, with a small five-cover preview at the bottom of the homepage. `bookshelfPreview` in `data/site.json` selects these books by ID. Books are sorted by the displayed English author name, A–Z, keeping each author together in both languages. Each book has an `id`, `title`, `author`, a verified Eslite product page in `sourceUrl`, a short neutral `description`, and a local `cover` with `src`, `width`, and `height`. Verified edition metadata uses `publisher`, `year`, and optionally `edition`; use `editionRegion: "unspecified"` when a supplied cover cannot be tied confidently to one edition. Optional `alternateTitle` preserves another familiar Chinese title; `translator`, `isbn`, and `coverSource` document the edition. `en` supplies the English title, author spelling, synopsis, and its bibliographic source. The page offers a Chinese/English switch while keeping the selected covers and edition information. The language preference is saved locally in the browser. Descriptions introduce the books and are not attributed to Zhilin as personal reading notes. To add a book, verify its edition and cover, add the small cover asset under `assets/books/`, and rebuild. Covers link to their edition sources without JavaScript; with JavaScript, they open a keyboard-accessible book preview.

## Files

Homepage book covers open the same bilingual book details in place. Their `/bookshelf/#book-<id>` links remain available without JavaScript, or when opening in another tab. Hover and keyboard focus lift only the selected cover and reveal its title.

Hovering or keyboard-focusing the Baymax logo plays one brief head tilt and camera lift, then returns to rest. Reduced motion disables it. Photo previews sample a tiny version of the local image to tint only the backdrop; changing photos updates the tint, while paper previews retain the neutral backdrop. No photograph pixels or files are modified, and unavailable colour sampling falls back to neutral.

On touch screens, swipe horizontally on an opened photograph to move through the album. Vertical scrolling, pinch zoom, short taps, and the paper framework retain their normal behaviour; arrow buttons and keyboard navigation remain available.

`assets/social-card.png` is the 1200 × 630 link-preview card, referenced by Open Graph and Twitter metadata. To regenerate after changing the name, portrait, role, or research interests, run `node scripts/render-social-card.mjs` in an environment with `@napi-rs/canvas`, then build the site. The committed PNG is used directly, so ordinary builds remain dependency-free. The 404 page reuses the existing Baymax logo with root-relative links and assets, including when the missing URL has several path segments.

- `scripts/build.mjs`: page generator, including the dormant News component.
- `scripts/bookshelf.mjs`: bookshelf markup and individual book previews.
- `scripts/photography.mjs`: bilingual photography page, image labels, and story metadata.
- `assets/bookshelf.css`, `assets/bookshelf.js`: shelf layout and progressively enhanced book dialogs, loaded on the bookshelf page and the homepage’s book previews.
- `scripts/check.mjs`: content, asset, and internal-link checks.
- `assets/site.css`: typography, layout, responsive styles.
- `assets/baymax-camera.svg`, `assets/favicon.svg`: upper-body Baymax holding a camera, used beside the site name and as the browser icon.
- `assets/site.js`: photo album and paper image dialogs, navigation, and subtle scroll reveals.
- `assets/preview-motion.js`: short shared-image open/close transitions for photos and book covers; respects reduced motion and falls back to immediate dialogs.
- A book may optionally include `personalNote: {"zh": "…", "en": "…"}` for a small bilingual note in its details. Only use Zhilin’s own supplied reflections; the note stays absent until both texts exist.
- `assets/research-scene.js`: original, dependency-free WebGL point-cloud renderer. A 42-second particle story moves through an irregular camera, Zhilin’s kapok-flower photograph, an illustrated flower, Baymax, and Baymax examining the flower. Matched poses articulate his arms and the flower before the particles return to the camera. Five discreet progress segments, with accessible labels, replay a selected form while preserving the visitor's pause/reduced-motion preference. Motion pauses offscreen or in a background tab. The self-hosted still works without JavaScript/WebGL or if data loading fails.
- `assets/scene/`: story point data and static camera fallback. The generator documented in `assets/scene/README.md` creates the assets; it requires numpy/Pillow and is not needed to build the site.
- `index.html`, `photography/index.html`, `bookshelf/index.html`: generated public pages.
- `photography.html`: compatibility redirect for the previous gallery address.

## Preview

Run `python3 -m http.server 8765` and open `http://localhost:8765/`. On localhost only, `?scene=camera`, `photo`, `flower`, `baymax`, `hold`, or `hold2` freezes a chapter for visual review. Public pages start the regular loop unless reduced motion is preferred.

No framework, analytics, cookies, external font downloads, or client-side rendering dependencies. Main content remains readable without JavaScript.

## Ownership

Site implementation and point-cloud renderer written from scratch for Zhilin Ou. No previous template code or template-author assets are included. Personal content and photographs © Zhilin Ou. All rights reserved.

- TCellAlign's framework preview is Figure 1 from the coauthored paper, [arXiv:2607.24093v1](https://arxiv.org/html/2607.24093v1#S1.F1). The original scientific figure is reproduced without alterations.
- Book covers identify the selected editions; artwork remains the property of the respective publishers and rights holders. Edition pages and cover sources are recorded in `data/books.json`.
- DM Sans and DM Serif Display are self-hosted under the SIL Open Font License. Their required notices are retained in `assets/fonts/`.
- The GitHub mark is from Simple Icons (CC0); the remaining interface icons are original inline SVGs. Institution marks identify the relevant universities.

- The point-cloud geometry is generated for this site without an external 3D model or scanned dataset. The flower is an illustration, not a 3D reconstruction. The Baymax point cloud and camera logo are fan-art interpretations of the character from Disney’s Big Hero 6, included at Zhilin’s request.

## Exhibitions

`data/exhibitions.json` is the growing visit catalogue at `/exhibitions/`. Add a visit with a unique URL-safe `id`, `date` (YYYY-MM-DD), `venue`, bilingual `city`, confirmed `exhibitions`, `preview`, and `photos`. The builder creates a separate `/exhibitions/<id>/` gallery per visit and sorts the catalogue newest first. Keep entries factual: dates, venues, verified exhibition names, photographs, and optional verified artwork credits/source URLs. Do not add personal reflections. A visit may include several exhibitions; an incomplete confirmed list must not be treated as the attribution of every photograph.

Images live in `assets/exhibitions/`, preserve the full frame, and are converted to sRGB WebP without EXIF metadata. The gallery supports Chinese/English, keyboard navigation and the existing image dialog. Its language preference is separate from Photography. Museum artwork remains the property of the respective artists and rights holders; linked collection records provide verified artwork information.

The homepage groups Photography, Bookshelf, and Exhibitions under one small “Beyond research” heading. Their parallel descriptions introduce personal interests; one shared click hint covers all three previews. Visit dates remain on the exhibition catalogue and detail pages.

Each homepage exhibition miniature is an independent link. Hover and keyboard focus gently lift only that frame, matching the other personal previews; reduced motion disables movement.
