# Sleep Tracker — Amelia

Baby sleep tracker for Amelia. Records sleep periods (night blocks + naps) per day, shows a 24h timeline chart.

## Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Frontend | React 18 + Vite, plain JSX (no TS yet)    |
| Backend  | Node.js + Express, **TypeScript** (strict)|
| Database | PostgreSQL (`sleep_tracker` DB)           |
| Fonts    | DM Sans + DM Mono (Google Fonts)          |

## Architecture

```
sleep-tracker/
├── client/                  # React app (Vite, port 5173)
│   └── src/
│       ├── api.js           # fetch wrappers for all API calls
│       ├── utils.js         # time helpers (toMin, fmtH, dur, inPeriod, calcTotals)
│       ├── App.jsx          # root: tab switching (Datos / Gráfico), loads days on mount
│       └── components/
│           ├── DataPanel.jsx    # day selector, add/delete day, renders period sections
│           ├── PeriodCard.jsx   # single period form (times + toma/cuna toggles), PATCHes on change
│           ├── RefBar.jsx       # summary pills (nocturno / siestas / total / tomas)
│           ├── ChartPanel.jsx   # 24h SVG timeline, 1440 slots (1/min), built with raw SVG
│           └── NewDayModal.jsx  # dd/mm picker modal for creating a new day
│
└── server/                  # Express API (ts-node-dev, port 3001)
    └── src/
        ├── index.ts         # entry point — starts server
        ├── app.ts           # express setup + route mounting
        ├── db.ts            # pg Pool (database: sleep_tracker, default host/port/user)
        ├── types.ts         # Period, Day, DayRow, PeriodRow interfaces + rowToPeriod()
        └── routes/
            ├── days.ts      # GET/POST/DELETE /api/days
            └── periods.ts   # POST/PATCH/DELETE /api/days/:dayId/periods/:periodId
```

## Database Schema

```sql
days    (id SERIAL PK, date VARCHAR(5) UNIQUE)          -- date format: "dd/mm"
periods (id SERIAL PK, day_id FK, period_id VARCHAR(4), -- e.g. N1, S2
         type VARCHAR(10), enter/sleep/wake/exit VARCHAR(5),
         toma CHAR(1), cuna_flag CHAR(1), sort_order INT)
```

Period IDs (N1, N2… / S1, S2…) are re-sequenced on delete.

## API

```
GET    /api/days
POST   /api/days                          { date: "dd/mm" }
DELETE /api/days/:id
POST   /api/days/:dayId/periods           Period + sort_order
PATCH  /api/days/:dayId/periods/:periodId Partial<Period>
DELETE /api/days/:dayId/periods/:periodId
```

Vite proxies `/api` → `http://localhost:3001` in dev.

## Running

```bash
# Backend
cd server && npm run dev      # ts-node-dev with hot reload

# Frontend
cd client && npm run dev      # Vite HMR on port 5173
```

## Key Conventions

- All changes are persisted immediately (no save button) — `PeriodCard` PATCHes on every field change
- Chart uses 1440 slots (1 per minute) starting at 19:00, wrapping midnight
- Period times are `HH:MM` strings; empty string means unset
- `cunaFlag` only exists on siesta periods (`S` = in crib, `N` = outside)
- Frontend is JSX (not TSX yet) — migrate to TypeScript when touching client code
- Server uses strict TypeScript — no `any`, all DB rows typed via interfaces in `types.ts`
