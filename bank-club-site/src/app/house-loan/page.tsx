import { connection } from "next/server";
import { LoanCalculator } from "@/components/Calculators";
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
  title: "房屋貸款諮詢｜增貸、轉增貸、二胎房貸、購屋貸款｜銀行行員俱樂部",
  description: "房屋貸款分類、文件清單、鑑價到撥款流程與月付試算工具。",
  path: "/house-loan",
});

export default async function HouseLoanPage() {
  await connection();
  const { settings } = await readDB();
  const houseLineHref = lineHref(settings.lineUrl, { sourcePage: "house" });
  const houseFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "house" });
  const tabs: LoanPageTab[] = [
    {
      id: "house-types",
      label: "房貸類型",
      title: "先選擇房貸需求",
      description: "房貸頁只保留計劃要求的購屋、增貸、轉增貸、二胎與修繕情境。",
      content: (
        <section className="card-grid">
          {[
            ["購屋首貸", "購屋中或準備買房，先整理收入、頭期款與預估房價。"],
            ["房屋增貸", "已有房產想增加資金，需看鑑價、既有貸款與收入負債比。"],
            ["轉增貸", "評估轉貸並增加可用資金，需比較目前銀行、剩餘本金與成本。"],
            ["二胎房貸", "已有一胎設定時評估第二順位方案，條件與成本需由專員初評。"],
            ["老屋修繕貸款", "修繕、整修或裝潢用途，依房屋條件與資金用途整理。"],
          ].map(([item, text]) => (
            <article className="small-card" key={item}>
              <h3>{item}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
      ),
    },
    {
      id: "house-documents",
      label: "文件提醒",
      title: "房貸文件先整理，不在普通表單上傳",
      description: "依計劃文件，權狀、稅單、收入證明等敏感資料由 LINE 或專員確認補件方式。",
      content: (
        <section className="two-col loan-tab-grid">
          <div className="info-block">
            <h3>申請前準備</h3>
            <ul>
              <li>身分證、房屋權狀、收入證明、稅單、銀行存摺。</li>
              <li>房屋所在地、房屋類型、用途與持有狀態。</li>
              <li>預估市值、目前銀行、剩餘貸款金額與期望貸款年限。</li>
            </ul>
          </div>
          <div className="warning-block">
            <h3>本站資料邊界</h3>
            <p>本站房貸申請表不收權狀、稅單、收入證明或存摺影本。送出申請後，專員會透過電話或 LINE 確認補件方式。</p>
          </div>
        </section>
      ),
    },
    {
      id: "house-flow",
      label: "申請步驟",
      title: "房貸鑑價到撥款流程",
      description: "把站內申請、專員初評與銀行審核拆成清楚步驟。",
      content: (
        <ol className="step-list compact-steps">
          <li>選擇房貸類型：購屋首貸、增貸、轉增貸、二胎或修繕。</li>
          <li>填寫房屋地區、類型、用途、持有狀態、預估市值與是否已有貸款。</li>
          <li>填寫期望金額、年限、資金用途與是否需要寬限期。</li>
          <li>送出站內申請並取得房貸申請編號。</li>
          <li>專員協助整理房產條件、收入資料與補件清單。</li>
          <li>銀行進行鑑價、審核、對保與撥款，結果以銀行最終審核為準。</li>
        </ol>
      ),
    },
    {
      id: "house-apply",
      label: "站內申請",
      title: "房屋貸款申請表",
      description: "送出後會產生房貸申請編號，後台自動標記為房屋貸款案件，專員再透過電話或 LINE 跟進補件。",
      content: (
        <div id="house-application" className="loan-application-card">
          <ConsultationForm defaultLoanType="house" defaultIdentityType="home_owner" />
        </div>
      ),
    },
  ];

  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>房屋貸款</h1>
          <p>購屋首貸、房屋增貸、轉增貸、二胎房貸與老屋修繕貸款諮詢。</p>
          <div className="hero-actions">
            <EventLink className="primary-btn" href="#house-apply" eventName="house_form_click" metadata={{ loanType: "house", sourcePage: "house" }}>
              開始房貸站內申請
            </EventLink>
            <EventLink className="secondary-btn" href={houseLineHref} eventName="house_line_click" target={houseLineHref.startsWith("http") ? "_blank" : undefined} metadata={{ loanType: "house", sourcePage: "house" }}>
              LINE 詢問專員
            </EventLink>
            <EventLink className="secondary-btn" href={houseFbHref} eventName="house_fb_click" target="_blank" metadata={{ loanType: "house", sourcePage: "house" }}>
              加入 FB 社團
            </EventLink>
          </div>
        </section>
        <FinancialDisclosure />
        <LoanPageTabs tabs={tabs} defaultTabId="house-apply" />
        <LoanCalculator title="房貸月付試算" />
        <BreadcrumbJsonLd current="房屋貸款" path="/house-loan" />
      </main>
    </PublicShell>
  );
}
