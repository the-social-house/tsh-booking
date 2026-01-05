"use server";

import type Stripe from "stripe";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupabaseResponse } from "@/lib/supabase-response";
import { createValidationError } from "@/lib/validation";
import type { TablesInsert } from "@/supabase/types/database";

const completeSignupSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  authUserId: z.uuid(),
  subscriptionId: z.uuid(),
  roleId: z.uuid(),
  email: z.email(),
  companyName: z.string().min(1),
});

export type CompleteSignupInput = z.infer<typeof completeSignupSchema>;

export type CompleteSignupResult = {
  clientSecret: string;
  paymentIntentId: string;
  userId: string;
  subscriptionName: string;
  invoiceAmount: number; // in DKK (not øre)
  invoiceCurrency: string;
};

/**
 * Updates the auth user's password
 */
async function updateUserPassword(
  authUserId: string,
  password: string
): Promise<SupabaseResponse<null>> {
  const { error: passwordError } =
    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password,
    });

  if (passwordError) {
    return {
      data: null,
      error: {
        code: "PASSWORD_UPDATE_ERROR",
        message: "Failed to set password. Please try again.",
        details: passwordError.message,
        hint: "",
        name: "AuthError",
      },
    };
  }

  return { data: null, error: null };
}

/**
 * Fetches subscription details
 */
async function fetchSubscription(subscriptionId: string): Promise<
  SupabaseResponse<{
    subscription_stripe_price_id: string;
    subscription_name: string;
  }>
> {
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("subscription_stripe_price_id, subscription_name")
    .eq("subscription_id", subscriptionId)
    .single();

  if (subscriptionError || !subscription) {
    return {
      data: null,
      error: {
        code: "SUBSCRIPTION_NOT_FOUND",
        message: "Subscription not found. Please contact support.",
        details: "",
        hint: "",
        name: "PostgrestError",
      },
    };
  }

  if (!subscription.subscription_stripe_price_id) {
    return {
      data: null,
      error: {
        code: "STRIPE_PRICE_MISSING",
        message:
          "Subscription is not configured for payments. Please contact support.",
        details: "",
        hint: "",
        name: "ValidationError",
      },
    };
  }

  // After null check, TypeScript knows subscription_stripe_price_id is string
  return {
    data: {
      subscription_stripe_price_id: subscription.subscription_stripe_price_id,
      subscription_name: subscription.subscription_name,
    },
    error: null,
  };
}

/**
 * Creates a Stripe customer
 */
async function createStripeCustomer(
  email: string,
  companyName: string,
  authUserId: string
): Promise<
  { customer: Stripe.Customer } | { error: SupabaseResponse<null>["error"] }
> {
  try {
    const customer = await stripe.customers.create({
      email,
      name: companyName,
      metadata: {
        user_id: authUserId,
      },
    });
    return { customer };
  } catch (stripeError) {
    return {
      error: {
        code: "STRIPE_CUSTOMER_ERROR",
        message: "Failed to create payment account. Please try again.",
        details:
          stripeError instanceof Error
            ? stripeError.message
            : String(stripeError),
        hint: "",
        name: "StripeError",
      },
    };
  }
}

/**
 * Creates a Stripe subscription
 */
async function createStripeSubscription(
  customerId: string,
  priceId: string
): Promise<
  | { subscription: Stripe.Subscription }
  | { error: SupabaseResponse<null>["error"] }
> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });
    return { subscription };
  } catch (stripeError) {
    return {
      error: {
        code: "STRIPE_SUBSCRIPTION_ERROR",
        message: "Failed to create subscription. Please try again.",
        details:
          stripeError instanceof Error
            ? stripeError.message
            : String(stripeError),
        hint: "",
        name: "StripeError",
      },
    };
  }
}

/**
 * Cleans up Stripe resources (subscription and customer)
 */
async function cleanupStripeResources(
  subscriptionId: string | null,
  customerId: string | null
): Promise<void> {
  if (subscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch {
      // Ignore cleanup errors
    }
  }
  if (customerId) {
    try {
      await stripe.customers.del(customerId);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Creates a payment error response
 */
function createPaymentError(details: string): {
  error: SupabaseResponse<null>["error"];
} {
  return {
    error: {
      code: "PAYMENT_INTENT_ERROR",
      message: "Failed to initialize payment. Please try again.",
      details,
      hint: "",
      name: "StripeError",
    },
  };
}

/**
 * Retrieves invoice from subscription
 */
async function retrieveInvoice(
  latestInvoice: string | Stripe.Invoice | null
): Promise<
  { invoice: Stripe.Invoice } | { error: SupabaseResponse<null>["error"] }
> {
  if (typeof latestInvoice === "string") {
    try {
      const invoice = await stripe.invoices.retrieve(latestInvoice, {
        expand: ["payment_intent"],
      });
      return { invoice };
    } catch (invoiceError) {
      return createPaymentError(
        invoiceError instanceof Error
          ? `Invoice fetch error: ${invoiceError.message}`
          : String(invoiceError)
      );
    }
  }

  if (latestInvoice && typeof latestInvoice === "object") {
    return { invoice: latestInvoice };
  }

  return createPaymentError(
    `Invalid invoice structure from Stripe. Type: ${typeof latestInvoice}`
  );
}

type CreatePaymentIntentOptions = {
  invoice: Stripe.Invoice;
  customerId: string;
  subscriptionId: string;
  authUserId: string;
};

/**
 * Creates a payment intent for an invoice
 */
async function createPaymentIntentForInvoice(
  options: CreatePaymentIntentOptions
): Promise<
  | { paymentIntent: Stripe.PaymentIntent }
  | { error: SupabaseResponse<null>["error"] }
> {
  const { invoice, customerId, subscriptionId, authUserId } = options;
  const invoiceAmount = invoice.amount_due || 0;
  const invoiceCurrency = invoice.currency || "dkk";

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: invoiceAmount,
      currency: invoiceCurrency,
      customer: customerId,
      metadata: {
        invoice_id: invoice.id,
        subscription_id: subscriptionId,
        user_id: authUserId,
      },
      payment_method_types: ["card"],
    });
    return { paymentIntent };
  } catch (paymentIntentError) {
    return createPaymentError(
      paymentIntentError instanceof Error
        ? `Payment intent creation error: ${paymentIntentError.message}`
        : String(paymentIntentError)
    );
  }
}

type GetPaymentIntentOptions = {
  invoicePaymentIntent: string | Stripe.PaymentIntent | null;
  invoice: Stripe.Invoice;
  customerId: string;
  subscriptionId: string;
  authUserId: string;
};

/**
 * Retrieves payment intent by ID string
 */
async function retrievePaymentIntentById(
  paymentIntentId: string
): Promise<
  | { paymentIntent: Stripe.PaymentIntent }
  | { error: SupabaseResponse<null>["error"] }
> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { paymentIntent };
  } catch (paymentIntentError) {
    return createPaymentError(
      paymentIntentError instanceof Error
        ? paymentIntentError.message
        : String(paymentIntentError)
    );
  }
}

/**
 * Handles payment intent when it's an object
 */
async function handlePaymentIntentObject(
  invoicePaymentIntent: Stripe.PaymentIntent
): Promise<
  | { paymentIntent: Stripe.PaymentIntent }
  | { error: SupabaseResponse<null>["error"] }
> {
  // Check if it has an id (required)
  if (!invoicePaymentIntent.id || typeof invoicePaymentIntent.id !== "string") {
    return createPaymentError(
      `Payment intent object missing id. Structure: ${JSON.stringify(Object.keys(invoicePaymentIntent))}`
    );
  }

  // If it has client_secret, use it directly
  if (
    invoicePaymentIntent.client_secret &&
    typeof invoicePaymentIntent.client_secret === "string"
  ) {
    return { paymentIntent: invoicePaymentIntent };
  }

  // If it doesn't have client_secret but has an id, fetch it
  return await retrievePaymentIntentById(invoicePaymentIntent.id);
}

/**
 * Retrieves payment intent from invoice
 */
async function getPaymentIntentFromInvoice(
  options: GetPaymentIntentOptions
): Promise<
  | { paymentIntent: Stripe.PaymentIntent }
  | { error: SupabaseResponse<null>["error"] }
> {
  const {
    invoicePaymentIntent,
    invoice,
    customerId,
    subscriptionId,
    authUserId,
  } = options;

  // Handle null or undefined payment intent - need to create one
  if (invoicePaymentIntent === null || invoicePaymentIntent === undefined) {
    return await createPaymentIntentForInvoice({
      invoice,
      customerId,
      subscriptionId,
      authUserId,
    });
  }

  if (typeof invoicePaymentIntent === "string") {
    return await retrievePaymentIntentById(invoicePaymentIntent);
  }

  if (invoicePaymentIntent && typeof invoicePaymentIntent === "object") {
    return await handlePaymentIntentObject(
      invoicePaymentIntent as Stripe.PaymentIntent
    );
  }

  return createPaymentError(
    `Invalid payment intent structure from Stripe. Type: ${typeof invoicePaymentIntent}, Value: ${JSON.stringify(invoicePaymentIntent)}`
  );
}

/**
 * Validates payment intent has required fields
 */
function validatePaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): { valid: true } | { error: SupabaseResponse<null>["error"] } {
  if (
    !paymentIntent.client_secret ||
    typeof paymentIntent.client_secret !== "string" ||
    !paymentIntent.id ||
    typeof paymentIntent.id !== "string"
  ) {
    return createPaymentError("Payment intent missing required fields");
  }
  return { valid: true };
}

/**
 * Gets payment intent from subscription's invoice
 */
async function getPaymentIntentFromSubscription(
  subscription: Stripe.Subscription,
  customerId: string,
  authUserId: string
): Promise<
  | {
      paymentIntent: Stripe.PaymentIntent;
      invoice: Stripe.Invoice;
    }
  | { error: SupabaseResponse<null>["error"] }
> {
  const invoiceResult = await retrieveInvoice(subscription.latest_invoice);
  if ("error" in invoiceResult) {
    return invoiceResult;
  }
  const { invoice } = invoiceResult;

  // Access payment_intent safely (may be string, PaymentIntent, or null/undefined when expanded)
  const invoicePaymentIntent =
    (invoice as { payment_intent?: string | Stripe.PaymentIntent | null })
      .payment_intent ?? null;

  const paymentIntentResult = await getPaymentIntentFromInvoice({
    invoicePaymentIntent,
    invoice,
    customerId,
    subscriptionId: subscription.id,
    authUserId,
  });
  if ("error" in paymentIntentResult) {
    return paymentIntentResult;
  }
  const { paymentIntent } = paymentIntentResult;

  const validationResult = validatePaymentIntent(paymentIntent);
  if ("error" in validationResult) {
    return validationResult;
  }

  return { paymentIntent, invoice };
}

type CreateUserOptions = {
  authUserId: string;
  email: string;
  companyName: string;
  roleId: string;
  subscriptionId: string;
};

/**
 * Gets user-friendly error message from database error
 */
function getUserCreationErrorMessage(
  errorCode: string | null,
  errorDetails: string | null
): string {
  if (errorCode === "23505") {
    if (errorDetails?.includes("user_email")) {
      return "A user with this email already exists.";
    }
    if (errorDetails?.includes("user_company_name")) {
      return "A user with this company name already exists.";
    }
  }
  if (errorCode === "23503") {
    if (errorDetails?.includes("user_role_id")) {
      return "Invalid role selected. Please contact support.";
    }
    if (errorDetails?.includes("user_subscription_id")) {
      return "Invalid subscription selected. Please contact support.";
    }
  }
  return "Failed to create user account. Please try again.";
}

/**
 * Checks if user already exists
 */
async function checkUserExists(
  authUserId: string
): Promise<{ exists: boolean; userStatus?: string }> {
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("user_id, user_status")
    .eq("user_id", authUserId)
    .single();

  return {
    exists: !!existingUser,
    userStatus: existingUser?.user_status,
  };
}

/**
 * Creates user in database
 */
async function createUser(
  options: CreateUserOptions
): Promise<SupabaseResponse<null>> {
  const { authUserId, email, companyName, roleId, subscriptionId } = options;

  // Check if user already exists
  const { exists, userStatus } = await checkUserExists(authUserId);
  if (exists) {
    return {
      data: null,
      error: {
        code: "USER_ALREADY_EXISTS",
        message:
          userStatus === "active"
            ? "This account has already been activated. Please log in instead."
            : "This account already exists. Please contact support if you need help.",
        details: "",
        hint: "",
        name: "ValidationError",
      },
    };
  }

  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      user_id: authUserId,
      user_email: email,
      user_company_name: companyName,
      user_role_id: roleId,
      user_subscription_id: subscriptionId,
      user_current_monthly_bookings: 0,
      user_is_banned: false,
      user_status: "pending",
    } as unknown as TablesInsert<"users">)
    .select()
    .single();

  if (userError) {
    return {
      data: null,
      error: {
        code: userError.code || "USER_CREATION_ERROR",
        message: getUserCreationErrorMessage(
          userError.code,
          userError.details || null
        ),
        details: userError.details || "",
        hint: userError.hint || "",
        name: "PostgrestError",
      },
    };
  }

  return { data: null, error: null };
}

type HandleStripeErrorOptions = {
  result: { error: SupabaseResponse<null>["error"] | null };
  errorCode: string;
  errorMessage: string;
  subscriptionId: string | null;
  customerId: string | null;
};

/**
 * Handles error result from Stripe operations with cleanup
 */
async function handleStripeError(
  options: HandleStripeErrorOptions
): Promise<SupabaseResponse<CompleteSignupResult>> {
  const { result, errorCode, errorMessage, subscriptionId, customerId } =
    options;
  await cleanupStripeResources(subscriptionId, customerId);
  if (!result.error) {
    return {
      data: null,
      error: {
        code: errorCode,
        message: errorMessage,
        details: "Unknown error",
        hint: "",
        name: "StripeError",
      },
    };
  }
  return { data: null, error: result.error };
}

/**
 * Builds the final success response
 */
function buildSuccessResponse(
  paymentIntent: Stripe.PaymentIntent,
  invoice: Stripe.Invoice,
  authUserId: string,
  subscriptionName: string
): SupabaseResponse<CompleteSignupResult> {
  const invoiceAmount = invoice.amount_due || 0;
  const invoiceCurrency = invoice.currency || "dkk";

  // Validate payment intent fields (already validated, but TypeScript needs this)
  if (
    !paymentIntent.client_secret ||
    typeof paymentIntent.client_secret !== "string" ||
    !paymentIntent.id ||
    typeof paymentIntent.id !== "string"
  ) {
    return {
      data: null,
      error: {
        code: "PAYMENT_INTENT_ERROR",
        message: "Failed to initialize payment. Please try again.",
        details: "Payment intent missing required fields",
        hint: "",
        name: "StripeError",
      },
    };
  }

  return {
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      userId: authUserId,
      subscriptionName,
      invoiceAmount: invoiceAmount / 100, // Convert from øre to DKK
      invoiceCurrency,
    },
    error: null,
  };
}

/**
 * Completes user signup with password and payment setup
 *
 * Flow:
 * 1. Update auth user's password
 * 2. Fetch subscription details (to get stripe_price_id)
 * 3. Create Stripe Customer with metadata
 * 4. Create Stripe Subscription (recurring) using subscription's price_id
 * 5. Get Payment Intent from subscription's latest invoice
 * 6. Create user in public.users with user_status = 'pending'
 * 7. Return client_secret for Payment Element
 */
export async function completeSignup(
  data: CompleteSignupInput
): Promise<SupabaseResponse<CompleteSignupResult>> {
  // 1. Validate input
  const validationResult = completeSignupSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      data: null,
      error: createValidationError(validationResult.error),
    };
  }

  const { password, authUserId, subscriptionId, roleId, email, companyName } =
    validationResult.data;

  // 2. Update password
  const passwordResult = await updateUserPassword(authUserId, password);
  if (passwordResult.error) {
    return passwordResult;
  }

  // 3. Fetch subscription
  const subscriptionResult = await fetchSubscription(subscriptionId);
  if (subscriptionResult.error) {
    return subscriptionResult;
  }
  const subscription = subscriptionResult.data;

  // 4. Create Stripe Customer
  const customerResult = await createStripeCustomer(
    email,
    companyName,
    authUserId
  );
  if ("error" in customerResult) {
    return handleStripeError({
      result: customerResult,
      errorCode: "STRIPE_CUSTOMER_ERROR",
      errorMessage: "Failed to create payment account. Please try again.",
      subscriptionId: null,
      customerId: null,
    });
  }
  const { customer: stripeCustomer } = customerResult;

  // 5. Create Stripe Subscription
  const subscriptionCreateResult = await createStripeSubscription(
    stripeCustomer.id,
    subscription.subscription_stripe_price_id
  );
  if ("error" in subscriptionCreateResult) {
    return handleStripeError({
      result: subscriptionCreateResult,
      errorCode: "STRIPE_SUBSCRIPTION_ERROR",
      errorMessage: "Failed to create subscription. Please try again.",
      subscriptionId: null,
      customerId: stripeCustomer.id,
    });
  }
  const { subscription: stripeSubscription } = subscriptionCreateResult;

  // 6. Get Payment Intent
  const paymentIntentResult = await getPaymentIntentFromSubscription(
    stripeSubscription,
    stripeCustomer.id,
    authUserId
  );
  if ("error" in paymentIntentResult) {
    return handleStripeError({
      result: paymentIntentResult,
      errorCode: "PAYMENT_INTENT_ERROR",
      errorMessage: "Failed to initialize payment. Please try again.",
      subscriptionId: stripeSubscription.id,
      customerId: stripeCustomer.id,
    });
  }
  const { paymentIntent, invoice } = paymentIntentResult;

  // 7. Create user
  const userResult = await createUser({
    authUserId,
    email,
    companyName,
    roleId,
    subscriptionId,
  });
  if (userResult.error) {
    await cleanupStripeResources(stripeSubscription.id, stripeCustomer.id);
    return userResult;
  }

  // 8. Update customer metadata (non-critical)
  try {
    await stripe.customers.update(stripeCustomer.id, {
      metadata: {
        user_id: authUserId,
      },
    });
  } catch {
    // Non-critical error - continue
  }

  // 9. Build and validate success response
  const successResponse = buildSuccessResponse(
    paymentIntent,
    invoice,
    authUserId,
    subscription.subscription_name
  );
  if (successResponse.error) {
    await cleanupStripeResources(stripeSubscription.id, stripeCustomer.id);
    return successResponse;
  }

  return successResponse;
}
