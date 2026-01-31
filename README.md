# Spike Rivals

Competitive 2D volleyball game inspired by Arcade Volleyball (1987).

---

## Tech Stack

- **Client:** Phaser 3 + TypeScript + Vite
- **Server:** Bun + Elysia (REST) + Colyseus (WebSocket)
- **Database:** PostgreSQL + Drizzle ORM
- **Cache:** Redis

---

## Prerequisites

- [Bun](https://bun.sh/) v1.1+
- [Docker](https://www.docker.com/) (for PostgreSQL and Redis)

---

## Quick Start

### 1. Install dependencies

```bash
bun install
```

### 2. Start databases

```bash
docker-compose up -d
```

### 3. Configure environment

```bash
cp server/.env.example server/.env
```

### 4. Build shared package

```bash
bun run build:shared
```

### 5. Run database migrations

```bash
cd server
bun run db:generate
bun run db:migrate
```

### 6. Start development servers

```bash
# From root directory - starts both client and server
bun run dev

# Or run separately:
bun run dev:client  # http://localhost:3000
bun run dev:server  # REST: http://localhost:3001, WS: ws://localhost:2567
```

---

## Project Structure

```
spike-rivals/
├── client/                # Phaser 3 game client
│   ├── src/
│   │   ├── scenes/        # Boot, Menu, Game scenes
│   │   └── main.ts        # Entry point
│   └── index.html
│
├── server/                # Bun backend
│   ├── src/
│   │   ├── api/           # Elysia REST routes
│   │   │   └── routes/    # auth, user endpoints
│   │   ├── game/          # Colyseus game server
│   │   │   ├── rooms/     # GameRoom
│   │   │   └── schema/    # GameState, Player, Ball
│   │   └── db/            # Drizzle schema
│   └── drizzle.config.ts
│
├── shared/                # Shared code (used by client & server)
│   └── src/
│       ├── constants.ts   # Physics, ranking, shop constants
│       ├── types/         # TypeScript interfaces
│       └── physics/       # Physics calculations
│
├── docker-compose.yml     # PostgreSQL + Redis
└── package.json           # Workspace root
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start client and server in development |
| `bun run dev:client` | Start only the client |
| `bun run dev:server` | Start only the server |
| `bun run build` | Build all packages for production |
| `bun run build:shared` | Build shared package |
| `bun run typecheck` | Type-check all packages |
| `bun run clean` | Remove all node_modules |

---

## Game Modes

- **VS CPU** - Play against AI (4 difficulty levels)
- **Quick Match** - Unranked online matches
- **Ranked** - ELO-based competitive play
- **Private** - Room codes for friends

---

## AI Context Files

| File | Purpose |
|------|---------|
| `CONTEXT.md` | Full project context for Claude |
| `docs/PROMPTS.md` | Detailed implementation prompts |

---

## Documentation

- [CONTEXT.md](./CONTEXT.md) - Project overview and architecture
- [docs/PROMPTS.md](./docs/PROMPTS.md) - Implementation prompts

---

## License

MIT
