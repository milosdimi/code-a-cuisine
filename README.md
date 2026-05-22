# Code-à-Cuisine

KI-gestützter Rezeptgenerator – Angular 21 | n8n | Firebase | Claude AI

## Features
- Zutaten eingeben → 3 Rezeptvorschläge via Claude AI (n8n Workflow)
- Rezepte in Firebase Firestore gespeichert
- Öffentliche Rezeptbibliothek (Kochbuch)
- Quota-System (3 Generierungen pro Tag / IP)

## Tech Stack
- **Frontend:** Angular 21 (Standalone Components)
- **Automatisierung:** n8n Cloud + Anthropic Claude API
- **Datenbank:** Firebase Firestore + Realtime DB
- **Hosting:** cuisine.dimit.cc

## Development

```bash
npm install
ng serve
```

## Build

```bash
ng build
```

## Projektstruktur

```
src/app/
├── core/         # Services & Models
├── features/     # Pages (Hero, Generate, Results, Cookbook ...)
└── shared/       # Navbar, Footer, Pipes
```
