import type { Metadata } from "next";
import { redirect } from "next/navigation";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.admin.root.title,
  messages.metadata.admin.root.description
);

async function AdminPage() {
  // Redirect to rooms page as default
  redirect("/admin/rooms");
}

export default AdminPage;
