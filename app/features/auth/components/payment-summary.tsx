"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PaymentSummaryProps = {
  subscriptionName: string;
  amount: number; // in DKK
  currency: string;
};

export function PaymentSummary({
  subscriptionName,
  amount,
  currency,
}: PaymentSummaryProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subscription:</span>
            <span className="font-medium">{subscriptionName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Billing period:</span>
            <span className="font-medium">Monthly</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-base">
          <span>Total:</span>
          <span>{formatCurrency(amount)}</span>
        </div>

        <div className="rounded-md bg-muted p-3 text-muted-foreground text-sm">
          <p className="mb-1 font-medium">Accepted payment methods:</p>
          <p>Credit cards, debit cards</p>
        </div>
      </CardContent>
    </Card>
  );
}
