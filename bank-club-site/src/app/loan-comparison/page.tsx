import { LoanComparisonExplorer } from "@/components/LoanComparisonExplorer";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd, JsonLd } from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";
import {
  loanOffers,
} from "@/lib/loan-comparison-data";

export const metadata = createPageMetadata({
  title: "貸款方案比較｜銀行利率、總費用與申請資格一次看｜銀行行員俱樂部",
  description: "比較台灣銀行信用貸款的最低利率、手續費、總費用年百分率、額度、年期與申請資格，並可同時選取三款方案並排查看。",
  path: "/loan-comparison",
});

export default function LoanComparisonPage() {
  const bankCount = new Set(loanOffers.map((offer) => offer.bank)).size;
  return (
    <PublicShell>
      <main className="loan-comparison-page">
        <section className="loan-comparison-hero">
          <div className="loan-comparison-hero-copy">
            <span className="loan-comparison-eyebrow">挑信貸，別只盯著最低利率</span>
            <h1>{bankCount} 家銀行、{loanOffers.length} 款方案，放在一起更好比</h1>
            <p>
              利率低不一定最省。手續費、APR、綁約和申請條件，我們都整理在卡片裡，慢慢看就好。
            </p>
            <div className="loan-comparison-hero-actions">
              <a href="#all-loan-offers" className="primary-btn">看看有哪些方案</a>
              <a href="/consultation?source_page=loan_comparison" className="secondary-btn">不知道怎麼挑？問專員</a>
            </div>
          </div>
          <aside className="loan-compare-primer" aria-label="比較貸款三個步驟">
            <span className="loan-primer-kicker">第一次比信貸？照這樣看</span>
            <ol>
              <li><span>01</span><div><strong>先找你需要的</strong><p>想線上辦、整合負債，或找特定職業方案，都能直接篩。</p></div></li>
              <li><span>02</span><div><strong>打開卡片看細節</strong><p>費用、申請資格和綁約限制，都放在裡面。</p></div></li>
              <li><span>03</span><div><strong>留下幾款一起比</strong><p>勾選 2–3 款，哪裡便宜、哪裡有限制會更清楚。</p></div></li>
            </ol>
          </aside>
        </section>

        <section id="all-loan-offers" className="loan-comparison-content">
          <div className="loan-comparison-section-head">
            <div>
              <span>銀行信貸方案</span>
              <h2>利率、費用和條件，都整理在卡片裡</h2>
            </div>
            <p>看到低利率先別急，APR 和手續費一起看，才比較接近實際成本。</p>
          </div>
          <LoanComparisonExplorer offers={loanOffers} />
        </section>

        <section className="loan-comparison-bottom-note">
          <h2>申請前，這三件事別漏看</h2>
          <div>
            <p><strong>0.01% 不一定是你的利率</strong><span>銀行會看你的收入、信用和負債，再決定最後的利率與額度。</span></p>
            <p><strong>比較時多看 APR</strong><span>APR 把部分費用也算進去，比單看利率更容易看出哪款划算。</span></p>
            <p><strong>申請請直接找銀行</strong><span>證件、存摺和提款卡不要交給陌生代辦，也別先付不明費用。</span></p>
          </div>
        </section>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "台灣銀行貸款方案比較",
            numberOfItems: loanOffers.length,
            itemListElement: loanOffers.map((offer, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: `${offer.bank} ${offer.product}`,
              description: `最低利率 ${offer.rate}，總費用年百分率 ${offer.apr}，最高額度 ${offer.maxAmount}。`,
            })),
          }}
        />
        <BreadcrumbJsonLd current="貸款方案比較" path="/loan-comparison" />
      </main>
    </PublicShell>
  );
}
