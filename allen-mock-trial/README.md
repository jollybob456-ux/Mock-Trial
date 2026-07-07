# Allen Mock Trial

The official website for the Allen High School Mock Trial Club — home to the club's initiatives, scrimmage scheduler, training curriculum, team roster, officer directory, resource library, and membership sign-up.

## Structure

```
.
├── index.html        Main page (all sections)
├── css/
│   └── styles.css    All styling
├── js/
│   └── script.js     Scrimmage scheduler, roster, docket, resources, and join-form logic
└── README.md
```

## Running it locally

This is a static site with no build step. Just open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, select the `main` branch and `/ (root)` folder.
4. Save — your site will be live at `https://<username>.github.io/<repo-name>/` within a minute or two.

## Data storage

Live data (scrimmage requests, announcements, roster entries, resources, and club applications) is stored using the in-browser `window.storage` API used by Claude artifacts. **This only works when the page is opened inside a Claude artifact** — it will not persist data when hosted on GitHub Pages or any other static host, since `window.storage` won't exist there.

Before or while moving this to GitHub, you'll want to swap that storage layer for something that works on a normal web host — for example:
- A free backend like [Supabase](https://supabase.com) or [Firebase](https://firebase.google.com) for a real shared database, or
- A simple JSON file + GitHub Actions workflow if you want to keep it lightweight, or
- `localStorage` if you're fine with data only persisting per-device rather than shared across the whole club.

All the storage calls are isolated in `js/script.js` inside the `getList()` and `saveList()` helper functions, so swapping the backend just means rewriting those two functions — the rest of the code (rendering, forms, filters) can stay as-is.

## Customizing

- Colors, fonts, and spacing are all defined as CSS custom properties at the top of `css/styles.css` (`:root { ... }`) — change them there to re-theme the whole site.
- Officer names/roles live directly in the `#officers` section of `index.html`.
