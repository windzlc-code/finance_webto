import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { EventLink } from "./EventLink";
import { Icon } from "./Icons";
import { PageViewTracker } from "./PageViewTracker";
import { PublicNav } from "./PublicNav";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { readDB } from "@/lib/store";
import type { Article, SiteSettings } from "@/lib/types";

const nav = [
  { label: "首頁", href: "/" },
  {
    label: "貸款服務",
    href: "/#loan-services",
    children: [
      { label: "信用貸款", href: "/credit-loan" },
      { label: "房屋貸款", href: "/house-loan" },
      { label: "企業貸款", href: "/business-loan" },
    ],
  },
  { label: "申辦流程", href: "/application-flow" },
  { label: "銀行資格與文件總整理", href: "/documents" },
  { label: "常見QA", href: "/qa" },
  { label: "免費諮詢預約", href: "/consultation" },
  { label: "FB 銀行俱樂部社團", href: "/facebook" },
  { label: "TFSE 金融站", href: "/index.html" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  const headerLineHref = lineHref(settings.lineUrl, { sourcePage: "header" });
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="銀行俱樂部首頁">
        <Image src="/brand/bank_club_logo.png" alt="國泰人壽綠色樹形 Logo" width={72} height={50} priority unoptimized />
        <span>銀行俱樂部</span>
      </Link>
      <PublicNav items={nav} />
      <div className="header-actions">
        <EventLink className="icon-btn" href="/blog#article-search" eventName="header_search_click" metadata={{ sourcePage: "header", destination: "/blog#article-search" }} ariaLabel="搜尋文章">
          <Icon name="search" />
        </EventLink>
        <EventLink className="line-btn" href={headerLineHref} eventName="header_line_click" target={headerLineHref.startsWith("http") ? "_blank" : undefined} ariaLabel="聯絡我們 / LINE 諮詢">
          <span className="line-dot">LINE</span>
          LINE諮詢
        </EventLink>
      </div>
    </header>
  );
}

export function Footer({
  settings,
  popularArticles,
  variant = "full",
}: {
  settings: SiteSettings;
  popularArticles: Article[];
  variant?: "full" | "reference";
}) {
  const footerLineHref = lineHref(settings.lineUrl, { sourcePage: "footer" });
  const footerFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "footer" });
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Image src="/brand/bank_club_logo.png" alt="國泰人壽綠色樹形 Logo" width={64} height={44} unoptimized />
          <div>
            <strong>銀行俱樂部</strong>
            <p>{settings.specialistName}｜{settings.specialistTitle}</p>
          </div>
        </div>
        <div>
          <h3>聯絡資訊</h3>
          <p>{settings.companyName}｜{settings.officeName}</p>
          <p>{settings.address}</p>
        </div>
        <div>
          <p>電話 {settings.phone}</p>
          <p>行動 {settings.mobile}</p>
          <p>Email {settings.email}</p>
        </div>
      </div>
      {variant === "full" ? (
        <>
          <div className="footer-cta">
            <EventLink href={footerLineHref} eventName="footer_line_click" className="footer-action" target={footerLineHref.startsWith("http") ? "_blank" : undefined}>
              LINE 一對一諮詢
            </EventLink>
            <EventLink href={footerFbHref} eventName="footer_fb_click" className="footer-action" target="_blank">
              FB 社團入口
            </EventLink>
            <EventLink href="/consultation?source_page=footer" eventName="footer_form_click" className="footer-action">
              免費諮詢預約
            </EventLink>
          </div>
          <div className="footer-popular">
            <h3>熱門文章</h3>
            <div>
              {popularArticles.map((article) => (
                <Link href={`/blog/${article.slug}`} key={article.id}>
                  {article.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="footer-links">
            <Link href="/credit-loan">信用貸款</Link>
            <Link href="/house-loan">房屋貸款</Link>
            <Link href="/business-loan">企業貸款</Link>
            <Link href="/documents">銀行資格與文件總整理</Link>
            <Link href="/facebook">FB 社團頁</Link>
            <Link href="/contact">LINE / 聯絡我們</Link>
            <Link href="/privacy">個資保護聲明</Link>
            <Link href="/risk">風險聲明</Link>
            <Link href="/terms">免責 / 服務條款</Link>
            <Link href="/site-map">網站地圖</Link>
            <a href="/admin/">後台管理</a>
          </div>
        </>
      ) : null}
      <p className="footer-note">
        本平台非銀行或金融機構，申請條件與審核結果以銀行為準。<Link href="/risk">風險聲明</Link>
      </p>
    </footer>
  );
}

export async function PublicShell({
  children,
  footerVariant = "full",
}: {
  children: React.ReactNode;
  footerVariant?: "full" | "reference";
}) {
  await connection();
  const db = await readDB();
  const settings = db.settings;
  const popularArticles = db.articles.filter((article) => article.status === "published").slice(0, 3);
  return (
    <>
      <PageViewTracker />
      <Header settings={settings} />
      {children}
      <Footer settings={settings} popularArticles={popularArticles} variant={footerVariant} />
    </>
  );
}
