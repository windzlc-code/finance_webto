import Image from "next/image";
import { connection } from "next/server";
import { PublicShell } from "@/components/PublicLayout";
import { EventLink } from "@/components/EventLink";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "聯絡我們｜銀行俱樂部",
  description: "銀行俱樂部聯絡資訊、LINE 一對一諮詢、電話、Email 與 FB 社團入口。",
  path: "/contact",
});

export default async function ContactPage() {
  await connection();
  const { settings } = await readDB();
  const contactLineHref = lineHref(settings.lineUrl, { sourcePage: "contact" });
  const contactFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "contact" });
  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>聯絡我們</h1>
          <p>LINE、電話與 Email 諮詢入口。</p>
        </section>
        <section className="contact-page content-section">
          <div className="contact-card">
            <Image src="/brand/bank_club_logo.png" alt="國泰人壽綠色樹形 Logo" width={132} height={92} unoptimized />
            <p className="muted-line">國泰金控 / 國泰人壽</p>
            <h2>{settings.specialistName}｜{settings.specialistTitle}</h2>
            <p>人身 / 財產保險業務員，資格測驗合格。</p>
            <p>{settings.companyName}｜{settings.officeName}</p>
            <p>{settings.address}</p>
            <p>電話 {settings.phone}｜傳真 {settings.fax}</p>
            <p>行動 {settings.mobile}｜Email {settings.email}</p>
            <p className="muted-line">正式上線前需確認 Logo、國泰金控與國泰人壽品牌文字對外使用規範。</p>
          </div>
          <div className="contact-card" id="line-qr">
            <h2>LINE 一對一諮詢</h2>
            <p>掃描 QR Code 加入專員，或使用手機直接開啟 LINE 入口。</p>
            <Image src={settings.lineQrCodeUrl} alt={`${settings.specialistName} LINE 一對一諮詢 QR Code`} width={176} height={176} unoptimized />
            <div className="hero-actions">
              <EventLink className="primary-btn" href={contactLineHref} eventName="contact_line_click" target={contactLineHref.startsWith("http") ? "_blank" : undefined}>
                開啟 LINE 諮詢
              </EventLink>
              <EventLink className="secondary-btn" href="/consultation?source_page=contact" eventName="contact_form_click">
                填寫免費預約
              </EventLink>
            </div>
          </div>
          <div className="contact-card">
            <h2>FB 銀行俱樂部社團</h2>
            <p>加入社團取得貸款流程、文件清單、常見問題與最新文章更新。</p>
            <EventLink className="secondary-btn" href={contactFbHref} eventName="contact_fb_click" target="_blank">
              加入 FB 社團
            </EventLink>
          </div>
          <div className="contact-card">
            <h2>個資權利與資料請求</h2>
            <p>若需查詢、補充、更正、停止利用或刪除諮詢資料，請透過 Email 聯繫，並提供可核對的姓名與手機後三碼。</p>
            <p>Email {settings.email}</p>
            <EventLink className="secondary-btn" href="/privacy" eventName="contact_privacy_click" metadata={{ sourcePage: "contact" }}>
              查看個資告知
            </EventLink>
          </div>
        </section>
        <BreadcrumbJsonLd current="聯絡我們" path="/contact" />
      </main>
    </PublicShell>
  );
}
