# DevBoard

A personalised developer feed — 100% client-side, no account, no backend.

🔗 **Live app:** [mihaelacatan04.github.io/DevBoard](https://mihaelacatan04.github.io/DevBoard/)

---

## What it does

Every existing developer dashboard shows the same global feed to everyone.
DevBoard filters everything to your specific stack and interests, set once and stored locally in your browser.

---

## Features

### Panels
- **GitHub** — trending repositories filtered by your chosen languages
- **Hacker News** — top stories cross-referenced with your topics
- **npm** — weekly download stats for packages you personally track
- **DEV.to** — articles tagged with your stack
- **World Clocks** — current time for your remote colleagues

### Personalisation
- First visit: pick your languages and topics in a 2-step onboarding flow
- Everything saved to `localStorage` — no account, no server
- Edit your profile anytime via the ⚙️ settings drawer

### Entity manipulation
| Entity | Add | Remove | Filter |
|---|---|---|---|
| npm packages | ✅ Type name + Enter | ✅ Click ✕ | — |
| Bookmarks | ✅ Click ★ on any item | ✅ Click ★ again | ✅ Filter by GitHub / Article |
| World clocks | ✅ Select timezone | ✅ Click ✕ | — |
| Languages & Topics | ✅ Settings drawer | ✅ Settings drawer | — |

### UI
- Light and dark mode (toggle in navbar, persists across sessions)
- Fully responsive — works on mobile, tablet, and desktop
- Independent panels — slow APIs don't block fast ones

---

## Tech stack

- **React** + **Vite**
- **Tailwind CSS v4**
- `localStorage` for profile and bookmarks persistence

### APIs used (all public, no keys required)
| Source | API |
|---|---|
| GitHub | `api.github.com/search/repositories` |
| Hacker News | `hacker-news.firebaseio.com/v0` |
| npm | `registry.npmjs.org` + `api.npmjs.org/downloads` |
| DEV.to | `dev.to/api/articles` |

---

## App flows

### First visit
1. Onboarding screen appears
2. Step 1 — pick languages (Python, TypeScript, Rust, etc.)
3. Step 2 — pick topics (Frontend, DevOps, ML, etc.)
4. Click "Let's go" → Dashboard loads with personalised data

### Returning visit
- Profile loaded from `localStorage`
- Dashboard loads directly, all panels fetch filtered data

### Editing your profile
1. Click ⚙️ in the navbar
2. Settings drawer slides in from the right
3. Toggle languages or topics — panels update immediately
4. To start over: "Reset all data" in the Danger Zone

### Bookmarking
1. Click ★ on any repo or article to save it
2. Open the Bookmarks tab to view all saved items
3. Filter by GitHub Repos or Articles
4. Click ★ again to remove

### npm tracking
1. Open the npm tab
2. Type a package name and press Enter or click Add
3. See weekly download stats for each package
4. Click ✕ to stop tracking a package

### World Clocks
1. Open the Clocks tab
2. Select a timezone from the dropdown and click Add
3. See live ticking clocks with day/night indicators
4. Click ✕ to remove a clock

---

## Project structure

```
src/
├── components/
│   ├── layout/       # Navbar, SettingsDrawer
│   ├── panels/       # GitHub, HN, npm, DEV.to, Clocks, Bookmarks
│   └── ui/           # Spinner, ErrorMessage
├── context/          # ProfileContext — global state
├── hooks/            # useProfile, useFeed, useTheme
├── pages/            # Onboarding, Dashboard
├── services/         # github.js, hackernews.js, npm.js, devto.js
└── constants/        # topics.js — languages, topics, timezones
```

---

## Running locally

```bash
git clone https://github.com/MihaelaCatan04/DevBoard.git
cd DevBoard
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Git history

| Branch | Description |
|---|---|
| `feat/scaffold` | Vite + React + Tailwind setup, folder structure |
| `feat/onboarding` | constants, hooks, context, onboarding screen |
| `feat/dashboard` | Dashboard layout, tab navigation |
| `feat/panels` | All panels, dark mode, bookmarks, settings, responsive |
