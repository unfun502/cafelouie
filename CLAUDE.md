# cafelouie

## What It Does
Café LOUIE is an interactive community question viewer for the Reach of Louisville organization (2026 edition). It displays 117 curated questions from community members to elected officials across 6 Louisville library branches, with full-text search and multi-filter capabilities.

## Tech Stack
- **Frontend:** React 18 + Vite (JSX, no TypeScript)
- **Hosting:** Cloudflare Workers (Workers Sites via `@cloudflare/kv-asset-handler`)
- **CI/CD:** GitHub Actions → Cloudflare Workers
- **Fonts:** Google Fonts (Anton, Caveat) via `index.html`
- **No backend, no database** — all 117 questions are hardcoded in the component

## Domain
`cafelouie.devlab502.net`

## Repository
`github.com/unfun502/cafelouie`

## Project Structure
```
cafelouie/
├── index.html               Vite entry + Google Fonts link
├── src/
│   ├── main.jsx             React 18 createRoot entry
│   ├── App.jsx              Thin wrapper
│   └── components/
│       └── CafeLouieCard.jsx  Main app (all data + UI)
├── public/
│   └── _headers             Security headers
├── worker/
│   └── index.js             Cloudflare Worker (static assets + SPA fallback)
├── wrangler.toml
└── .github/workflows/deploy.yml
```

## Build & Deploy
```bash
npm install
npm run dev       # localhost:5173
npm run build     # dist/
```
Push to `main` → GitHub Actions auto-deploys via Cloudflare Workers.

## Design System
- Paper-textured card aesthetic with warm color palette
- Branch colors: Western #5b7e5f, Crescent Hill #5a7599, Fairdale #8b6d42, Iroqouis #7b5882, Middletown #b37040, Fern Creek #3e8a7a
- Typography: Anton (headers), Caveat (handwriting), Georgia (body)
- LOUIE logo: base64-encoded PNG embedded in component

## Data
117 questions in `ALL_QUESTIONS` array in `CafeLouieCard.jsx`. Topics: Immigration, Healthcare, Education, Housing, Public Safety, Library Funding, etc.
