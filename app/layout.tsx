import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { HeaderWrapper } from "@/components/layout/header-wrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Social House Booking",
  description: "Book your meeting room at The Social House",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <HeaderWrapper />
        <main className="my-10">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
