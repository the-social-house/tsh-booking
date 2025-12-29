import { redirect } from "next/navigation";

async function AdminPage() {
  // Redirect to rooms page as default
  redirect("/admin/rooms");
}

export default AdminPage;
