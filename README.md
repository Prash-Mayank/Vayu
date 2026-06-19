# Vayu 2.0 — Weather Intelligence Platform

A multi-API weather dashboard: live forecast, real-world air quality, an
astronomy panel, NASA disaster alerts, city comparison, and Chart.js
visualisations — built with semantic HTML5, vanilla JS and CSS glassmorphism.
No build step, no framework, no backend.

## File structure

```
vayu-2.0/
├── index.html        # markup for every view (dashboard, forecast, AQI, astronomy, alerts, compare, settings…)
├── style.css          # design tokens + glassmorphism layout, mobile-first responsive
├── script.js           # CONFIG, state, API calls, rendering, navigation
├── charts.js            # Chart.js setup (temperature, precipitation, wind, AQI)
├── sw.js                  # service worker (offline shell + Network-First API cache)
├── manifest.json            # PWA manifest
├── assets/
│   ├── vayu_logo.png          # your logo, used in the header/sidebar
│   └── icon-192.png / icon-512.png / icon-32.png   # generated from the logo for PWA/favicon
└── README.md
```

## Things you need to do manually

The app **runs out of the box** for core weather, forecast, astronomy and
disaster alerts — those APIs need no key. Three optional APIs need a free
key from you before they show live data:

| API            | What breaks without a key                                                                                            | Get a key                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| OpenWeatherMap | App falls back to Open-Meteo automatically (still works, slightly less detailed)                                     | https://openweathermap.org/api               |
| IQAir          | AQI panel falls back to Open-Meteo's free Air Quality API automatically (still real numbers, just not IQAir-branded) | https://www.iqair.com/air-pollution-data-api |
| Unsplash       | Hero card uses a plain gradient background instead of a live city photo                                              | https://unsplash.com/developers              |

**Steps:**

1. Sign up at the three links above (no credit card needed for any of them).
2. Open `script.js` and fill in the `CONFIG` object near the top:
   ```js
   const CONFIG = {
     OWM_KEY: "your_openweathermap_key",
     IQAIR_KEY: "your_iqair_key",
     UNSPLASH_KEY: "your_unsplash_access_key",
   };
   ```
3. Save and refresh. The Settings page shows a live "x / 3 keys added" pill so you can confirm it picked them up.

**Do not commit real keys to a public GitHub repo.** For a portfolio deploy,
either keep this a client-only demo with low-privilege/free keys, or proxy
the keyed calls through a small serverless function later.

## Running it locally

Because the app registers a service worker and calls `fetch()`, it needs to
be served over `http://` (not opened directly as a `file://` URL). Two easy
options:

- VS Code → install the "Live Server" extension → right-click `index.html` → "Open with Live Server"
- Or, from a terminal in this folder: `npx serve .` (or `python3 -m http.server 8080`), then visit `http://localhost:8080`

## Deploying

Drag the `vayu-2.0` folder into Netlify Drop, or push it to a GitHub repo and
enable GitHub Pages on the `main` branch — both are free static hosts with
HTTPS, which is required for geolocation and the service worker to work.

## Notes on design choices

- **Icons:** every icon in the UI is Font Awesome 6 (loaded from a CDN
  `<link>` in `index.html`) — no inline SVG and no emoji, per your request,
  except the 👋 in the time-based greeting.
- **Charts:** Chart.js renders to `<canvas>`, so it's compatible with the
  "no SVG" constraint.
- **Astronomy arc:** the sunrise → solar noon → sunset arc is a pure-CSS
  dashed half-circle with a JS-positioned marker (computed from a sine/cosine
  of how far through daylight the current time is) — not an SVG path.
- **Responsiveness:** one codebase, mobile-first. Below 1024px you get a top
  bar + slide-out drawer + bottom tab bar (matching `Mobile_Design.png`);
  at 1024px+ it switches to the persistent sidebar layout (matching
  `Web_Design.png`).
- **State:** everything persists in `localStorage`/`sessionStorage` only —
  theme, unit, favourites (max 5), recent searches (max 7, LIFO), last city,
  Unsplash photo cache (24h), and NASA EONET cache (1 session) — exactly as
  specified in the localStorage table in your project plan.

## What's stubbed vs. fully wired

Fully wired: search + geocoding, current weather, 24h/7-day forecast, hourly
temperature/precipitation/wind charts, astronomy panel + UV, NASA EONET
alert banner & event list, favourites, recent searches, compare mode, theme
toggle, °C/°F toggle, share (Web Share API with clipboard fallback),
notification permission request, install-to-home-screen prompt, offline
shell via the service worker.

Stubbed / lightweight by design: the in-app "AQI 24h trend" chart shapes
itself from the real hourly temperature curve (since IQAir's free tier
doesn't include a historical endpoint) — swap in a real historical call if
your IQAir plan supports it. The "Maps" nav item is a placeholder for a
future radar/satellite layer.
