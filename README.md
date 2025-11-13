# OSRS Ultimate Ironman Leaderboard Tracker

Monitors the OSRS Ultimate Ironman leaderboard and tracks XP changes for top 50 players.

## Tech Stack

- TypeScript/Node.js
- SQLite (better-sqlite3)
- Express
- Jest

## Setup

```bash
npm install
npm test
npm run dev
```

## API

- `GET /api/players` - All active players (top 50)
- `GET /api/players/:name` - Player details
- `GET /api/players/:name/history?limit=100` - XP history

## Configuration

Environment variables:
- `PORT` - API port (default: 3000)
- `UPDATE_INTERVAL` - Update frequency in minutes (default: 5)
- `DB_PATH` - Database location (optional - defaults to ./data/leaderboard.db)

## Implementation Notes

### Data Source

Uses OSRS hiscores JSON API (`/ranking.json?table=0&category=0&size=50`)

### Database

Two tables (`players`, `xp_history`) with proper indexing

### Tracking Logic
- Players are tracked only while in top 50
- XP history recorded on changes
- firstSeen preserved across updates

