"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { completeSignup } from "@/app/features/auth/actions/complete-signup";
import type { InviteTokenData } from "@/app/features/auth/actions/validate-invite-token";
import { PaymentForm } from "@/app/features/booking/components/payment-form";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";
import { PaymentSummary } from "./payment-summary";
import { TestCardNotice } from "./test-card-notice";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type FieldErrors = {
  password?: boolean;
  confirmPassword?: boolean;
};

type CompleteSignupFormState = FormState<FieldErrors>;

type CompleteSignupFormProps = {
  inviteData: InviteTokenData;
};

/**
 * Form component for completing user signup
 *
 * Shows:
 * - Email (disabled/read-only)
 * - Company name (disabled/read-only)
 * - Password field
 * - Confirm password field
 * - Payment Element (after password is set)
 *
 * Flow:
 * 1. User sets password
 * 2. Server action creates Stripe Customer, Subscription, and user record
 * 3. Payment Element is shown for first payment
 * 4. On payment success, user_status will be updated to 'active' via webhook
 */
export function CompleteSignupForm({ inviteData }: CompleteSignupFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    userId: string;
    subscriptionName: string;
    invoiceAmount: number;
    invoiceCurrency: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  async function formAction(
    _previousState: CompleteSignupFormState | null,
    formData: FormData
  ): Promise<CompleteSignupFormState> {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation
    if (!password || password.length < 8) {
      return {
        error: messages.users.validation.password.minLength,
        fieldErrors: { password: true },
        success: false,
      };
    }

    if (password !== confirmPassword) {
      return {
        error: messages.users.validation.password.mismatch,
        fieldErrors: { password: true, confirmPassword: true },
        success: false,
      };
    }

    // Call server action to complete signup
    const result = await completeSignup({
      password,
      authUserId: inviteData.authUserId,
      subscriptionId: inviteData.subscriptionId,
      roleId: inviteData.roleId,
      email: inviteData.email,
      companyName: inviteData.companyName,
    });

    if (hasError(result)) {
      // Show detailed error message if available
      const errorMessage = result.error.details?.trim()
        ? `${result.error.message}\n\nDetails: ${result.error.details}`
        : result.error.message;
      toast.error(errorMessage);
      console.error("[completeSignup] Error:", result.error);
      return {
        error: result.error.message,
        fieldErrors: {},
        success: false,
      };
    }

    if (hasData(result)) {
      // Store payment data to show Payment Element
      setPaymentData(result.data);
      return {
        error: null,
        success: false, // Don't mark as success yet - payment is pending
      };
    }

    return {
      error: "Something went wrong. Please try again.",
      fieldErrors: {},
      success: false,
    };
  }

  const [state, formActionHandler, isPending] = useActionState(
    formAction,
    null
  );

  const handlePaymentSuccess = () => {
    setIsProcessingPayment(false);
    toast.success(messages.auth.completeSignup.messages.paymentSuccess);
    // Redirect to home page - webhook will update user_status to 'active'
    router.push("/");
  };

  // If payment data is available, show Payment Element
  if (paymentData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-2xl">
            {messages.auth.completeSignup.ui.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete your signup by entering your payment details. Your
            subscription will start immediately after payment.
          </p>
        </div>

        {/* Payment Summary */}
        <PaymentSummary
          amount={paymentData.invoiceAmount}
          currency={paymentData.invoiceCurrency}
          subscriptionName={paymentData.subscriptionName}
        />

        {/* Test Card Notice */}
        <TestCardNotice />

        {/* Payment Element */}
        <Elements
          options={{
            clientSecret: paymentData.clientSecret,
            appearance: {
              theme: "stripe",
            },
            locale: "da", // Danish locale for DKK currency
          }}
          stripe={stripePromise}
        >
          <PaymentForm
            isProcessing={isProcessingPayment}
            onSuccess={handlePaymentSuccess}
          />
        </Elements>
      </div>
    );
  }

  // Show password form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">
          {messages.auth.completeSignup.ui.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {messages.auth.completeSignup.ui.description}
        </p>
      </div>

      <form action={formActionHandler} className="space-y-4" ref={formRef}>
        <Field>
          <FieldLabel htmlFor="complete-signup-email">
            {messages.auth.completeSignup.ui.emailLabel}
          </FieldLabel>
          <Input
            disabled
            id="complete-signup-email"
            readOnly
            type="email"
            value={inviteData.email}
          />
          <FieldDescription>
            {messages.auth.completeSignup.ui.emailHelper}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="complete-signup-company-name">
            {messages.auth.completeSignup.ui.companyNameLabel}
          </FieldLabel>
          <Input
            disabled
            id="complete-signup-company-name"
            readOnly
            type="text"
            value={inviteData.companyName}
          />
          <FieldDescription>
            {messages.auth.completeSignup.ui.companyNameHelper}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="complete-signup-password">
            {messages.auth.completeSignup.ui.passwordLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.password}
            id="complete-signup-password"
            name="password"
            placeholder={messages.auth.completeSignup.ui.passwordPlaceholder}
            required
            type="password"
          />
          <FieldDescription>
            {messages.auth.completeSignup.ui.passwordHelper}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="complete-signup-confirm-password">
            {messages.auth.completeSignup.ui.confirmPasswordLabel}
          </FieldLabel>
          <Input
            disabled={isPending}
            error={state?.fieldErrors?.confirmPassword}
            id="complete-signup-confirm-password"
            name="confirmPassword"
            placeholder={
              messages.auth.completeSignup.ui.confirmPasswordPlaceholder
            }
            required
            type="password"
          />
        </Field>

        {state?.error ? (
          <div className="text-destructive text-sm">{state.error}</div>
        ) : null}

        <Button
          className="w-full"
          disabled={isPending}
          loading={isPending}
          loadingText={messages.auth.completeSignup.ui.submitButtonLoading}
          type="submit"
        >
          {messages.auth.completeSignup.ui.submitButton}
        </Button>
      </form>
    </div>
  );
}
