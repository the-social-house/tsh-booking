import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/app/features/admin/components/admin-nav";
import { AmenitiesTable } from "@/app/features/admin/components/amenities/amenities-table";
import { getAmenities } from "@/app/features/amenities/actions/get-amenities";
import { requireAdmin } from "@/app/features/auth/lib/require-admin";
import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import messages from "@/lib/messages.json";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata(
  messages.metadata.admin.amenities.title,
  messages.metadata.admin.amenities.description
);

async function AdminAmenitiesPage() {
  // Verify admin access
  const adminResult = await requireAdmin();
  if (adminResult.error || !adminResult.user) {
    redirect("/");
  }

  const amenitiesPromise = getAmenities();

  return (
    <TwoColumnLayout
      left={
        <>
          <AdminNav />
          <AmenitiesTable amenitiesPromise={amenitiesPromise} />
        </>
      }
      variant="full"
    />
  );
}

export default AdminAmenitiesPage;
