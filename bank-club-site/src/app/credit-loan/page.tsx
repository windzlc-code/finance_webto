import { connection } from "next/server";
import { ConsultationForm } from "@/components/ConsultationForm";
import { EventLink } from "@/components/EventLink";
import { FinancialDisclosure } from "@/components/FinancialDisclosure";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd, JsonLd } from "@/components/StructuredData";
import { TrackedFaqList, type TrackedFaqItem } from "@/components/TrackedFaqList";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "信用貸款申請指南｜網路申辦流程、文件準備、公司優惠綁約注意事項｜銀行俱樂部",
  description: "整理信用貸款資格、文件、網路申辦 SOP、資金用途風險與 LINE 一對一諮詢入口。",
  path: "/credit-loan",
});

const creditFaqs: TrackedFaqItem[] = [
  {
    id: "credit-official-fields",
    question: "申請金額、年限、案件來源和適用方案可以怎麼填？",
    answer: "這些屬於銀行官方申請欄位，不是網站承諾條件。請依真實需求、還款能力、資金用途與專員確認結果填寫，並以銀行官方頁面規則為準。",
    href: "/blog/credit-application-fields",
  },
  {
    id: "credit-high-risk-purpose",
    question: "資金用途可以填投資理財或股票操作嗎？",
    answer: "資金用途必須依本人真實需求、銀行官方頁面、最新規則與個案審核結果填寫；不確定時先諮詢專員，不能為了送件而包裝或偽造用途。",
    href: "/blog/loan-purpose-risk",
  },
  {
    id: "credit-income-documents",
    question: "財力證明要直接上傳到網站嗎？",
    answer: "本站信貸申請只收身分證正反面；薪轉、扣繳憑單、報稅資料等財力證明不要上傳本站，請透過 LINE 與專員確認補件方式。",
    href: "/documents",
  },
  {
    id: "credit-back-button-crash",
    question: "銀行官方申請頁當機或上一頁中斷怎麼辦？",
    answer: "先保留畫面截圖，不要重複送件或連續刷新，回到 LINE 或表單聯繫專員協助確認下一步。",
    href: "/application-flow",
  },
];

export default async function CreditLoanPage() {
  await connection();
  const { settings } = await readDB();
  const creditLineHref = lineHref(settings.lineUrl, { sourcePage: "credit" });
  const creditFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "credit" });
  const creditTips = [
    {
      id: "eligibility",
      icon: "資",
      title: "資格快速看",
      text: "一般以 18 至 65 歲、現職半年以上、年收入 NT25 萬以上、信用紀錄正常為基本參考，最後仍依銀行個案審核。",
    },
    {
      id: "documents-compliance",
      icon: "證",
      title: "文件 / 合規",
      text: "本站信貸申請只上傳身分證正反面；財力證明請透過 LINE 確認。銀行俱樂部為銀行服務人員媒合與諮詢平台，不保證核貸、額度、利率或撥款結果。",
    },
  ];
  const documentGuides = [
    {
      title: "本站上傳",
      tone: "info",
      items: ["身分證正面照片，需清楚對焦、四角完整。", "身分證反面照片，避免反光、模糊與裁切。", "支援 JPG、PNG、HEIC，表單會檢查格式、大小、預覽與缺件。"],
    },
    {
      title: "不要上傳本站",
      tone: "warning",
      items: ["薪轉、薪資單、扣繳憑單、報稅資料等財力證明。", "自營業主 401/403 表、金融機構存摺、完稅資料。", "上述資料請先透過 LINE 與專員確認補件方式。"],
    },
  ];
  const applicationSteps = [
    "準備身分證正反面，確認照片清楚、完整、無反光。",
    "填寫姓名、手機、LINE ID、身份類型與預約時段。",
    "確認申請金額 700 萬、申請年限 10 年、案件來源公司優惠貸款、適用綁約方案。",
    "依真實需求選擇資金用途；不確定時選「先諮詢專員」。",
    "上傳身分證正反面，財力證明改用 LINE 與專員確認。",
    "送出後保留申請編號；若上傳失敗或資料誤填，使用站內修改或聯繫專員。",
  ];

  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>信用貸款</h1>
          <p>上班族、自營業主高額信貸、公司優惠貸款與網路申辦注意事項一次整理。</p>
          <div className="hero-actions">
            <EventLink className="primary-btn" href="#credit-application" eventName="credit_form_click" metadata={{ loanType: "credit", sourcePage: "credit" }}>
              開始信貸網路申請
            </EventLink>
            <EventLink className="secondary-btn" href={creditLineHref} eventName="credit_line_click" target={creditLineHref.startsWith("http") ? "_blank" : undefined} metadata={{ loanType: "credit", sourcePage: "credit" }}>
              LINE 詢問專員
            </EventLink>
            <EventLink className="secondary-btn" href={creditFbHref} eventName="credit_fb_click" target="_blank" metadata={{ loanType: "credit", sourcePage: "credit" }}>
              加入 FB 社團
            </EventLink>
          </div>
        </section>
        <section className="loan-tip-dock credit-guide-dock" aria-label="信貸申請前指南">
          <div className="section-heading compact-heading">
            <h2>申請前指南</h2>
            <p>資格、文件邊界與申請步驟先整理在表單上方；填寫時只要照著下方順序確認即可。</p>
          </div>
          <section className="credit-guide-section" aria-label="資格與文件小貼士">
            <div className="credit-guide-section-heading">
              <span className="guide-kicker">小提示</span>
              <h3>先看資格與文件邊界</h3>
              <p>這一區只放申請前的提醒，幫你先分清哪些資料可填、哪些文件不要直接上傳本站。</p>
            </div>
            <div className="credit-tip-stack">
              {creditTips.map((tip) => (
                <article className="credit-tip-card" key={tip.id}>
                  <span aria-hidden="true">{tip.icon}</span>
                  <div>
                    <h3>{tip.title}</h3>
                    <p>{tip.text}</p>
                  </div>
                </article>
              ))}
              <div className="document-guide-grid">
                {documentGuides.map((guide) => (
                  <article className={`document-guide-card ${guide.tone === "warning" ? "warning" : ""}`} key={guide.title}>
                    <h3>{guide.title}</h3>
                    <ul>
                      {guide.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section className="credit-guide-section application-step-section" aria-label="申請步驟指南">
            <div className="credit-guide-section-heading">
              <span className="guide-kicker">申請步驟指南</span>
              <h3>照著 6 步完成站內信貸申請</h3>
              <p>這一區只保留操作流程，照順序完成基本資料、方案欄位與身分證上傳即可。</p>
            </div>
            <article className="application-step-guide">
              <ol className="mini-step-list">
                {applicationSteps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </article>
          </section>
        </section>
        <FinancialDisclosure />
        <section className="credit-standalone-application" id="credit-application">
          <div className="section-heading">
            <h2>站內信貸網路申請</h2>
            <p>請填寫真實資料並上傳身分證正反面。薪轉、扣繳憑單、報稅資料等財力證明請改透過 LINE 與專員確認。</p>
          </div>
          <div className="loan-application-card">
            <ConsultationForm defaultLoanType="credit" defaultIdentityType="employee" />
          </div>
        </section>
        <section className="content-section narrow">
          <div className="section-heading">
            <h2>信貸常見問題</h2>
            <p>把網路申辦最容易填錯或中斷的問題做成可展開問答，點擊會寫入事件表，方便後續統計使用者卡點。</p>
          </div>
          <TrackedFaqList items={creditFaqs} eventName="credit_faq_toggle" sourcePage="credit" defaultOpenId={creditFaqs[0].id} />
        </section>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: creditFaqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
        <BreadcrumbJsonLd current="信用貸款" path="/credit-loan" />
      </main>
    </PublicShell>
  );
}
