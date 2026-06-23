# 🍳 Code-à-Cuisine

> **AI-powered recipe generator** — enter your ingredients, get 3 personalized recipes in seconds.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![n8n](https://img.shields.io/badge/n8n-Self--Hosted-EA4B71?style=flat-square&logo=n8n&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4.6-7C3AED?style=flat-square)

---

## ✨ Features

- 🥕 **Ingredient input** — add ingredients with name, amount and unit
- 🤖 **AI recipe generation** — Claude Sonnet generates 3 personalized recipes via n8n
- 📖 **Public cookbook** — browse all saved recipes by cuisine style
- 💾 **Save to cookbook** — save your favourite generated recipes to Firestore
- 🔒 **Daily quota** — 3 free generations per IP per day (Firebase RTDB)
- 📱 **Fully responsive** — mobile-first design matching Figma prototype
- ⚡ **Zoneless Angular** — no Zone.js, pure signal-ready architecture
- 🚀 **Lazy-loaded routes** — feature components load on demand via `loadComponent()`
- 🖼 **WebP images** — `<picture>` elements with PNG fallback for hero, cookbook, and cuisine assets
- 🔍 **SEO & Open Graph** — per-page titles, descriptions, and Twitter/OG meta via `SeoService`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 · Standalone Components · SCSS |
| AI & Automation | n8n (Self-Hosted) · Anthropic Claude Sonnet 4.6 |
| Database | Firebase Firestore (recipes) · Firebase Realtime DB (quota) |
| HTTP | Angular HttpClient · Firebase JS SDK (modular v9+) |
| Hosting | cuisine.dimit.cc |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Angular CLI 21: `npm install -g @angular/cli`
- n8n running locally (Docker recommended): `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`
- Firebase project with Firestore + Realtime Database enabled

### Installation

```bash
git clone https://github.com/milosdimi/code-a-cuisine.git
cd code-a-cuisine
npm install
```

### Environment Setup

The Firebase config and n8n webhook URL are already set in `src/environments/environment.ts`.  
No changes needed for local development.

### n8n Workflow

1. Start n8n on `http://localhost:5678`
2. Go to **Workflows → Import from JSON**
3. Import `workflows/code-a-cuisine-workflow-(P1_+_Quota).json`
4. Add your **Anthropic API key** in n8n Credentials
5. Activate the workflow (toggle → green)

See [`workflows/README.md`](workflows/README.md) for full workflow documentation.

### Start Dev Server

```bash
ng serve
# → http://localhost:4200
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Recipe, Ingredient, Preferences interfaces
│   │   └── services/        # RecipeService, FirebaseService
│   ├── features/
│   │   ├── hero/            # Landing page
│   │   ├── generate/
│   │   │   ├── step1-ingredients/   # Ingredient input wizard
│   │   │   ├── step2-preferences/   # Cooking preferences
│   │   │   └── loading/             # Generation loading + error popup
│   │   ├── results/         # 3 generated recipe cards
│   │   ├── recipe-detail/   # Full recipe view
│   │   └── cookbook/        # Public recipe library by cuisine
│   └── shared/
│       ├── components/
│       │   ├── navbar/
│       │   ├── footer/
│       │   └── loading-spinner/    # Reusable spinner (Firebase loading states)
│       └── pipes/           # TruncatePipe
├── assets/
│   ├── fonts/               # Quicksand, Ubuntu
│   └── images/              # Hero visuals, recipe images, icons
└── styles/
    ├── _variables.scss      # Colors, typography, breakpoints
    ├── _mixins.scss
    └── _reset.scss
```

---

## 🔄 User Flow

```
/generate (Step 1: Ingredients)
    ↓
/preferences (Step 2: Cooking preferences)
    ↓
/loading → n8n → Claude AI → 3 recipes
    ↓
/results (Recipe cards + Save to Cookbook)
    ↓
/recipe/:id (Full recipe detail)

/cookbook → Browse by cuisine (Italian, German, Japanese, Indian, Gourmet, Fusion)
```

---

## 🔒 Quota System

Daily generation limits are enforced server-side in n8n using Firebase Realtime Database:

- **3 generations** per IP per day
- **12 generations** total per day (system-wide)
- IP stored as **djb2 hash** — no plain text IP stored
- Quota resets automatically at midnight (UTC date key)

---

## ⚠️ Error Handling

| Scenario | Popup message |
|---|---|
| Quota exceeded | "Daily limit reached" |
| No internet | "Connection failed" |
| Claude refused ingredient | "Ingredient not supported" |
| Generation failed | "Generation failed" |
| Insufficient ingredients | "Ups! Not quite enough..." |

---

## 🏗 Build

```bash
ng build
# Output: dist/code-a-cuisine/
```

### Performance notes

- **Route lazy loading** — all feature routes use `loadComponent()` in `app.routes.ts`
- **WebP assets** — run `npm run webp` to regenerate `.webp` files from key PNGs (`scripts/convert-webp.mjs`)
- **Image lazy loading** — below-fold decorative images use `loading="lazy"` and `decoding="async"`
- **SCSS budgets** — component style warning threshold is 12 kB (hero, step1, recipe-detail)

---

## 📄 License

MIT — built as part of the Developer Akademie Angular course.
