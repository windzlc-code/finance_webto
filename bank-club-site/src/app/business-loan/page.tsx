import { connection } from "next/server";
import { ConsultationForm } from "@/components/ConsultationForm";
import { EventLink } from "@/components/EventLink";
import { FinancialDisclosure } from "@/components/FinancialDisclosure";
import { LoanPageTabs, type LoanPageTab } from "@/components/LoanPageTabs";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "企業貸款諮詢｜中小企業營運週轉、企業信用貸、廠房抵押貸｜銀行行員俱樂部",
  description: "企業貸款分類、申請文件、審核重點與常見驳件原因整理。",
  path: "/business-loan",
});

export default async function BusinessLoanPage() {
  await connection();
  const { settings } = await readDB();
  const businessLineHref = lineHref(settings.lineUrl, { sourcePage: "business" });
  const businessFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "business" });
  const tabs: LoanPageTab[] = [
    {
      id: "business-types",
      label: "產品分類",
      title: "企業貸款分類",
      description: "保留計劃文件中的中小企業營運週轉、企業信用貸與廠房抵押貸三條主線。",
      content: (
        <section className="card-grid">
          <article className="small-card">
            <h3>企業信用貸</h3>
            <p>以企業營運狀況、負責人信用、收入資料與既有負債做初步評估。</p>
          </article>
          <article className="small-card">
            <h3>營運週轉金</h3>
            <p>以營收、流水、報稅資料與真實資金用途評估，適合中小企業週轉需求。</p>
          </article>
          <article className="small-card">
            <h3>廠房抵押貸</h3>
            <p>需整理廠房或不動產條件、鑑價、既有設定與可用額度。</p>
          </article>
        </section>
      ),
    },
    {
      id: "business-documents",
      label: "文件提醒",
      title: "企業資料先填寫，敏感文件後續補件",
      description: "普通網頁表單不收報稅資料、存摺、執照或負責人財力證明影本。",
      content: (
        <section className="two-col loan-tab-grid">
          <div className="info-block">
            <h3>站內申請要填</h3>
            <ul>
              <li>公司 / 商號名稱、統編或登記編號、企業型態。</li>
              <li>產業類別、營業年數、員工人數、企業所在地。</li>
              <li>月平均營收、近一年營業額、既有貸款與抵押品狀況。</li>
            </ul>
          </div>
          <div className="warning-block">
            <h3>LINE 補件確認</h3>
            <ul>
              <li>營業登記或營業執照。</li>
              <li>報稅資料、近 6 個月銀行存摺、公司財務資料。</li>
              <li>負責人身分資料與財力證明。</li>
            </ul>
          </div>
        </section>
      ),
    },
    {
      id: "business-flow",
      label: "申請步驟",
      title: "企業貸站內申請步驟",
      description: "把企業資料、營運資料、貸款需求與補件狀態整理成可追蹤案件。",
      content: (
        <ol className="step-list compact-steps">
          <li>選擇企業信用貸、營運週轉金或廠房不動產抵押貸。</li>
          <li>填寫負責人聯絡資料與公司 / 商號基本資料。</li>
          <li>填寫營業年數、所在地、月營收、近一年營業額與員工人數。</li>
          <li>填寫期望金額、還款年限、資金用途、抵押品與既有企業貸款狀況。</li>
          <li>送出後生成企業貸申請編號，後台記錄為企業貸案件。</li>
          <li>專員透過 LINE 確認報稅資料、存摺、執照與負責人財力證明補件方式。</li>
        </ol>
      ),
    },
    {
      id: "business-apply",
      label: "站內申請",
      title: "企業貸款申請表",
      description: "送出後後台會標記為企業貸款案件，優先由專員依企業資料初評。",
      content: (
        <div id="business-application" className="loan-application-card">
          <ConsultationForm defaultLoanType="business" defaultIdentityType="business_owner" />
        </div>
      ),
    },
  ];

  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>企業貸款</h1>
          <p>中小企業營運週轉、企業信用貸與廠房不動產抵押貸，先整理資料再對接銀行審核。</p>
          <div className="hero-actions">
            <EventLink className="primary-btn" href="#business-apply" eventName="business_form_click" metadata={{ loanType: "business", sourcePage: "business" }}>
              開始企業貸站內申請
            </EventLink>
            <EventLink className="secondary-btn" href={businessLineHref} eventName="business_line_click" target={businessLineHref.startsWith("http") ? "_blank" : undefined} metadata={{ loanType: "business", sourcePage: "business" }}>
              LINE 詢問專員
            </EventLink>
            <EventLink className="secondary-btn" href={businessFbHref} eventName="business_fb_click" target="_blank" metadata={{ loanType: "business", sourcePage: "business" }}>
              加入 FB 社團
            </EventLink>
          </div>
        </section>
        <FinancialDisclosure />
        <LoanPageTabs tabs={tabs} defaultTabId="business-apply" />
        <BreadcrumbJsonLd current="企業貸款" path="/business-loan" />
      </main>
    </PublicShell>
  );
}
