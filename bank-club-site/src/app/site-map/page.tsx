import Link from "next/link";
import { connection } from "next/server";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "網站地圖｜銀行行員俱樂部",
  description: "銀行行員俱樂部完整網站地圖，整理貸款服務、申辦流程、常見 QA、文章、聯絡入口與法務頁面。",
  path: "/site-map",
});

const serviceLinks = [
  { href: "/", label: "首頁", note: "信貸、房貸、企業貸與免費評估入口" },
  { href: "/credit-loan", label: "信用貸款", note: "網路申辦流程、資格、文件與資金用途提醒" },
  { href: "/house-loan", label: "房屋貸款", note: "增貸、轉增貸、二胎房貸與房貸試算" },
  { href: "/business-loan", label: "企業貸款", note: "營運週轉、企業信用貸與文件準備" },
];

const workflowLinks = [
  { href: "/application-flow", label: "申請流程教學", note: "線上申請、文件拍攝、頁面當機與等待審核" },
  { href: "/qa", label: "常見 QA", note: "平台身份、核貸限制、用途風險與文件問題" },
  { href: "/consultation", label: "免費諮詢預約", note: "留下需求並由專員跟進" },
  { href: "/facebook", label: "FB 銀行行員俱樂部社團", note: "社團福利、熱門文章與 LINE 入口" },
  { href: "/contact", label: "聯絡我們 / LINE 諮詢", note: "電話、Email、地址、QR Code 與 FB 入口" },
];

const legalLinks = [
  { href: "/privacy", label: "隱私權政策與個資告知" },
  { href: "/risk", label: "金融風險聲明" },
  { href: "/terms", label: "服務條款" },
  { href: "/sitemap.xml", label: "XML Sitemap" },
  { href: "/robots.txt", label: "Robots.txt" },
];

const adminLinks = [
  { href: "/admin/", label: "公共後台登入頁", note: "銀行行員俱樂部與金融站共用的管理入口" },
  { href: "/admin/", label: "公共後台儀表板", note: "集中查看網站資料、線索與營運摘要" },
];

function LinkGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ href: string; label: string; note?: string }>;
}) {
  return (
    <section className="site-map-group">
      <h2>{title}</h2>
      <div className="site-map-links">
        {items.map((item) => (
          <Link href={item.href} key={item.href}>
            <strong>{item.label}</strong>
            {item.note ? <span>{item.note}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function SiteMapPage() {
  await connection();
  const db = await readDB();
  const articleLinks = db.articles
    .filter((article) => article.status === "published")
    .map((article) => ({
      href: `/blog/${article.slug}`,
      label: article.title,
      note: `${article.category}｜${article.excerpt}`,
    }));
  const fileLinks = db.files
    .filter((file) => file.visibility === "public")
    .map((file) => ({
      href: `/api/files/${file.id}/download`,
      label: file.title,
      note: `${file.description}｜版本 ${file.version}`,
    }));

  return (
    <PublicShell>
      <main className="site-map-page">
        <div className="site-map-hero">
          <h1>網站地圖</h1>
          <p>從貸款服務、申辦流程、文件清單到文章與法務頁面，所有主要入口集中整理。</p>
        </div>
        <LinkGroup title="貸款服務" items={serviceLinks} />
        <LinkGroup title="流程、文件與諮詢入口" items={workflowLinks} />
        <LinkGroup title="貸款知識文章" items={[{ href: "/blog", label: "部落格文章列表", note: "首批 SEO 文章與 FB 社團導流內容" }, ...articleLinks]} />
        <LinkGroup title="公開文件下載" items={fileLinks} />
        <LinkGroup title="後台管理" items={adminLinks} />
        <LinkGroup title="法務、SEO 與技術入口" items={legalLinks} />
        <BreadcrumbJsonLd current="網站地圖" path="/site-map" />
      </main>
    </PublicShell>
  );
}
