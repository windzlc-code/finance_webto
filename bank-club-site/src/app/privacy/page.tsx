import { connection } from "next/server";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "隱私權政策與個資告知｜銀行俱樂部",
  description: "說明銀行俱樂部貸款諮詢資料蒐集目的、資料類別、使用方式與查詢、更正、停止利用、刪除權利。",
  path: "/privacy",
});

export default async function PrivacyPage() {
  await connection();
  const { settings } = await readDB();
  return (
    <PublicShell>
      <main className="legal-page">
        <h1>隱私權政策與個資告知</h1>
        <section>
          <h2>告知主體與蒐集目的</h2>
          <p>平台名稱：{settings.brandName}。本平台為銀行服務人員媒合與貸款諮詢平台，非銀行或金融機構。</p>
          <p>資料蒐集目的為貸款諮詢、資格初步評估、專員電話或 LINE 聯繫、服務紀錄、來源追蹤、後續案件管理與法令或爭議處理所需紀錄。</p>
        </section>
        <section>
          <h2>蒐集資料類別</h2>
          <p>第一階段表單蒐集姓名、手機、LINE ID、身份類型、貸款類型、期望金額、預約時段、資金用途、備註、房屋或企業初步資料、來源參數、同意時間、IP 與 user agent。</p>
          <p>信用貸款站內申請會在專用安全模組收取身分證正反面照片，用於專員初步確認與後續申請提醒；財力證明、銀行存摺影本、稅務文件、房屋權狀與企業報稅資料不在普通表單上傳，應先透過 LINE 與專員確認補件方式、授權通道與必要性。</p>
        </section>
        <section>
          <h2>利用期間、地區、對象與方式</h2>
          <p>利用期間以諮詢服務、案件跟進、法令保存或爭議處理所需期間為限；若使用者要求停止利用或刪除，平台將依可行範圍處理並標記停止聯繫。</p>
          <p>利用地區以台灣及網站系統、備份、管理服務所在區域為限。利用對象包含平台授權管理員、受指派專員與必要系統服務提供者。</p>
          <p>利用方式包含電話、LINE、Email 聯繫，後台 CRM 記錄、來源與轉化統計、文件準備提醒與服務品質追蹤。</p>
        </section>
        <section>
          <h2>使用者權利</h2>
          <p>使用者可透過 {settings.email} 要求查詢、閱覽、製給複製本、補充、更正、停止蒐集、停止處理、停止利用或刪除資料。</p>
          <p>若未提供必要資料，平台可能無法完成諮詢安排、資格初步整理或專員聯繫。</p>
        </section>
        <BreadcrumbJsonLd current="隱私權政策與個資告知" path="/privacy" />
      </main>
    </PublicShell>
  );
}
