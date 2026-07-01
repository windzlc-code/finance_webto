import { EventLink } from "@/components/EventLink";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd, JsonLd } from "@/components/StructuredData";
import { TrackedFaqList, type TrackedFaqItem } from "@/components/TrackedFaqList";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "貸款常見 QA｜網路申貸、文件、資金用途與核貸提醒｜銀行俱樂部",
  description: "回答網路申貸上一頁當機、財力證明、申請金額年限、資金用途、年齡限制、平台身份與是否保證核貸等問題。",
  path: "/qa",
});

const qa: TrackedFaqItem[] = [
  { id: "application-back-button", question: "網路申貸點上一頁當機怎麼辦？", answer: "先不要重複送件或刷新多次，截圖保留狀態並聯繫專員協助確認。", href: "/application-flow" },
  { id: "credit-income-documents", question: "信貸財力證明需要哪些資料？", answer: "上班族常見薪轉、扣繳憑單、勞保資料；自營業主常見營業資料、流水與報稅資料。", href: "/documents" },
  { id: "employee-self-employed-docs", question: "上班族和自營業主文件差異是什麼？", answer: "上班族多以薪轉、扣繳憑單、勞保資料佐證收入；自營業主則常需要營業資料、銀行流水、報稅資料或其他可佐證收入的紀錄。", href: "/blog/employee-self-employed-income-documents" },
  { id: "high-risk-purpose", question: "資金用途填投資理財等用途需要注意什麼？", answer: "請依本人真實需求、銀行官方頁面、最新規則與個案審核結果填寫；網站不會指導包裝用途或填寫不實用途，不確定時先諮詢專員。", href: "/credit-loan" },
  { id: "official-form-fields", question: "網路申請表單中的申請金額、申請年限、案件來源和適用方案怎麼填？", answer: "這些是銀行官方申請欄位，不是網站承諾條件。應依真實需求、還款能力、資金用途及專員確認結果填寫，並以銀行頁面規則為準。", href: "/blog/credit-application-fields" },
  { id: "age-plus-term", question: "年齡加貸款年限超過 65 歲怎麼辦？", answer: "常見原則是年齡加貸款年限不超過 65 歲，但實際仍依銀行、方案、收入、信用與負債狀況審核。可先讓專員協助判斷可行年限。", href: "/blog/credit-loan-age-limit" },
  { id: "self-employed-no-payroll", question: "自營業主沒有薪資單怎麼辦？", answer: "沒有固定薪資單時，可先整理營業登記、銀行流水、報稅資料、合約或其他可佐證收入的資料，再由專員確認是否足夠。", href: "/documents" },
  { id: "paper-documents", question: "財力證明一定要紙本嗎？", answer: "不一定。銀行可能接受線上或影像資料，但高度敏感文件不建議直接上傳普通網站；應依銀行官方頁面或專員確認的授權通道補件。", href: "/application-flow" },
  { id: "official-platform", question: "平台是否銀行官方？", answer: "本平台是銀行服務人員媒合與貸款諮詢平台，非銀行或金融機構。", href: "/risk" },
  { id: "approval-guarantee", question: "是否保證核貸？", answer: "不保證核貸、額度、利率、年限或撥款結果，均以銀行最終審核為準。", href: "/consultation" },
  { id: "after-form-submit", question: "送出表單後會發生什麼事？", answer: "後台會建立線索並記錄來源、UTM、同意時間與需求類型；專員會依電話或 LINE 跟進，並在後台更新狀態與補件進度。", href: "/consultation" },
];

export default function QAPage() {
  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>常見 QA</h1>
          <p>把申請前最常卡住的問題先整理清楚。</p>
        </section>
        <TrackedFaqList items={qa} eventName="qa_toggle" sourcePage="qa" defaultOpenId={qa[0].id} />
        <section className="warning-block wide">
          <h2>問題還不確定？</h2>
          <p>如果不確定貸款類型、資金用途或文件是否足夠，可以先留下需求，由專員協助做初步整理。</p>
          <EventLink className="primary-btn" href="/consultation?source_page=qa" eventName="qa_form_click">
            填寫免費諮詢
          </EventLink>
        </section>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: qa.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
        <BreadcrumbJsonLd current="常見 QA" path="/qa" />
      </main>
    </PublicShell>
  );
}
