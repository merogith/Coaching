# Financial Coaching — Bilingual Website

A standalone, static website for one-to-one money coaching in Berlin, in
English and Turkish. Vanilla HTML/CSS/JS, no build step.

[English site](https://merogith.github.io/Coaching/) · [Türkçe](https://merogith.github.io/Coaching/tr/)

The two pages use the same layout, theme controls, and request flow. Switch languages from the header to compare them. A visitor can download a blank money-map worksheet, read what the free introduction involves, and request a time by email. A submitted request is not a confirmed appointment.

## Structure

```
.
├── index.html        ← English page
├── tr/
│   └── index.html    ← Turkish page
├── styles.css        ← shared styles (themeable, light/dark)
├── script.js         ← theme, keyboard/mobile navigation, request states
├── assets/
│   ├── og-coaching.png  ← social share image
│   └── money-map*.csv   ← blank worksheets in English and Turkish
├── tests/site.test.cjs  ← local browser regression checks
└── .nojekyll         ← serve files as-is on GitHub Pages
```

The request form posts to [Formspree](https://formspree.io/). Its success state
means Formspree accepted the request; the visitor then waits for an email reply
to agree a time. The owner must verify the endpoint's activation and actual email
delivery before relying on it for real enquiries. Browser tests intercept every
submission and send no email.

The page uses no analytics or cookies. A theme preference is saved in localStorage
when available; blocked storage does not prevent use. Fonts are self-hosted.

## Deploy

Any static host works. For GitHub Pages: **Settings → Pages → Deploy from a
branch → `main` / root**. The site itself has no build step or runtime dependencies.

## Develop

Open `index.html` directly, or serve locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Check the visitor journey

Node 18 or later is needed only for development tests:

```bash
npm ci
npx playwright install chromium
npm test
```

To use an already installed Chromium, set `PLAYWRIGHT_CHROMIUM_PATH` to its
executable instead of downloading a browser. Tests serve the site locally under
`/Coaching/`, check both languages at 320px, 390px and desktop widths, verify
downloads and keyboard/mobile navigation, and exercise form validation,
failure/retry/success/timeout, blocked storage and JavaScript-disabled fallback.
They do not verify real Formspree email delivery. Paid-session details are agreed
with the visitor before any paid appointment; the site does not invent a price.

---

Financial coaching and education — not regulated financial advice.
