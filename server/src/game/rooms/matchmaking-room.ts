import { Room, Client } from 'colyseus';
import { Schema, type } from '@colyseus/schema';
import { MatchmakingService } from '../../services/matchmaking-service';

class MatchmakingState extends Schema {
  @type('number') playersInQueue = 0;
  @type('string') status = 'searching';
}

interface JoinOptions {
  userId: string;
  username: string;
  elo: number;
  characterId: string;
  mode: 'quick' | 'ranked';
}

export class MatchmakingRoom extends Room<MatchmakingState> {
  private matchCheckInterval?: Timer;
  private playerData: Map<string, JoinOptions> = new Map();

  onCreate(): void {
    this.setState(new MatchmakingState());
    this.autoDispose = false;

    // Periodically check for matches
    this.matchCheckInterval = setInterval(() => this.checkForMatches(), 2000);
  }

  async onJoin(client: Client, options: JoinOptions): Promise<void> {
    this.playerData.set(client.sessionId, options);

    // Add to matchmaking queue
    await MatchmakingService.addToQueue({
      odys: options.userId,
      sessionId: client.sessionId,
      elo: options.elo,
      characterId: options.characterId,
      joinedAt: Date.now(),
    });

    // Update queue size
    this.state.playersInQueue = await MatchmakingService.getQueueSize();

    // Send queue status to client
    client.send('queue_status', {
      position: this.state.playersInQueue,
      estimatedWait: this.estimateWaitTime(options.elo),
    });
  }

  async onLeave(client: Client): Promise<void> {
    await MatchmakingService.removeFromQueue(client.sessionId);
    this.playerData.delete(client.sessionId);
    this.state.playersInQueue = await MatchmakingService.getQueueSize();
  }

  onDispose(): void {
    if (this.matchCheckInterval) {
      clearInterval(this.matchCheckInterval);
    }
  }

  private async checkForMatches(): Promise<void> {
    const stats = await MatchmakingService.getQueueStats();
    this.state.playersInQueue = stats.size;

    // Process each player in the room
    for (const [sessionId, playerData] of this.playerData) {
      const client = this.clients.find((c) => c.sessionId === sessionId);
      if (!client) continue;

      const match = await MatchmakingService.findMatch({
        odys: playerData.userId,
        sessionId,
        elo: playerData.elo,
        characterId: playerData.characterId,
        joinedAt: Date.now() - 10000, // Assume they've been waiting at least 10s for matching purposes
      });

      if (match) {
        // Found a match! Create game room
        const matchedClient = this.clients.find((c) => c.sessionId === match.sessionId);

        if (matchedClient) {
          const roomId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Notify both players
          client.send('match_found', {
            roomId,
            opponent: {
              username: this.playerData.get(match.sessionId)?.username || 'Opponent',
              elo: match.elo,
              characterId: match.characterId,
            },
          });

          matchedClient.send('match_found', {
            roomId,
            opponent: {
              username: playerData.username,
              elo: playerData.elo,
              characterId: playerData.characterId,
            },
          });

          // Remove both from queue
          await Promise.all([
            MatchmakingService.removeFromQueue(sessionId),
            MatchmakingService.removeFromQueue(match.sessionId),
          ]);

          this.playerData.delete(sessionId);
          this.playerData.delete(match.sessionId);

          // Disconnect clients so they can join game room
          client.leave();
          matchedClient.leave();
        }
      }
    }
  }

  private estimateWaitTime(elo: number): number {
    // Estimate based on queue size and ELO
    // More players = shorter wait, extreme ELO = longer wait
    const baseWait = 30; // seconds
    const queueFactor = Math.max(1, this.state.playersInQueue);
    const eloDeviation = Math.abs(elo - 1000) / 500;

    return Math.round(baseWait / queueFactor + eloDeviation * 10);
  }
}
