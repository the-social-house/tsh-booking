import type { Metadata } from "next";
import messages from "@/lib/messages.json";

const siteName = messages.metadata.site.name;
const siteDescription = messages.metadata.site.description;
const logoPath = "/tsh-logo.svg";

export function createPageMetadata(
  pageTitle: string,
  description?: string
): Metadata {
  const fullTitle = `${pageTitle} | ${siteName}`;
  const finalDescription = description ?? siteDescription;

  return {
    title: fullTitle,
    description: finalDescription,
    openGraph: {
      title: fullTitle,
      description: finalDescription,
      siteName,
      images: [
        {
          url: logoPath,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: finalDescription,
      images: [logoPath],
    },
  };
}
