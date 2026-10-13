# Luva Events

Luma-inspired events platform MVP — discover, create, RSVP, approve guests, calendars, and bilingual UI (中文 / English).

## Stack

- Next.js 15 (App Router) + TypeScript
- File-based store (`data/store.json`)
- Local image uploads (`public/uploads`)
- Cookie session auth (scrypt password hash)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start production server |

## Notes

- Runtime data in `data/store.json` is gitignored
- Uploaded covers in `public/uploads/` are gitignored (except `.gitkeep`)
- Locale cookie / browser `Accept-Language` via middleware
