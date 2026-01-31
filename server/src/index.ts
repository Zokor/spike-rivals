import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';

import { env, validateEnv } from './config';
import { authRoutes, userRoutes, rankingRoutes, shopRoutes, matchesRoutes } from './api/routes';
import { rateLimit } from './api/middleware';
import { GameRoom, MatchmakingRoom } from './game/rooms';
import { RedisClient } from './services';

// Validate environment
validateEnv();

// Create HTTP server for Colyseus
const httpServer = createServer();

// Initialize Colyseus game server
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

// Register game rooms
gameServer.define('game', GameRoom);
gameServer.define('quick_match', GameRoom);
gameServer.define('ranked', MatchmakingRoom);
gameServer.define('private', GameRoom).enableRealtimeListing();

// Initialize Elysia REST API
const app = new Elysia()
  .use(cors())
  .use(rateLimit({ windowMs: 60000, maxRequests: 100 }))
  .get('/', () => ({
    name: 'Spike Rivals API',
    version: '0.1.0',
    status: 'running',
  }))
  .get('/health', async () => {
    const onlineCount = await RedisClient.getOnlineCount().catch(() => 0);
    return {
      status: 'ok',
      timestamp: Date.now(),
      onlinePlayers: onlineCount,
    };
  })
  .use(authRoutes)
  .use(userRoutes)
  .use(rankingRoutes)
  .use(shopRoutes)
  .use(matchesRoutes)
  .listen(env.PORT);

// Start servers
async function start() {
  try {
    // Connect to Redis
    await RedisClient.connect();

    // Start Colyseus server
    httpServer.listen(env.WS_PORT, () => {
      console.log(`🏐 Spike Rivals Server`);
      console.log(`   REST API: http://localhost:${env.PORT}`);
      console.log(`   Game Server: ws://localhost:${env.WS_PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await RedisClient.disconnect();
  gameServer.gracefullyShutdown();
  process.exit(0);
});

export { app, gameServer };
