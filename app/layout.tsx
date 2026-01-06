import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

import { HeaderWrapper } from "@/components/layout/header-wrapper";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = createPageMetadata(
  messages.metadata.site.name,
  messages.metadata.site.description
);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <HeaderWrapper />
        <main className="py-10">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
