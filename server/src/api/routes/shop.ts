import { Elysia, t } from 'elysia';
import { authMiddleware, requireAuth } from '../middleware/auth';
import {
  getActiveSkins,
  getSkinById,
  getFeaturedSkins,
  getUserById,
  userOwnsItem,
  getUserInventory,
  equipItem,
  getEquippedItems,
  updateUserSelectedItems,
} from '../../db/queries';
import { InventoryService } from '../../services/inventory-service';

export const shopRoutes = new Elysia({ prefix: '/shop' })
  .use(authMiddleware)

  // ============================================================================
  // GET /shop/items - Get all shop items with filtering
  // ============================================================================
  .get(
    '/items',
    async ({ query, user }) => {
      const { type, rarity, page = '1', limit = '20' } = query;

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;

      const items = await getActiveSkins({
        itemType: type,
        rarity,
        limit: limitNum,
        offset,
      });

      // If user is authenticated, add ownership status
      let itemsWithOwnership = items;
      if (user) {
        const inventory = await getUserInventory(user.userId);
        const ownedSkinIds = new Set(inventory.map((i) => i.skinId));

        itemsWithOwnership = items.map((item) => ({
          ...item,
          owned: ownedSkinIds.has(item.id),
        }));
      }

      return {
        success: true,
        data: {
          items: itemsWithOwnership,
          pagination: {
            page: pageNum,
            limit: limitNum,
            hasMore: items.length === limitNum,
          },
        },
      };
    },
    {
      query: t.Object({
        type: t.Optional(t.String()),
        rarity: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    }
  )

  // ============================================================================
  // GET /shop/featured - Get featured/sale items
  // ============================================================================
  .get('/featured', async ({ user }) => {
    const items = await getFeaturedSkins(6);

    // If user is authenticated, add ownership status
    let itemsWithOwnership = items;
    if (user) {
      const inventory = await getUserInventory(user.userId);
      const ownedSkinIds = new Set(inventory.map((i) => i.skinId));

      itemsWithOwnership = items.map((item) => ({
        ...item,
        owned: ownedSkinIds.has(item.id),
      }));
    }

    return {
      success: true,
      data: {
        items: itemsWithOwnership,
        // Could add time-limited sale info here
        expiresAt: null,
      },
    };
  })

  // ============================================================================
  // GET /shop/items/:id - Get single item details
  // ============================================================================
  .get('/items/:id', async ({ params, user, set }) => {
    const item = await getSkinById(params.id);
    if (!item) {
      set.status = 404;
      return { success: false, error: 'Item not found' };
    }

    let owned = false;
    if (user) {
      owned = await userOwnsItem(user.userId, params.id);
    }

    return {
      success: true,
      data: {
        ...item,
        owned,
      },
    };
  })

  // ============================================================================
  // POST /shop/purchase - Purchase an item
  // ============================================================================
  .use(requireAuth)
  .post(
    '/purchase',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: 'Unauthorized' };
      }

      const { itemId, currencyType } = body;

      // Get item details
      const item = await getSkinById(itemId);
      if (!item) {
        set.status = 404;
        return { success: false, error: 'Item not found' };
      }

      // Check if item is purchasable
      if (!item.isActive) {
        set.status = 400;
        return { success: false, error: 'Item is not available for purchase' };
      }

      // Check if user already owns item
      const alreadyOwns = await userOwnsItem(user.userId, itemId);
      if (alreadyOwns) {
        set.status = 400;
        return { success: false, error: 'You already own this item' };
      }

      // Get user's current balance
      const userData = await getUserById(user.userId);
      if (!userData) {
        set.status = 404;
        return { success: false, error: 'User not found' };
      }

      // Determine price
      const price = currencyType === 'coins' ? item.priceCoins : item.priceGems;
      if (price === null || price === undefined) {
        set.status = 400;
        return { success: false, error: `Item cannot be purchased with ${currencyType}` };
      }

      // Check balance
      const balance = currencyType === 'coins' ? userData.coins : userData.gems;
      if (balance < price) {
        set.status = 400;
        return {
          success: false,
          error: `Insufficient ${currencyType}`,
          data: {
            required: price,
            current: balance,
          },
        };
      }

      // Process purchase with transaction logging
      try {
        const result = await InventoryService.purchaseItem(
          user.userId,
          itemId,
          item.itemType,
          price,
          currencyType
        );

        // Get updated balance
        const updatedUser = await getUserById(user.userId);

        return {
          success: true,
          data: {
            itemId,
            itemName: item.name,
            itemType: item.itemType,
            price,
            currencyType,
            newBalance: {
              coins: updatedUser?.coins ?? 0,
              gems: updatedUser?.gems ?? 0,
            },
            transactionId: result.transactionId,
          },
        };
      } catch (error) {
        console.error('Purchase failed:', error);
        set.status = 500;
        return { success: false, error: 'Purchase failed. Please try again.' };
      }
    },
    {
      body: t.Object({
        itemId: t.String(),
        currencyType: t.Union([t.Literal('coins'), t.Literal('gems')]),
      }),
    }
  );

// ============================================================================
// Inventory Routes
// ============================================================================
export const inventoryRoutes = new Elysia({ prefix: '/inventory' })
  .use(requireAuth)

  // ============================================================================
  // GET /inventory - Get user's inventory
  // ============================================================================
  .get('/', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const inventory = await getUserInventory(user.userId);

    // Group by item type
    const grouped: Record<string, Array<{ skinId: string; equippedAs: string | null; skin: unknown }>> = {
      character_skin: [],
      ball_skin: [],
      court: [],
      other: [],
    };

    for (const item of inventory) {
      const type = item.skin?.itemType || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({
        skinId: item.skinId,
        equippedAs: item.equippedAs,
        skin: item.skin,
      });
    }

    return {
      success: true,
      data: {
        items: grouped,
        totalItems: inventory.length,
      },
    };
  })

  // ============================================================================
  // GET /inventory/loadout - Get currently equipped items
  // ============================================================================
  .get('/loadout', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: 'Unauthorized' };
    }

    const userData = await getUserById(user.userId);
    if (!userData) {
      set.status = 404;
      return { success: false, error: 'User not found' };
    }

    const equippedItems = await getEquippedItems(user.userId);

    return {
      success: true,
      data: {
        character: userData.selectedCharacter,
        ball: userData.selectedBall,
        court: userData.selectedCourt,
        equippedSkins: equippedItems,
      },
    };
  })

  // ============================================================================
  // POST /inventory/equip - Equip an item
  // ============================================================================
  .post(
    '/equip',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: 'Unauthorized' };
      }

      const { skinId, slot } = body;

      // Verify ownership
      const owns = await userOwnsItem(user.userId, skinId);
      if (!owns) {
        set.status = 403;
        return { success: false, error: 'You do not own this item' };
      }

      // Get skin details to verify slot compatibility
      const skin = await getSkinById(skinId);
      if (!skin) {
        set.status = 404;
        return { success: false, error: 'Item not found' };
      }

      // Validate slot matches item type
      const validSlots: Record<string, string> = {
        character_skin: 'character',
        ball_skin: 'ball',
        court: 'court',
      };

      if (validSlots[skin.itemType] !== slot) {
        set.status = 400;
        return { success: false, error: `This item cannot be equipped in the ${slot} slot` };
      }

      // Equip the item
      const success = await equipItem(user.userId, skinId, slot as 'character' | 'ball' | 'court');
      if (!success) {
        set.status = 500;
        return { success: false, error: 'Failed to equip item' };
      }

      return {
        success: true,
        data: {
          skinId,
          slot,
          message: `Item equipped to ${slot} slot`,
        },
      };
    },
    {
      body: t.Object({
        skinId: t.String(),
        slot: t.Union([t.Literal('character'), t.Literal('ball'), t.Literal('court')]),
      }),
    }
  )

  // ============================================================================
  // POST /inventory/select - Select character/ball/court
  // ============================================================================
  .post(
    '/select',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: 'Unauthorized' };
      }

      const { type, itemId } = body;

      // Build update object based on type
      const updateData: {
        selectedCharacter?: string;
        selectedBall?: string;
        selectedCourt?: string;
      } = {};

      switch (type) {
        case 'character':
          updateData.selectedCharacter = itemId;
          break;
        case 'ball':
          updateData.selectedBall = itemId;
          break;
        case 'court':
          updateData.selectedCourt = itemId;
          break;
        default:
          set.status = 400;
          return { success: false, error: 'Invalid selection type' };
      }

      await updateUserSelectedItems(user.userId, updateData);

      return {
        success: true,
        data: {
          type,
          itemId,
          message: `${type} selection updated`,
        },
      };
    },
    {
      body: t.Object({
        type: t.Union([t.Literal('character'), t.Literal('ball'), t.Literal('court')]),
        itemId: t.String(),
      }),
    }
  );
