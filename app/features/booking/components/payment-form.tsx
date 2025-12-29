"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import messages from "@/lib/messages.json";

type PaymentFormProps = {
  /**
   * Callback when payment succeeds
   */
  onSuccess: () => void;
  /**
   * Whether payment is being processed
   */
  isProcessing: boolean;
};

/**
 * Payment form component using Stripe Payment Element
 */
export function PaymentForm({ onSuccess, isProcessing }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = (message: string) => {
    setErrorMessage(message);
    setIsSubmitting(false);
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Payment flow requires multiple validation steps
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!(stripe && elements)) {
      handleError("Payment system not ready. Please refresh the page.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Submit payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        handleError(submitError.message || "An error occurred");
        return;
      }

      // Confirm payment
      const confirmResult = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      // According to Stripe docs: Check if error is null to determine success
      if (confirmResult.error) {
        handleError(confirmResult.error.message || "Payment failed");
        return;
      }

      // No error means payment was submitted successfully
      // If paymentIntent is returned and status is "requires_action", show error
      // Otherwise, let server verify the actual status (handles "succeeded", "processing", etc.)
      if (confirmResult.paymentIntent?.status === "requires_action") {
        handleError(
          "Additional authentication required. Please complete the verification."
        );
        return;
      }

      // Payment submitted successfully - let server verify and update booking
      // Server will check actual status via paymentIntentId
      setIsSubmitting(false);
      onSuccess();
    } catch (error) {
      handleError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage ? (
        <div className="text-destructive text-sm">{errorMessage}</div>
      ) : null}
      <Button
        className="w-full"
        disabled={!stripe || isSubmitting || isProcessing}
        loading={isSubmitting || isProcessing}
        loadingText="Processing payment..."
        type="submit"
      >
        {messages.bookings.ui.create.stripeButton}
      </Button>
    </form>
  );
}
