"use server";

import type Stripe from "stripe";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toSupabaseQueryResponse } from "@/lib/supabase-response";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/supabase/types/database";

/**
 * Find the monthly recurring DKK price for a Stripe product
 */
async function findMonthlyPrice(
  productId: string
): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  });

  return (
    prices.data.find(
      (price) =>
        price.recurring?.interval === "month" &&
        price.active &&
        price.currency === "dkk"
    ) || null
  );
}

/**
 * Extract metadata from Stripe product
 */
function extractMetadata(product: Stripe.Product): {
  maxMonthlyBookings: number | null;
  discountRate: number;
} {
  const maxMonthlyBookings = product.metadata.max_monthly_bookings
    ? Number.parseInt(product.metadata.max_monthly_bookings, 10)
    : null;
  const discountRate = product.metadata.discount_rate
    ? Number.parseFloat(product.metadata.discount_rate)
    : 0;

  return { maxMonthlyBookings, discountRate };
}

/**
 * Find existing subscription in database by Stripe product and price IDs
 */
async function findSubscriptionByStripeIds(
  productId: string,
  priceId: string
): Promise<Tables<"subscriptions"> | null> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("subscription_stripe_product_id", productId)
    .eq("subscription_stripe_price_id", priceId)
    .single();

  return data;
}

/**
 * Create a new subscription record from Stripe product data
 */
async function createSubscriptionFromStripe(
  product: Stripe.Product,
  price: Stripe.Price
): Promise<{ success: boolean; error?: string }> {
  const { maxMonthlyBookings, discountRate } = extractMetadata(product);
  const monthlyPriceDKK = price.unit_amount ? price.unit_amount / 100 : 0;

  const { error } = await supabaseAdmin.from("subscriptions").insert({
    subscription_name: product.name,
    subscription_monthly_price: monthlyPriceDKK,
    subscription_max_monthly_bookings: maxMonthlyBookings,
    subscription_discount_rate: discountRate,
    subscription_stripe_product_id: product.id,
    subscription_stripe_price_id: price.id,
  } as TablesInsert<"subscriptions">);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update subscription metadata if it differs from Stripe
 */
async function updateSubscriptionIfNeeded(
  subscription: Tables<"subscriptions">,
  product: Stripe.Product,
  price: Stripe.Price
): Promise<{ success: boolean; error?: string }> {
  const { maxMonthlyBookings, discountRate } = extractMetadata(product);
  const monthlyPriceDKK = price.unit_amount ? price.unit_amount / 100 : 0;

  // Check if any fields need updating
  const needsUpdate =
    subscription.subscription_name !== product.name ||
    subscription.subscription_monthly_price !== monthlyPriceDKK ||
    subscription.subscription_max_monthly_bookings !== maxMonthlyBookings ||
    subscription.subscription_discount_rate !== discountRate;

  if (!needsUpdate) {
    return { success: true };
  }

  const updateData: TablesUpdate<"subscriptions"> = {};

  if (subscription.subscription_name !== product.name) {
    updateData.subscription_name = product.name;
  }
  if (subscription.subscription_monthly_price !== monthlyPriceDKK) {
    updateData.subscription_monthly_price = monthlyPriceDKK;
  }
  if (subscription.subscription_max_monthly_bookings !== maxMonthlyBookings) {
    updateData.subscription_max_monthly_bookings = maxMonthlyBookings;
  }
  if (subscription.subscription_discount_rate !== discountRate) {
    updateData.subscription_discount_rate = discountRate;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update(updateData)
    .eq("subscription_id", subscription.subscription_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sync a single Stripe product with the database
 */
async function syncProduct(
  product: Stripe.Product
): Promise<{ success: boolean; error?: string }> {
  const monthlyPrice = await findMonthlyPrice(product.id);

  if (!monthlyPrice) {
    // Skip products without monthly recurring DKK prices
    return { success: true };
  }

  const existingSubscription = await findSubscriptionByStripeIds(
    product.id,
    monthlyPrice.id
  );

  if (!existingSubscription) {
    // Create new subscription record
    return await createSubscriptionFromStripe(product, monthlyPrice);
  }

  // Update if metadata differs
  return await updateSubscriptionIfNeeded(
    existingSubscription,
    product,
    monthlyPrice
  );
}

/**
 * Get all active Stripe product IDs (for verification)
 */
async function getAllActiveStripeProductIds(): Promise<{
  success: boolean;
  error?: string;
  productIds?: Set<string>;
}> {
  try {
    // Fetch all active products from Stripe to verify existence
    const allProducts = await stripe.products.list({
      limit: 100, // Stripe allows up to 100 per page
      active: true,
    });

    const productIds = new Set<string>();
    for (const product of allProducts.data) {
      productIds.add(product.id);
    }

    // Handle pagination if there are more than 100 products
    let hasMore = allProducts.has_more;
    let lastProductId = allProducts.data.at(-1)?.id;

    while (hasMore && lastProductId) {
      const nextPage = await stripe.products.list({
        limit: 100,
        active: true,
        starting_after: lastProductId,
      });

      for (const product of nextPage.data) {
        productIds.add(product.id);
      }

      hasMore = nextPage.has_more;
      lastProductId = nextPage.data.at(-1)?.id;
    }

    return { success: true, productIds };
  } catch (stripeError) {
    return {
      success: false,
      error:
        stripeError instanceof Error
          ? stripeError.message
          : String(stripeError),
    };
  }
}

/**
 * Delete orphaned subscriptions that no longer exist in Stripe
 */
async function deleteOrphanedSubscriptions(
  activeStripeProductIds: Set<string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch all subscriptions with Stripe IDs from database
    const { data: dbSubscriptions, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select("subscription_id, subscription_stripe_product_id")
      .not("subscription_stripe_product_id", "is", null);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!dbSubscriptions) {
      return { success: true };
    }

    // Find subscriptions whose Stripe products no longer exist
    const orphanedIds = dbSubscriptions
      .filter(
        (sub) =>
          sub.subscription_stripe_product_id &&
          !activeStripeProductIds.has(sub.subscription_stripe_product_id)
      )
      .map((sub) => sub.subscription_id);

    if (orphanedIds.length === 0) {
      return { success: true };
    }

    // Delete orphaned subscriptions
    const { error: deleteError } = await supabaseAdmin
      .from("subscriptions")
      .delete()
      .in("subscription_id", orphanedIds);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Sync latest Stripe products with the database
 * Only syncs the latest 25 products, but returns success status
 */
async function syncStripeProducts(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Fetch latest 25 active products from Stripe
    const products = await stripe.products.list({
      limit: 25,
      active: true,
    });

    // Sync each product
    for (const product of products.data) {
      await syncProduct(product);
    }

    return { success: true };
  } catch (stripeError) {
    return {
      success: false,
      error:
        stripeError instanceof Error
          ? stripeError.message
          : String(stripeError),
    };
  }
}

/**
 * Fetches all subscriptions (admin only)
 * Syncs with Stripe before fetching to ensure database is up-to-date
 */
export async function getAllSubscriptions() {
  // Verify admin access
  const { error: authError } = await requireAdmin();
  if (authError) {
    return {
      data: null,
      error: authError,
    };
  }

  // Sync latest 25 products with Stripe first
  const syncResult = await syncStripeProducts();
  if (!syncResult.success) {
    return {
      data: null,
      error: {
        code: "STRIPE_SYNC_ERROR",
        message: "Failed to sync subscriptions with Stripe",
        details: syncResult.error || "",
        hint: "",
        name: "StripeSyncError",
      },
    };
  }

  // Get all active Stripe product IDs to verify which ones exist
  const productIdsResult = await getAllActiveStripeProductIds();
  if (!(productIdsResult.success && productIdsResult.productIds)) {
    return {
      data: null,
      error: {
        code: "STRIPE_SYNC_ERROR",
        message: "Failed to fetch Stripe products for verification",
        details: productIdsResult.error || "",
        hint: "",
        name: "StripeSyncError",
      },
    };
  }

  // Delete orphaned subscriptions that no longer exist in Stripe
  const deleteResult = await deleteOrphanedSubscriptions(
    productIdsResult.productIds
  );
  if (!deleteResult.success) {
    return {
      data: null,
      error: {
        code: "STRIPE_SYNC_ERROR",
        message: "Failed to delete orphaned subscriptions",
        details: deleteResult.error || "",
        hint: "",
        name: "StripeSyncError",
      },
    };
  }

  // Fetch all subscriptions from database
  const supabase = await createClient();

  const result = await supabase
    .from("subscriptions")
    .select("*")
    .order("subscription_monthly_price", { ascending: true });

  return toSupabaseQueryResponse<Tables<"subscriptions">[]>(result);
}
