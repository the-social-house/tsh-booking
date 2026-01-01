"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAllSubscriptions } from "@/app/features/admin/actions/get-all-subscriptions";
import type { AdminUser } from "@/app/features/admin/actions/get-all-users-admin";
import { updateUserSubscription } from "@/app/features/admin/actions/update-user-subscription";
import type { Subscription } from "@/app/features/admin/lib/subscription.schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatErrorForToast } from "@/lib/form-errors";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";

type UpdateSubscriptionDialogProps = Readonly<{
  user: AdminUser;
}>;

export function UpdateSubscriptionDialog({
  user,
}: UpdateSubscriptionDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSubscriptions = async () => {
        const result = await getAllSubscriptions();
        if (hasData(result)) {
          setSubscriptions(result.data);
          // Set current subscription as default
          const currentSubscription = user.subscriptions;
          if (
            currentSubscription &&
            typeof currentSubscription === "object" &&
            "subscription_id" in currentSubscription
          ) {
            setSelectedSubscriptionId(
              currentSubscription.subscription_id as string
            );
          }
        }
      };
      fetchSubscriptions();
    }
  }, [isOpen, user]);

  async function handleUpdateSubscription() {
    if (!selectedSubscriptionId) {
      toast.error(messages.admin.ui.tabs.users.subscription.dialogNoSelection);
      return;
    }

    setIsProcessing(true);

    const result = await updateUserSubscription({
      userId: user.user_id,
      subscriptionId: selectedSubscriptionId,
    });

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));
      setIsProcessing(false);
      return;
    }

    if (hasData(result)) {
      toast.success(messages.admin.ui.tabs.users.subscription.dialogSuccess);
      setIsOpen(false);
      setIsProcessing(false);
      router.refresh();
    } else {
      toast.error(messages.admin.ui.tabs.users.subscription.dialogError);
      setIsProcessing(false);
    }
  }

  const currentSubscription = user.subscriptions;
  const currentSubscriptionName =
    currentSubscription &&
    typeof currentSubscription === "object" &&
    "subscription_name" in currentSubscription
      ? currentSubscription.subscription_name
      : "";

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="h-4 w-4" />
          {messages.admin.ui.tabs.users.actions.updateSubscription}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {messages.admin.ui.tabs.users.subscription.dialogTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {messages.admin.ui.tabs.users.subscription.dialogDescription}
            <span className="mt-2 block font-medium text-foreground">
              {user.user_company_name} ({currentSubscriptionName})
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Select
            onValueChange={setSelectedSubscriptionId}
            value={selectedSubscriptionId || undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  messages.admin.ui.tabs.users.subscription
                    .dialogSelectPlaceholder
                }
              />
            </SelectTrigger>
            <SelectContent>
              {subscriptions.map((subscription) => (
                <SelectItem
                  key={subscription.subscription_id}
                  value={subscription.subscription_id}
                >
                  {subscription.subscription_name} (
                  {subscription.subscription_monthly_price.toFixed(2)}{" "}
                  {messages.common.units.currency}/mo)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            {messages.admin.ui.tabs.users.subscription.dialogCancel}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={isProcessing || !selectedSubscriptionId}
              loading={isProcessing}
              loadingText={
                messages.admin.ui.tabs.users.subscription.dialogConfirmLoading
              }
              onClick={handleUpdateSubscription}
            >
              {messages.admin.ui.tabs.users.subscription.dialogConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
