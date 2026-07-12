import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "服務條款｜銀行行員俱樂部",
  description: "銀行行員俱樂部服務條款，說明貸款資訊整理、資格初步評估、文件提醒與專員諮詢媒合的使用規範。",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PublicShell>
      <main className="legal-page">
        <h1>服務條款</h1>
        <section>
          <h2>服務範圍</h2>
          <p>銀行行員俱樂部提供貸款資訊整理、資格初步評估、文件準備提醒、來源導流與專員諮詢媒合。</p>
          <p>網站內容為一般資訊與諮詢輔助，不構成銀行核貸承諾、正式授信建議、投資建議或法律意見。</p>
        </section>
        <section>
          <h2>使用者義務</h2>
          <p>使用者應提供真實、合法且完整的資料；不得要求平台或專員協助規避銀行審核、包裝財力、偽造文件、填寫不實用途或隱匿重要負債資訊。</p>
          <p>若使用者提供資料不實、用途不符銀行規範或文件不完整，可能導致驳件、服務中止或法律責任。</p>
        </section>
        <section>
          <h2>後續聯繫與資料處理</h2>
          <p>使用者送出表單即表示同意平台依隱私權政策與個資告知內容處理資料，並由專員透過電話、LINE 或 Email 聯繫。</p>
          <p>使用者可要求停止聯繫、停止利用或刪除資料；平台將於後台標記並依可行範圍處理。</p>
        </section>
        <BreadcrumbJsonLd current="服務條款" path="/terms" />
      </main>
    </PublicShell>
  );
}
