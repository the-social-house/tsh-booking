"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { confirmPayment } from "@/app/features/booking/actions/confirm-payment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hasData, hasError } from "@/lib/supabase-response";
import { PaymentForm } from "./payment-form";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type StripePaymentModalProps = {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Client secret from PaymentIntent
   */
  clientSecret: string;
  /**
   * Payment Intent ID
   */
  paymentIntentId: string;
  /**
   * Booking ID to update after payment
   */
  bookingId: number;
  /**
   * Callback when payment succeeds
   */
  onSuccess?: () => void;
};

/**
 * Stripe payment modal component
 * Wraps Stripe Elements provider and payment form
 */
export function StripePaymentModal({
  isOpen,
  onClose,
  clientSecret,
  paymentIntentId,
  bookingId,
  onSuccess,
}: StripePaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  // Reset payment succeeded state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentSucceeded(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const showErrorToast = (error: {
    message: string;
    details?: string;
    hint?: string;
  }) => {
    const errorDetails = error.details ? `\nDetails: ${error.details}` : "";
    const errorHint = error.hint ? `\nHint: ${error.hint}` : "";
    toast.error(`${error.message}${errorDetails}${errorHint}`, {
      duration: 10_000,
    });
  };

  const handlePaymentError = (error: {
    message: string;
    details?: string;
    hint?: string;
  }) => {
    showErrorToast(error);
    setIsProcessing(false);
  };

  const handlePaymentConfirmed = () => {
    setPaymentSucceeded(true);
    setIsProcessing(false);
    // Call onSuccess which will show success toast and handle cleanup
    // Don't call onClose() here as it would trigger cancellation
    onSuccess?.();
  };

  const handlePaymentSuccess = async () => {
    // Prevent multiple calls
    if (isProcessing || paymentSucceeded) {
      return;
    }
    setIsProcessing(true);
    try {
      // Small delay to ensure Stripe has processed the payment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Confirm payment and update booking
      const result = await confirmPayment({
        paymentIntentId,
        bookingId,
      });

      if (hasError(result)) {
        handlePaymentError(result.error);
        return;
      }

      if (hasData(result)) {
        handlePaymentConfirmed();
        return;
      }

      toast.error(
        "Payment confirmation incomplete. Please check your booking status.",
        {
          duration: 10_000,
        }
      );
      setIsProcessing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to confirm payment",
        {
          duration: 10_000,
        }
      );
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return null;
  }

  const handleClose = (open: boolean) => {
    // If modal is closing and payment didn't succeed, cancel the booking
    if (!(open || paymentSucceeded)) {
      onClose(); // This will trigger handlePaymentCancel
    }
    // If payment succeeded, don't call onClose (which would cancel booking)
    // The modal will close naturally via onSuccess handler
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Enter your payment details to confirm your booking
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          <Elements
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
              },
              locale: "da", // Danish locale for DKK currency
            }}
            stripe={stripePromise}
          >
            <PaymentForm
              isProcessing={isProcessing}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
}
