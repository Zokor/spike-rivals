import { eq, desc, sql, and, gte, lte, or } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  userInventory,
  matches,
  skins,
  characters,
  transactions,
  battlePass,
  battlePassRewards,
  dailyChallenges,
  type User,
  type NewUser,
  type Skin,
  type Match,
  type BattlePass,
  type DailyChallenge,
} from './schema';

// ============================================================================
// User queries
// ============================================================================

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function createUser(data: {
  username: string;
  passwordHash: string;
  email?: string;
}): Promise<User> {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUserElo(userId: string, eloChange: number): Promise<void> {
  // Also update rank tier based on new ELO
  const user = await getUserById(userId);
  if (!user) return;

  const newElo = Math.max(0, user.elo + eloChange);
  const newTier = getRankTierFromElo(newElo);

  await db
    .update(users)
    .set({
      elo: newElo,
      rankTier: newTier,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserStats(
  userId: string,
  isWin: boolean,
  coinsEarned: number
): Promise<void> {
  const user = await getUserById(userId);
  if (!user) return;

  const newWinStreak = isWin ? user.winStreak + 1 : 0;
  const newBestWinStreak = Math.max(user.bestWinStreak, newWinStreak);

  await db
    .update(users)
    .set({
      gamesPlayed: sql`${users.gamesPlayed} + 1`,
      wins: isWin ? sql`${users.wins} + 1` : users.wins,
      losses: !isWin ? sql`${users.losses} + 1` : users.losses,
      coins: sql`${users.coins} + ${coinsEarned}`,
      winStreak: newWinStreak,
      bestWinStreak: newBestWinStreak,
      lastMatchAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserCurrency(
  userId: string,
  coins: number,
  gems: number
): Promise<void> {
  await db
    .update(users)
    .set({
      coins: sql`${users.coins} + ${coins}`,
      gems: sql`${users.gems} + ${gems}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function updateUserSelectedItems(
  userId: string,
  data: {
    selectedCharacter?: string;
    selectedBall?: string;
    selectedCourt?: string;
  }
): Promise<void> {
  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ============================================================================
// Inventory queries
// ============================================================================

export async function getUserInventory(userId: string) {
  return db
    .select({
      id: userInventory.id,
      skinId: userInventory.skinId,
      equippedAs: userInventory.equippedAs,
      acquiredAt: userInventory.acquiredAt,
      skin: skins,
    })
    .from(userInventory)
    .leftJoin(skins, eq(userInventory.skinId, skins.id))
    .where(eq(userInventory.userId, userId));
}

export async function addItemToInventory(
  userId: string,
  skinId: string
): Promise<{ id: string } | null> {
  try {
    const result = await db
      .insert(userInventory)
      .values({ userId, skinId })
      .returning({ id: userInventory.id });
    return result[0];
  } catch {
    // Likely duplicate entry
    return null;
  }
}

export async function userOwnsItem(userId: string, skinId: string): Promise<boolean> {
  const result = await db
    .select({ id: userInventory.id })
    .from(userInventory)
    .where(and(eq(userInventory.userId, userId), eq(userInventory.skinId, skinId)))
    .limit(1);
  return result.length > 0;
}

export async function equipItem(
  userId: string,
  skinId: string,
  slot: 'character' | 'ball' | 'court'
): Promise<boolean> {
  // First unequip any item in this slot
  await db
    .update(userInventory)
    .set({ equippedAs: null })
    .where(and(eq(userInventory.userId, userId), eq(userInventory.equippedAs, slot)));

  // Then equip the new item
  const result = await db
    .update(userInventory)
    .set({ equippedAs: slot })
    .where(and(eq(userInventory.userId, userId), eq(userInventory.skinId, skinId)))
    .returning({ id: userInventory.id });

  return result.length > 0;
}

export async function getEquippedItems(userId: string) {
  return db
    .select({
      skinId: userInventory.skinId,
      equippedAs: userInventory.equippedAs,
      skin: skins,
    })
    .from(userInventory)
    .leftJoin(skins, eq(userInventory.skinId, skins.id))
    .where(and(eq(userInventory.userId, userId), sql`${userInventory.equippedAs} IS NOT NULL`));
}

// Legacy aliases
export const getUserItems = getUserInventory;
export const addItemToUser = async (userId: string, itemId: string, _itemType: string) =>
  addItemToInventory(userId, itemId);

// ============================================================================
// Shop/Skins queries
// ============================================================================

export async function getActiveSkins(filters?: {
  itemType?: string;
  rarity?: string;
  limit?: number;
  offset?: number;
}): Promise<Skin[]> {
  let query = db.select().from(skins).where(eq(skins.isActive, true)).$dynamic();

  if (filters?.itemType) {
    query = query.where(eq(skins.itemType, filters.itemType));
  }
  if (filters?.rarity) {
    query = query.where(eq(skins.rarity, filters.rarity));
  }

  query = query.limit(filters?.limit || 50).offset(filters?.offset || 0);

  return query;
}

export async function getSkinById(id: string): Promise<Skin | null> {
  const result = await db.select().from(skins).where(eq(skins.id, id)).limit(1);
  return result[0] || null;
}

export async function getFeaturedSkins(limit = 6): Promise<Skin[]> {
  // Return epic and legendary skins as featured
  return db
    .select()
    .from(skins)
    .where(and(eq(skins.isActive, true), or(eq(skins.rarity, 'epic'), eq(skins.rarity, 'legendary'))))
    .limit(limit);
}

// Legacy aliases
export const getActiveShopItems = () => getActiveSkins();
export const getShopItemById = getSkinById;

// ============================================================================
// Character queries
// ============================================================================

export async function getAllCharacters() {
  return db.select().from(characters);
}

export async function getCharacterById(id: string) {
  const result = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
  return result[0] || null;
}

export async function getDefaultCharacters() {
  return db.select().from(characters).where(eq(characters.isDefault, true));
}

// ============================================================================
// Match queries
// ============================================================================

export async function createMatch(data: {
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  mode: string;
  duration: number;
  winnerEloChange: number;
  loserEloChange: number;
  winnerElo?: number;
  loserElo?: number;
  isRanked?: boolean;
  replayData?: unknown;
}): Promise<Match> {
  const result = await db.insert(matches).values(data).returning();
  return result[0];
}

export async function getUserMatches(userId: string, limit = 10): Promise<Match[]> {
  return db
    .select()
    .from(matches)
    .where(or(eq(matches.winnerId, userId), eq(matches.loserId, userId)))
    .orderBy(desc(matches.playedAt))
    .limit(limit);
}

export async function getMatchById(id: string): Promise<Match | null> {
  const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  return result[0] || null;
}

// ============================================================================
// Leaderboard queries
// ============================================================================

export async function getLeaderboard(limit = 100, offset = 0) {
  return db
    .select({
      id: users.id,
      username: users.username,
      elo: users.elo,
      rankTier: users.rankTier,
      wins: users.wins,
      losses: users.losses,
      gamesPlayed: users.gamesPlayed,
      winStreak: users.winStreak,
      bestWinStreak: users.bestWinStreak,
    })
    .from(users)
    .orderBy(desc(users.elo))
    .limit(limit)
    .offset(offset);
}

export async function getUserRank(userId: string): Promise<number> {
  const user = await getUserById(userId);
  if (!user) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.elo} > ${user.elo}`);

  return (result[0]?.count || 0) + 1;
}

export async function getNearbyPlayers(userId: string, range = 5) {
  const userRank = await getUserRank(userId);
  const offset = Math.max(0, userRank - range - 1);

  return db
    .select({
      id: users.id,
      username: users.username,
      elo: users.elo,
      rankTier: users.rankTier,
      wins: users.wins,
      losses: users.losses,
    })
    .from(users)
    .orderBy(desc(users.elo))
    .limit(range * 2 + 1)
    .offset(offset);
}

// ============================================================================
// Transaction queries
// ============================================================================

export async function createTransaction(data: {
  userId: string;
  type: string;
  itemType?: string;
  itemId?: string;
  amount: number;
  currencyType: string;
  metadata?: unknown;
}): Promise<{ id: string }> {
  const result = await db.insert(transactions).values(data).returning({ id: transactions.id });
  return result[0];
}

export async function getUserTransactions(userId: string, limit = 50) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

// ============================================================================
// Battle Pass queries
// ============================================================================

export async function getUserBattlePass(
  userId: string,
  season: number
): Promise<BattlePass | null> {
  const result = await db
    .select()
    .from(battlePass)
    .where(and(eq(battlePass.userId, userId), eq(battlePass.season, season)))
    .limit(1);
  return result[0] || null;
}

export async function createUserBattlePass(userId: string, season: number): Promise<BattlePass> {
  const result = await db.insert(battlePass).values({ userId, season }).returning();
  return result[0];
}

export async function addBattlePassXP(
  userId: string,
  season: number,
  xpAmount: number
): Promise<{ newTier: number; leveledUp: boolean }> {
  const bp = await getUserBattlePass(userId, season);
  if (!bp) {
    await createUserBattlePass(userId, season);
    return addBattlePassXP(userId, season, xpAmount);
  }

  const XP_PER_TIER = 1000;
  const newXP = bp.xp + xpAmount;
  const newTier = Math.floor(newXP / XP_PER_TIER);
  const leveledUp = newTier > bp.currentTier;

  await db
    .update(battlePass)
    .set({
      xp: newXP,
      currentTier: newTier,
      updatedAt: new Date(),
    })
    .where(eq(battlePass.id, bp.id));

  return { newTier, leveledUp };
}

export async function upgradeToPremiumBattlePass(userId: string, season: number): Promise<boolean> {
  const result = await db
    .update(battlePass)
    .set({
      isPremium: true,
      purchasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(battlePass.userId, userId), eq(battlePass.season, season)))
    .returning({ id: battlePass.id });

  return result.length > 0;
}

export async function claimBattlePassReward(
  userId: string,
  season: number,
  tier: number,
  isPremium: boolean
): Promise<boolean> {
  const bp = await getUserBattlePass(userId, season);
  if (!bp) return false;

  // Check if already claimed
  const claimedTiers = isPremium ? bp.claimedPremiumTiers : bp.claimedFreeTiers;
  if (claimedTiers?.includes(tier)) return false;

  // Check if tier is unlocked
  if (bp.currentTier < tier) return false;

  // Check if premium required
  if (isPremium && !bp.isPremium) return false;

  // Add to claimed list
  const newClaimedTiers = [...(claimedTiers || []), tier];

  if (isPremium) {
    await db
      .update(battlePass)
      .set({ claimedPremiumTiers: newClaimedTiers, updatedAt: new Date() })
      .where(eq(battlePass.id, bp.id));
  } else {
    await db
      .update(battlePass)
      .set({ claimedFreeTiers: newClaimedTiers, updatedAt: new Date() })
      .where(eq(battlePass.id, bp.id));
  }

  return true;
}

export async function getBattlePassRewards(season: number) {
  return db
    .select()
    .from(battlePassRewards)
    .where(eq(battlePassRewards.season, season))
    .orderBy(battlePassRewards.tier);
}

// ============================================================================
// Daily Challenges queries
// ============================================================================

export async function getUserDailyChallenges(
  userId: string,
  date: Date
): Promise<DailyChallenge[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(dailyChallenges)
    .where(
      and(
        eq(dailyChallenges.userId, userId),
        gte(dailyChallenges.validDate, startOfDay),
        lte(dailyChallenges.validDate, endOfDay)
      )
    );
}

export async function createDailyChallenge(data: {
  userId: string;
  challengeType: string;
  targetValue: number;
  rewardType: string;
  rewardAmount: number;
  validDate: Date;
}): Promise<DailyChallenge> {
  const result = await db.insert(dailyChallenges).values(data).returning();
  return result[0];
}

export async function updateChallengeProgress(
  challengeId: string,
  progressAmount: number
): Promise<boolean> {
  const challenge = await db
    .select()
    .from(dailyChallenges)
    .where(eq(dailyChallenges.id, challengeId))
    .limit(1);

  if (!challenge[0] || challenge[0].isCompleted) return false;

  const newValue = challenge[0].currentValue + progressAmount;
  const isCompleted = newValue >= challenge[0].targetValue;

  await db
    .update(dailyChallenges)
    .set({
      currentValue: newValue,
      isCompleted,
    })
    .where(eq(dailyChallenges.id, challengeId));

  return isCompleted;
}

export async function claimChallengeReward(challengeId: string): Promise<boolean> {
  const result = await db
    .update(dailyChallenges)
    .set({ isClaimed: true })
    .where(
      and(
        eq(dailyChallenges.id, challengeId),
        eq(dailyChallenges.isCompleted, true),
        eq(dailyChallenges.isClaimed, false)
      )
    )
    .returning({ id: dailyChallenges.id });

  return result.length > 0;
}

// ============================================================================
// Helper functions
// ============================================================================

function getRankTierFromElo(elo: number): string {
  if (elo >= 2400) return 'CHAMPION';
  if (elo >= 2000) return 'DIAMOND';
  if (elo >= 1600) return 'PLATINUM';
  if (elo >= 1200) return 'GOLD';
  if (elo >= 800) return 'SILVER';
  if (elo >= 400) return 'BRONZE';
  return 'ROOKIE';
}
