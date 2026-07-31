# Zhilin OU — Academic Portfolio

Personal academic homepage and photography archive for Zhilin OU (欧芝麟).

The site is built as a small, framework-free static project so it can be served directly from the root of the `main` branch with GitHub Pages.

## Site structure

- `index.html` — research profile, education, experience, activities, awards, and photography preview
- `photography.html` — complete digital and film photography archive with an accessible lightbox
- `assets/css/main.css` — shared responsive visual system and light/dark themes
- `assets/js/main.js` — theme preference, mobile navigation, and gallery interactions
- `assets/img/` — portrait, institution marks, original photography, and favicon

## Local preview

From the repository root, start any static file server. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Content notes

- The current profile accurately describes Zhilin OU as an incoming MPhil student in Artificial Intelligence at CUHK-Shenzhen for 2026–2028.
- A CV link is intentionally omitted until a verified Zhilin OU CV is available.
- Research link placeholders are kept as HTML comments so verified Paper, Code, or Project links can be added later without changing the layout.
- Original photography files are preserved and are not overwritten by the page implementation.

## Deployment

GitHub Pages can deploy the site directly from the repository root on the `main` branch. No build step or package installation is required.

## License

See [LICENSE.md](LICENSE.md). The existing upstream MIT attribution is retained.
