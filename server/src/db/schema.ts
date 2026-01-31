import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Rank tier type
export type RankTier =
  | 'ROOKIE'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'DIAMOND'
  | 'CHAMPION';

// Currency type
export type CurrencyType = 'coins' | 'gems' | 'real';

// Transaction type
export type TransactionType = 'purchase' | 'reward' | 'refund' | 'match_reward' | 'daily_bonus';

// Item types
export type ItemType = 'character_skin' | 'ball_skin' | 'court' | 'character' | 'emote' | 'effect';

// Rarity types
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique(),
    username: varchar('username', { length: 20 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),

    // Ranking
    elo: integer('elo').notNull().default(1000),
    rankTier: varchar('rank_tier', { length: 20 }).notNull().default('ROOKIE'),

    // Stats
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    gamesPlayed: integer('games_played').notNull().default(0),
    winStreak: integer('win_streak').notNull().default(0),
    bestWinStreak: integer('best_win_streak').notNull().default(0),

    // Currency
    coins: integer('coins').notNull().default(1000),
    gems: integer('gems').notNull().default(0),

    // Selected items
    selectedCharacter: varchar('selected_character', { length: 50 }).notNull().default('nova'),
    selectedBall: varchar('selected_ball', { length: 50 }).notNull().default('default'),
    selectedCourt: varchar('selected_court', { length: 50 }).notNull().default('sunset_beach'),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at'),
    lastMatchAt: timestamp('last_match_at'),
  },
  (table) => [
    index('users_elo_idx').on(table.elo),
    index('users_rank_tier_idx').on(table.rankTier),
    index('users_wins_idx').on(table.wins),
    uniqueIndex('users_email_idx').on(table.email),
    uniqueIndex('users_username_idx').on(table.username),
  ]
);

// Characters table (base character definitions)
export const characters = pgTable('characters', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),

  // Attributes (1-8 scale, total of 20 points)
  speed: integer('speed').notNull(),
  jump: integer('jump').notNull(),
  power: integer('power').notNull(),
  control: integer('control').notNull(),

  // Unlock requirements
  rarity: varchar('rarity', { length: 20 }).notNull().default('common'),
  unlockCost: integer('unlock_cost').notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
});

// Skins table (cosmetic items)
export const skins = pgTable(
  'skins',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),

    // Type and association
    itemType: varchar('item_type', { length: 30 }).notNull(), // character_skin, ball_skin, court
    characterId: varchar('character_id', { length: 50 }).references(() => characters.id),

    // Rarity and pricing
    rarity: varchar('rarity', { length: 20 }).notNull().default('common'),
    priceCoins: integer('price_coins'),
    priceGems: integer('price_gems'),

    // Assets
    spriteSheet: varchar('sprite_sheet', { length: 255 }),
    previewImage: varchar('preview_image', { length: 255 }),

    // Flags
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    index('skins_item_type_idx').on(table.itemType),
    index('skins_rarity_idx').on(table.rarity),
    index('skins_character_id_idx').on(table.characterId),
  ]
);

// User inventory table
export const userInventory = pgTable(
  'user_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skinId: varchar('skin_id', { length: 50 })
      .notNull()
      .references(() => skins.id),

    // What slot is this equipped to (if any)
    equippedAs: varchar('equipped_as', { length: 30 }), // 'character', 'ball', 'court', or null

    acquiredAt: timestamp('acquired_at').notNull().defaultNow(),
  },
  (table) => [
    index('user_inventory_user_id_idx').on(table.userId),
    uniqueIndex('user_inventory_user_skin_idx').on(table.userId, table.skinId),
  ]
);

// Matches table
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Players
    winnerId: uuid('winner_id')
      .notNull()
      .references(() => users.id),
    loserId: uuid('loser_id')
      .notNull()
      .references(() => users.id),

    // Scores
    winnerScore: integer('winner_score').notNull(),
    loserScore: integer('loser_score').notNull(),

    // ELO at time of match
    winnerElo: integer('winner_elo'),
    loserElo: integer('loser_elo'),
    winnerEloChange: integer('winner_elo_change').notNull(),
    loserEloChange: integer('loser_elo_change').notNull(),

    // Match info
    mode: varchar('mode', { length: 20 }).notNull(), // 'ranked', 'casual', 'practice'
    duration: integer('duration').notNull(), // in seconds
    isRanked: boolean('is_ranked').notNull().default(true),

    // Replay data (compressed game state snapshots)
    replayData: json('replay_data'),

    playedAt: timestamp('played_at').notNull().defaultNow(),
  },
  (table) => [
    index('matches_winner_id_idx').on(table.winnerId),
    index('matches_loser_id_idx').on(table.loserId),
    index('matches_played_at_idx').on(table.playedAt),
    index('matches_mode_idx').on(table.mode),
  ]
);

// Transactions table (purchase history)
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Transaction type
    type: varchar('type', { length: 30 }).notNull(), // purchase, reward, refund, match_reward, daily_bonus

    // Item details
    itemType: varchar('item_type', { length: 30 }), // skin, character, battle_pass, etc.
    itemId: varchar('item_id', { length: 50 }),

    // Amount and currency
    amount: integer('amount').notNull(),
    currencyType: varchar('currency_type', { length: 20 }).notNull(), // coins, gems, real

    // Additional metadata
    metadata: json('metadata'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('transactions_user_id_idx').on(table.userId),
    index('transactions_type_idx').on(table.type),
    index('transactions_created_at_idx').on(table.createdAt),
  ]
);

// Battle pass table
export const battlePass = pgTable(
  'battle_pass',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    season: integer('season').notNull(),

    // Progress
    currentTier: integer('current_tier').notNull().default(0),
    xp: integer('xp').notNull().default(0),

    // Premium status
    isPremium: boolean('is_premium').notNull().default(false),
    purchasedAt: timestamp('purchased_at'),

    // Track claimed rewards
    claimedFreeTiers: json('claimed_free_tiers').$type<number[]>().default([]),
    claimedPremiumTiers: json('claimed_premium_tiers').$type<number[]>().default([]),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('battle_pass_user_id_idx').on(table.userId),
    index('battle_pass_season_idx').on(table.season),
    uniqueIndex('battle_pass_user_season_idx').on(table.userId, table.season),
  ]
);

// Battle pass rewards definition
export const battlePassRewards = pgTable(
  'battle_pass_rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    season: integer('season').notNull(),
    tier: integer('tier').notNull(),

    // Reward details
    rewardType: varchar('reward_type', { length: 30 }).notNull(), // coins, gems, skin, character, xp_boost
    rewardId: varchar('reward_id', { length: 50 }), // skinId or null for currency
    rewardAmount: integer('reward_amount'), // for currency rewards

    // Track (free or premium)
    isPremium: boolean('is_premium').notNull().default(false),
  },
  (table) => [
    index('battle_pass_rewards_season_idx').on(table.season),
    index('battle_pass_rewards_tier_idx').on(table.tier),
    uniqueIndex('battle_pass_rewards_unique_idx').on(table.season, table.tier, table.isPremium),
  ]
);

// Daily challenges table
export const dailyChallenges = pgTable(
  'daily_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Challenge details
    challengeType: varchar('challenge_type', { length: 50 }).notNull(), // win_matches, score_points, play_character, etc.
    targetValue: integer('target_value').notNull(),
    currentValue: integer('current_value').notNull().default(0),

    // Reward
    rewardType: varchar('reward_type', { length: 20 }).notNull(), // coins, gems, xp
    rewardAmount: integer('reward_amount').notNull(),

    // Status
    isCompleted: boolean('is_completed').notNull().default(false),
    isClaimed: boolean('is_claimed').notNull().default(false),

    // Valid for this date
    validDate: timestamp('valid_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('daily_challenges_user_id_idx').on(table.userId),
    index('daily_challenges_valid_date_idx').on(table.validDate),
  ]
);

// Legacy compatibility: export old table names
export const ownedItems = userInventory;
export const shopItems = skins;

// Type exports for use in queries
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type Skin = typeof skins.$inferSelect;
export type UserInventoryItem = typeof userInventory.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type BattlePass = typeof battlePass.$inferSelect;
export type BattlePassReward = typeof battlePassRewards.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
