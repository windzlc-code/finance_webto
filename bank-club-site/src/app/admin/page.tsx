import { AdminApp } from "@/components/AdminApp";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "後台管理｜銀行俱樂部",
  description: "銀行俱樂部後台管理入口，僅限授權管理員使用。",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return <AdminApp />;
}
