import { Building2, Home } from "lucide-react";
import Link from "next/link";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { Button } from "@/components/ui/button";
import Heading from "@/components/ui/heading";
import messages from "@/lib/messages.json";

export default function NotFound() {
  return (
    <TwoColumnLayout
      className="h-[calc(100vh-var(--header-height)-var(--spacing)*20)]"
      left={
        <section>
          <div className="space-y-4">
            <Heading as="h1" size="h1">
              {messages.notFound.ui.title}
            </Heading>
            <p className="text-balance text-lg text-muted-foreground">
              {messages.notFound.ui.description}
            </p>
          </div>
        </section>
      }
      leftClassName="flex flex-col items-center justify-center max-md:text-center"
      right={
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" variant="default">
            <Link href="/">
              <Home className="size-4" />
              {messages.notFound.ui.backHome}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/rooms">
              <Building2 className="size-4" />
              {messages.notFound.ui.viewAllRooms}
            </Link>
          </Button>
        </div>
      }
      rightClassName="flex flex-col items-center justify-center"
      variant="left-narrow"
    />
  );
}
