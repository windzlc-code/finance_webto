import Image from "next/image";
import { connection } from "next/server";
import { EventLink } from "@/components/EventLink";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "諮詢需求已送出｜銀行俱樂部",
  description: "銀行俱樂部已收到諮詢需求，使用者可加入 LINE 或 FB 社團加速後續聯繫。",
  path: "/success",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ lead_id?: string }> }) {
  const params = await searchParams;
  await connection();
  const db = await readDB();
  const { settings } = db;
  const leadId = params.lead_id || "";
  const creditApplication = db.creditApplications.find((application) => application.leadId === leadId);
  const houseLoanApplication = db.houseLoanApplications.find((application) => application.leadId === leadId);
  const businessLoanApplication = db.businessLoanApplications.find((application) => application.leadId === leadId);
  const applicationNo = creditApplication?.applicationNo || houseLoanApplication?.applicationNo || businessLoanApplication?.applicationNo || "";
  const successLineHref = lineHref(settings.lineUrl, { sourcePage: "success", leadId: params.lead_id || "" });
  const successFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "success", leadId: params.lead_id || "" });
  return (
    <PublicShell>
      <main className="subpage">
        <section className="success-panel">
          <h1>已收到您的諮詢需求</h1>
          <p>線索編號：{params.lead_id || "已建立"}</p>
          {applicationNo ? <p>申請編號：{applicationNo}</p> : null}
          <p>專員會依您留下的手機或 LINE ID 跟進。若想加快溝通，可直接掃描 QR Code 或加入 FB 社團。</p>
          <div className="success-contact">
            <div>
              <strong>{settings.specialistName}</strong>
              <span>{settings.specialistTitle}</span>
              <span>行動 {settings.mobile}</span>
              <span>Email {settings.email}</span>
            </div>
            <Image src={settings.lineQrCodeUrl} alt={`${settings.specialistName} LINE 一對一諮詢 QR Code`} width={160} height={160} unoptimized />
          </div>
          <div className="hero-actions">
            <EventLink className="primary-btn" href={successLineHref} eventName="success_line_click" leadId={params.lead_id || ""} target={successLineHref.startsWith("http") ? "_blank" : undefined}>
              加入 LINE 諮詢
            </EventLink>
            <EventLink className="secondary-btn" href={successFbHref} eventName="success_fb_click" leadId={params.lead_id || ""} target="_blank">
              加入 FB 社團
            </EventLink>
          </div>
          <div className="success-notice">
            <strong>補件提醒</strong>
            <p>信用貸款只在專用模組收身分證正反面；財力證明、房貸權狀與企業報稅等敏感文件，請先透過 LINE 與專員確認補件方式。</p>
            {creditApplication ? (
              <p>身分證上傳狀態：{creditApplication.idUploadStatus}。財力證明請傳 LINE 給專員確認，不要再透過本站上傳薪轉、扣繳憑單或報稅資料。</p>
            ) : (
              <p>請先透過 LINE 與專員確認補件方式，再提供權狀、財力證明、薪轉、報稅、銀行流水或營業資料等文件。</p>
            )}
            <p>請勿在一般備註或聊天室中貼上完整身分證字號、銀行帳號、稅務文件內容；補件方式以專員確認的安全通道為準。</p>
          </div>
        </section>
        <BreadcrumbJsonLd current="諮詢需求已送出" path="/success" />
      </main>
    </PublicShell>
  );
}
