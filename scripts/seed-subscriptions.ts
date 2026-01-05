import "dotenv/config";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Find the monthly recurring DKK price for a product
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
 * Check if subscription already exists in database
 */
async function subscriptionExists(name: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("subscription_id")
    .eq("subscription_name", name)
    .single();

  return data !== null;
}

/**
 * Process a single Stripe product and create subscription in database
 */
async function processProduct(
  product: Stripe.Product
): Promise<"created" | "skipped" | "error"> {
  const monthlyPrice = await findMonthlyPrice(product.id);

  if (!monthlyPrice) {
    console.log(
      `⚠️  Skipping product "${product.name}" - no monthly DKK price found`
    );
    return "skipped";
  }

  if (await subscriptionExists(product.name)) {
    console.log(`⏭️  Subscription "${product.name}" already exists, skipping`);
    return "skipped";
  }

  const { maxMonthlyBookings, discountRate } = extractMetadata(product);
  const monthlyPriceDKK = monthlyPrice.unit_amount
    ? monthlyPrice.unit_amount / 100
    : 0;

  const { error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      subscription_name: product.name,
      subscription_monthly_price: monthlyPriceDKK,
      subscription_max_monthly_bookings: maxMonthlyBookings,
      subscription_discount_rate: discountRate,
      subscription_stripe_product_id: product.id,
      subscription_stripe_price_id: monthlyPrice.id,
    });

  if (insertError) {
    console.error(
      `❌ Failed to create subscription "${product.name}":`,
      insertError.message
    );
    return "error";
  }

  console.log(
    `✅ Created subscription: ${product.name} (${monthlyPriceDKK} DKK/month)`
  );
  return "created";
}

/**
 * Log seeding summary
 */
function logSummary(created: number, skipped: number, errors: number): void {
  console.log("\n📊 Summary:");
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  if (errors > 0) {
    console.log(`   ❌ Errors: ${errors}`);
  }
  console.log("\n🌱 Subscription seeding complete!\n");
}

/**
 * Default subscriptions to create if they don't exist in Stripe
 */
const DEFAULT_SUBSCRIPTIONS = [
  {
    name: "Basic",
    monthlyPrice: 0.0,
    maxMonthlyBookings: 5,
    discountRate: 0.0,
  },
  {
    name: "Premium",
    monthlyPrice: 29.99,
    maxMonthlyBookings: 20,
    discountRate: 10.0,
  },
  {
    name: "Enterprise",
    monthlyPrice: 99.99,
    maxMonthlyBookings: null,
    discountRate: 20.0,
  },
] as const;

/**
 * Find Stripe product and price IDs for a subscription name
 */
async function findStripeIds(
  name: string
): Promise<{ productId: string | null; priceId: string | null }> {
  const products = await stripe.products.list({
    limit: 100,
    active: true,
  });
  const stripeProduct = products.data.find((p) => p.name === name);

  if (!stripeProduct) {
    return { productId: null, priceId: null };
  }

  const monthlyPrice = await findMonthlyPrice(stripeProduct.id);
  return {
    productId: stripeProduct.id,
    priceId: monthlyPrice?.id ?? null,
  };
}

/**
 * Create a default subscription in the database
 */
async function createDefaultSubscription(
  sub: (typeof DEFAULT_SUBSCRIPTIONS)[number]
): Promise<boolean> {
  const { productId, priceId } = await findStripeIds(sub.name);

  const { error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      subscription_name: sub.name,
      subscription_monthly_price: sub.monthlyPrice,
      subscription_max_monthly_bookings: sub.maxMonthlyBookings,
      subscription_discount_rate: sub.discountRate,
      subscription_stripe_product_id: productId,
      subscription_stripe_price_id: priceId,
    });

  if (insertError) {
    console.error(
      `❌ Failed to create subscription "${sub.name}":`,
      insertError.message
    );
    return false;
  }

  if (productId) {
    console.log(`✅ Created subscription "${sub.name}" with Stripe IDs`);
  } else {
    console.log(
      `✅ Created subscription "${sub.name}" without Stripe IDs (no Stripe product found)`
    );
  }

  return true;
}

/**
 * Create default subscriptions in database if they don't exist
 * These are created without Stripe IDs (NULL) if no Stripe product exists
 */
async function ensureDefaultSubscriptions(): Promise<void> {
  console.log("🔍 Ensuring default subscriptions exist in database...\n");

  for (const sub of DEFAULT_SUBSCRIPTIONS) {
    if (await subscriptionExists(sub.name)) {
      console.log(`✓ Subscription "${sub.name}" already exists in database`);
      continue;
    }

    try {
      await createDefaultSubscription(sub);
    } catch (error) {
      console.error(
        `❌ Error creating subscription "${sub.name}":`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log("");
}

/**
 * Seed subscriptions from Stripe products
 * Reads all Stripe products and their associated prices,
 * extracts metadata (max_monthly_bookings, discount_rate),
 * and inserts them into the database.
 */
async function seedSubscriptions() {
  console.log("🌱 Seeding subscriptions from Stripe...\n");

  // Ensure default subscriptions exist in database (with or without Stripe IDs)
  await ensureDefaultSubscriptions();

  try {
    const products = await stripe.products.list({ limit: 100, active: true });

    if (products.data.length === 0) {
      console.log(
        "⚠️  No Stripe products found. Skipping subscription seeding.\n"
      );
      return;
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of products.data) {
      try {
        const result = await processProduct(product);
        if (result === "created") {
          created += 1;
        } else if (result === "skipped") {
          skipped += 1;
        } else {
          errors += 1;
        }
      } catch (error) {
        console.error(
          `❌ Error processing product "${product.name}":`,
          error instanceof Error ? error.message : String(error)
        );
        errors += 1;
      }
    }

    logSummary(created, skipped, errors);
  } catch (error) {
    console.error("❌ Failed to seed subscriptions:", error);
    throw error;
  }
}

seedSubscriptions().catch((error) => {
  console.error(error);
  process.exit(1);
});
