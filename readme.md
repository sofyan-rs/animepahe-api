# Animepahe API

An unofficial API for [Animepahe](https://animepahe.pw/) that provides anime metadata, releases, stream sources, and direct download links.

## Stack

- TypeScript
- Bun runtime
- Hono HTTP server
- Playwright / playwright-core
- cloudscraper + axios
- Redis (optional for cache + rate limits)

## Features

- Airing anime feed
- Search + anime list browsing
- Anime details + releases
- Streaming links with multiple sources/resolutions
- Optional direct download extraction
- Optional Redis cache
- Optional Redis-backed rate limiting

## Quick Start

```bash
git clone https://github.com/sofyan-rs/animepahe-api.git
cd animepahe-api
bun install
bunx playwright install
cp .env.example .env
```

### Run

```bash
# Development (watch mode)
bun run dev

# Production
bun run start
```

## Environment Variables

```env
PORT=3000
BASE_URL=https://animepahe.pw
USER_AGENT=
COOKIES=
USE_PROXY=false
IFRAME_BASE_URL=kwik.cx
PROXIES=
REDIS_URL=
ALLOWED_ORIGINS=*
RATE_LIMIT_SECRET=
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900
```

### CORS

`ALLOWED_ORIGINS` supports:

- `*` (default)
- single origin: `http://localhost:5173`
- comma-separated list: `http://localhost:5173,https://myapp.com`

### Redis Cache

When `REDIS_URL` is set, cache is enabled. Current defaults:

- `/api/airing`: 30s
- `/api/search`: 120s
- `/api/queue`: 30s
- `/api/anime*`: 5h (`18000s`)
- `/api/:id*` anime info routes: 1 day
- `/api/play*`: 1h (`3600s`)

Without `REDIS_URL`, API still works (no cache).

### Rate Limiting

Rate limiting activates only when **both** are present:

- `RATE_LIMIT_SECRET`
- `REDIS_URL`

Headers returned on active rate limiting:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## API Endpoints

### Airing

```http
GET /api/airing
GET /api/airing?page=2
```

### Search

```http
GET /api/search?q=one piece
GET /api/search?q=one piece&page=2
```

### Anime List

```http
GET /api/anime
GET /api/anime?tab=A
GET /api/anime/:tag1/:tag2
GET /api/anime/:tag1/:tag2?tab=hash
```

### Anime Info + Releases

```http
GET /api/:session
GET /api/:session/releases?sort=episode_desc&page=1
```

### Stream + Download

```http
GET /api/play/:session?episodeId=episode-session-id
GET /api/play/:session?episodeId=episode-session-id&downloads=false
GET /api/play/download-links?url=https://pahe.win/XYZ
```

### Queue

```http
GET /api/queue
```

### Test Utilities (debug routes)

```http
GET /api/kwik-test?url=...
GET /api/downlod-test?url=...
GET /api/test
```

## Error Format

```json
{
  "status": 503,
  "message": "Request failed"
}
```

## Disclaimer

This project is unofficial and not affiliated with Animepahe.