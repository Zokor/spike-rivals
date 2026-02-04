# Fix: Ball Not Being Hit by CPU and Player

## Problem
In [game-scene.ts:446-450](client/src/scenes/game-scene.ts#L446-L450), the `handlePlayerBallCollision` method blocks all hits in CPU mode because it requires players to be in a 30ms "active window":

```typescript
if (this.mode === 'cpu') {
  if (!this.isPlayerInActiveWindow(player)) return;  // BLOCKS HIT
  if (player.justHitBall) return;
  player.justHitBall = true;
}
```

**Root cause:** Physics overlap fires when ball touches player, but the action window check requires the player to have pressed action and be within a narrow 30ms timing window. These rarely align.

## Solution: Remove Action Window Blocking (CPU Mode Only)
Allow hits on physical contact in CPU mode by removing the active-window requirement. Keep the CPU-only double-hit guard, and add a distance-based reset for `justHitBall` when no action is active so hits can occur again once the ball moves away.

## Changes to [game-scene.ts](client/src/scenes/game-scene.ts)

### Replace lines 445-450
```typescript
// Remove this:
if (this.mode === 'cpu') {
  if (!this.isPlayerInActiveWindow(player)) return;
  if (player.justHitBall) return;
  player.justHitBall = true;
}

// Replace with:
if (this.mode === 'cpu') {
  if (player.justHitBall) return;
  player.justHitBall = true;
}
```

### Update updatePlayerActionState (lines 1064-1076)
Add distance-based reset for `justHitBall` when ball moves away:

```typescript
private updatePlayerActionState(player: PlayerObject, delta: number): void {
  if (player.actionState === 'none') {
    // Reset justHitBall when ball is far enough away
    if (player.justHitBall) {
      const dx = this.ball.x - player.sprite.x;
      const dy = this.ball.y - player.sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const playerRadius = Math.hypot(player.body.halfWidth, player.body.halfHeight);
      const clearanceRadius = PHYSICS.BALL_RADIUS + playerRadius;
      if (distance > clearanceRadius) {
        player.justHitBall = false;
      }
    }
    return;
  }

  player.actionTimerMs += delta;
  const timing = ACTION_TIMING[player.actionState];

  if (player.actionTimerMs >= timing.total) {
    player.actionState = 'none';
    player.actionTimerMs = 0;
    player.justHitBall = false;
  }
}
```

## File to Modify
- [client/src/scenes/game-scene.ts](client/src/scenes/game-scene.ts)

## Verification
1. Run `npm run dev` in client folder
2. Start a CPU match
3. Verify both player and CPU can hit the ball on contact
4. Test bumps (grounded) and spikes (in air)
5. (Optional) Quick match: ensure behavior unchanged outside CPU mode
