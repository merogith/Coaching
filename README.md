# Financial Coaching — Bilingual Website

A standalone, static website for one-to-one money coaching in Berlin, in
English and Turkish. Vanilla HTML/CSS/JS, no build step.

[English site](https://merogith.github.io/Coaching/) · [Türkçe](https://merogith.github.io/Coaching/tr/)

The two pages use the same layout, theme controls, and booking flow. Switch languages from the header to compare them.

## Structure

```
.
├── index.html        ← English page
├── tr/
│   └── index.html    ← Turkish page
├── styles.css        ← shared styles (themeable, light/dark)
├── script.js         ← theme toggle, mobile nav, scroll reveals
├── assets/
│   └── og-coaching.png  ← social share image
└── .nojekyll         ← serve files as-is on GitHub Pages
```

The booking form posts to [Formspree](https://formspree.io/); submissions go
straight to email. The page sets no cookies and loads no trackers.

## Deploy

Any static host works. For GitHub Pages: **Settings → Pages → Deploy from a
branch → `main` / root**. Fonts load from Google Fonts; everything else is local.

## Develop

Open `index.html` directly, or serve locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

---

Financial coaching and education — not regulated financial advice.
