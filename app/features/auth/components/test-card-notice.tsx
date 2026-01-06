"use client";

import { InfoIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import messages from "@/lib/messages.json";

export function TestCardNotice() {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
      <CardContent>
        <div className="flex gap-3">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="flex-1 space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              {messages.auth.completeSignup.testCard.title}
            </h3>
            <p className="text-blue-800 text-sm dark:text-blue-200">
              {messages.auth.completeSignup.testCard.description}
            </p>
            <div className="mt-3 space-y-1 rounded border border-blue-200 bg-white p-3 font-mono text-sm dark:border-blue-800 dark:bg-blue-900">
              <div className="text-blue-900 dark:text-blue-100">
                <span className="text-blue-700 dark:text-blue-300">
                  {messages.auth.completeSignup.testCard.cardLabel}
                </span>{" "}
                {messages.auth.completeSignup.testCard.cardNumber}
              </div>
              <div className="text-blue-900 dark:text-blue-100">
                <span className="text-blue-700 dark:text-blue-300">
                  {messages.auth.completeSignup.testCard.expiryLabel}
                </span>{" "}
                {messages.auth.completeSignup.testCard.expiryInstruction}
              </div>
              <div className="text-blue-900 dark:text-blue-100">
                <span className="text-blue-700 dark:text-blue-300">
                  {messages.auth.completeSignup.testCard.cvcLabel}
                </span>{" "}
                {messages.auth.completeSignup.testCard.cvcInstruction}
              </div>
            </div>
            <span className="text-blue-900 text-sm underline dark:text-blue-100">
              <a
                href={messages.auth.completeSignup.testCard.documentationUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {messages.auth.completeSignup.testCard.documentationLink}
              </a>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
