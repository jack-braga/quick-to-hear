# Quick to Hear

A free, static, account-less **browser workbook for preparing a Bible study** — from a
passage reference to two printable documents (a participant handout and leader's notes).
It **structures, prompts, and checks; it never writes your content.** Everything runs in
your browser; nothing is sent to a server.

- **Live:** https://jack-braga.github.io/quick-to-hear/
- **Why it exists:** enforce disciplines paper can't, and recycle your earlier input
  forward into later phases.

## Status

Early build. See **[`docs/PROGRESS.md`](docs/PROGRESS.md)** for exactly where things are.
The build advances one stage at a time (`docs/PLAN.md` §6); Stage 0 (this scaffold:
app shell, theming, deploy) is the first.

## Develop

Requires Node 20+.

```bash
npm install
npm run dev          # dev server (Vite)
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # eslint
npm test             # vitest (jsdom)
npm run build        # production build
npm run preview      # serve the built app under /quick-to-hear/
npm run test:e2e     # Playwright smoke (builds + previews first)
```

`npm run typecheck && npm run lint && npm test && npm run build` is the per-stage
acceptance gate.

## Stack

React 18 + Vite + TypeScript (strict) · Tailwind + shadcn/ui · Zustand · `react-router-dom`
(HashRouter) · `vite-plugin-pwa` · Vitest (jsdom) + Playwright · GitHub Pages. Locked
decisions and rationale live in **[`docs/PLAN.md`](docs/PLAN.md)** §2.

## Documentation

- **[`docs/PROGRESS.md`](docs/PROGRESS.md)** — where the build is + how to resume (read first).
- **[`docs/PLAN.md`](docs/PLAN.md)** — locked tech decisions, architecture, staged build order.
- **[`docs/SPEC.md`](docs/SPEC.md)** — the authoritative behaviour spec (the seven phases).
- **[`docs/TEACHING-TEXT.md`](docs/TEACHING-TEXT.md)** — inventory of guidance/help text.
- **[`CLAUDE.md`](CLAUDE.md)** — working agreement and inviolable rules.

## Licensing

- Application code (`/`) — **MIT** (`LICENSE`).
- Help prose + method data (`/content`) — **CC BY-SA** (`content/LICENSE`).
- Bundled Bible text — **public domain / CC0 only** (WEBBE, ASV, BSB). Other translations
  are user-supplied at runtime and never committed.
- COMA question sets are reproduced by permission; Matthias Media / Holy Trinity Church
  attribution renders wherever COMA content appears.
