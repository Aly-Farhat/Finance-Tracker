# Finance Tracker

Personal finance tracking monorepo: React/Vite frontend (port 3000), Express/TypeScript backend (port 5000), SQLite database.

## Cursor Cloud specific instructions

### Services

| Service | Directory | Dev command | Port |
|---------|-----------|-------------|------|
| Frontend | `frontend/` | `npm run dev` (Vite) | 3000 |
| Backend | `backend/` | `npm run dev` (tsx watch) | 5000 |

Run both together from root: `npm run dev` (uses `concurrently`).

### Key notes

- **Database**: SQLite via `better-sqlite3`. The file `backend/finance.db` is auto-created on first backend start with migrations applied automatically. No external DB setup needed.
- **No external services**: Fully self-contained — no Docker, no external APIs, no auth providers.
- **Vite proxy**: Frontend proxies `/api` requests to `http://localhost:5000` (configured in `frontend/vite.config.ts`).
- **Lint**: `cd frontend && npm run lint` — the existing codebase has 3 pre-existing ESLint errors (unused imports) and 6 warnings (missing deps in useEffect). These are not introduced by your changes.
- **TypeScript**: `npx tsc --noEmit` in both `frontend/` and `backend/` for type-checking.
- **Electron app** (`electron-app/`): Optional desktop wrapper. Not needed for web development.
- **`better-sqlite3`** is a native module compiled during `npm install`. If Node.js major version changes, you may need to `rm -rf backend/node_modules && cd backend && npm install` to recompile.
