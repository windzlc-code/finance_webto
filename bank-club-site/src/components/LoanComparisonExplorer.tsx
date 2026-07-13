"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { LoanOffer, LoanOfferStatus } from "@/lib/loan-comparison-data";

type SortKey = "recommended" | "rate" | "apr" | "fee";
type PanelKey = "analysis" | "info";
type VisualIconName = "all" | "online" | "flat" | "repeat" | "merge" | "person" | "building" | "rate" | "fee" | "apr" | "monthly" | "amount" | "term" | "analysis" | "info";

const statusLabels: Record<LoanOfferStatus, string> = {
  active: "限時方案",
  standard: "一般方案",
  verify: "請至官網確認",
};

const categoryFilters: { value: string; label: string; icon: VisualIconName }[] = [
  { value: "all", label: "全部方案", icon: "all" },
  { value: "線上申辦", label: "線上申辦", icon: "online" },
  { value: "一段式", label: "一段式利率", icon: "flat" },
  { value: "循環型", label: "循環型", icon: "repeat" },
  { value: "債務整合", label: "債務整合", icon: "merge" },
  { value: "專業人士", label: "專業族群", icon: "person" },
  { value: "企業貸款", label: "企業貸款", icon: "building" },
];

const bankLogoPaths: Record<string, string> = {
  台北富邦: "/bank-logos/taipei-fubon.png",
  永豐銀行: "/bank-logos/sinopac.webp",
  凱基銀行: "/bank-logos/kgi.png",
  星展銀行: "/bank-logos/dbs.webp",
  滙豐銀行: "/bank-logos/hsbc.webp",
  中國信託: "/bank-logos/ctbc.webp",
  渣打銀行: "/bank-logos/standard-chartered.webp",
  台新銀行: "/bank-logos/taishin.webp",
  王道銀行: "/bank-logos/obank.png",
  遠東商銀: "/bank-logos/far-eastern.png",
  樂天國際銀行: "/bank-logos/rakuten.webp",
};

function VisualIcon({ name }: { name: VisualIconName }) {
  if (name === "online") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M8 9h8M14 7l2 2-2 2" /></svg>;
  if (name === "flat") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17V7M4 17h16M7 14l4-4 3 2 5-6" /></svg>;
  if (name === "repeat") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h11l-2-2M19 17H8l2 2M19 17l2-2M5 7 3 3" /></svg>;
  if (name === "merge") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5v3c0 3 2 5 5 5h9M5 19v-2c0-3 2-5 5-5M16 9l3 4-3 4" /></svg>;
  if (name === "person") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 21c1-5 3-7 7-7s6 2 7 7" /></svg>;
  if (name === "building") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V5l9-2v18M14 9h5v12M3 21h18M8 8h2M8 12h2M8 16h2" /></svg>;
  if (name === "rate") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 10 12l4 3 6-9M15 6h5v5" /></svg>;
  if (name === "fee") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v12" /></svg>;
  if (name === "apr") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9h-9V3Z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" /></svg>;
  if (name === "monthly") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6" /></svg>;
  if (name === "amount") return <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v5c0 2 4 3 8 3s8-1 8-3V6M4 11v5c0 2 4 3 8 3s8-1 8-3v-5" /></svg>;
  if (name === "term") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></svg>;
  if (name === "analysis") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
  if (name === "info") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 11h6M9 15h6" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function BankVisual({ offer }: { offer: LoanOffer }) {
  const src = bankLogoPaths[offer.bank];
  return (
    <div className="loan-bank-visual">
      <Image
        src={src}
        alt={`${offer.bank}品牌標誌`}
        width={172}
        height={104}
        sizes="(max-width: 760px) 128px, 172px"
      />
    </div>
  );
}

function ChevronIcon({ open = false }: { open?: boolean }) {
  return (
    <svg className={open ? "is-open" : undefined} viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M11 4h5v5M9 11l7-7" />
      <path d="M15 11v5H4V5h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

function ProductMetric({ label, value, icon, emphasis = false }: { label: string; value: string; icon: VisualIconName; emphasis?: boolean }) {
  return (
    <div className={emphasis ? "loan-product-metric emphasis" : "loan-product-metric"}>
      <span className="loan-metric-label"><VisualIcon name={icon} />{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AccordionPanel({
  offer,
  panel,
  open,
  onToggle,
}: {
  offer: LoanOffer;
  panel: PanelKey;
  open: boolean;
  onToggle: () => void;
}) {
  const isAnalysis = panel === "analysis";
  const label = isAnalysis ? "產品分析" : "產品資訊";
  const panelId = `${offer.id}-${panel}-panel`;
  return (
    <div className={`loan-product-accordion ${open ? "open" : ""}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
        <span className="loan-accordion-symbol" aria-hidden="true"><VisualIcon name={isAnalysis ? "analysis" : "info"} /></span>
        <span>{label}</span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        <div className="loan-product-panel" id={panelId}>
          {isAnalysis ? (
            <ul className="loan-analysis-list">
              {offer.analysis.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="loan-info-columns">
              <section>
                <span className="loan-info-kicker">申請資格</span>
                <h4>{offer.audience}</h4>
                <ul>
                  {offer.qualification.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className="loan-caution-box">
                <span className="loan-info-kicker">比較時要留意</span>
                <ul>
                  {offer.cautions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function LoanComparisonExplorer({ offers }: { offers: LoanOffer[] }) {
  const banks = useMemo(() => Array.from(new Set(offers.map((offer) => offer.bank))), [offers]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeBank, setActiveBank] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openPanels, setOpenPanels] = useState<Record<string, PanelKey | undefined>>({});
  const [compareMessage, setCompareMessage] = useState("");

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = offers.filter((offer) => {
      const categoryMatch = activeCategory === "all" || offer.tags.includes(activeCategory);
      const bankMatch = activeBank === "all" || offer.bank === activeBank;
      const queryMatch =
        !normalizedQuery ||
        `${offer.bank} ${offer.product} ${offer.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
      return categoryMatch && bankMatch && queryMatch;
    });
    return [...result].sort((a, b) => {
      if (sort === "rate") return a.rateValue - b.rateValue;
      if (sort === "apr") return a.aprValue - b.aprValue;
      if (sort === "fee") return a.feeValue - b.feeValue;
      if (a.status !== b.status) {
        const priority: Record<LoanOfferStatus, number> = { active: 0, standard: 1, verify: 2 };
        return priority[a.status] - priority[b.status];
      }
      return offers.indexOf(a) - offers.indexOf(b);
    });
  }, [activeBank, activeCategory, offers, query, sort]);

  const selectedOffers = selectedIds
    .map((id) => offers.find((offer) => offer.id === id))
    .filter((offer): offer is LoanOffer => Boolean(offer));

  function togglePanel(id: string, panel: PanelKey) {
    setOpenPanels((current) => ({ ...current, [id]: current[id] === panel ? undefined : panel }));
  }

  function toggleCompare(id: string) {
    setCompareMessage("");
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        setCompareMessage("最多可以選 3 款，先移除一款再加新的。");
        return current;
      }
      return [...current, id];
    });
  }

  function resetFilters() {
    setActiveCategory("all");
    setActiveBank("all");
    setQuery("");
    setSort("recommended");
  }

  return (
    <div className="loan-comparison-explorer">
      <section className="loan-filter-console" aria-label="方案篩選工具">
        <div className="loan-filter-title">
          <div>
            <span>找適合你的方案</span>
            <h2>你可以先挑需求，也可以直接選銀行</h2>
          </div>
          <p>
            目前顯示 <strong data-no-translate>{filteredOffers.length}</strong> / <span data-no-translate>{offers.length}</span> 款
          </p>
        </div>
        <div className="loan-category-tabs" role="group" aria-label="方案類型">
          {categoryFilters.map((filter) => (
            <button
              type="button"
              className={activeCategory === filter.value ? "active" : undefined}
              aria-pressed={activeCategory === filter.value}
              onClick={() => setActiveCategory(filter.value)}
              key={filter.value}
            >
              <VisualIcon name={filter.icon} />
              {filter.label}
            </button>
          ))}
        </div>
        <div className="loan-bank-filter" role="group" aria-label="銀行篩選">
          <button type="button" className={activeBank === "all" ? "active" : undefined} onClick={() => setActiveBank("all")}>
            所有銀行
          </button>
          {banks.map((bank) => (
            <button type="button" className={activeBank === bank ? "active" : undefined} onClick={() => setActiveBank(bank)} key={bank}>
              {bank}
            </button>
          ))}
        </div>
        <div className="loan-filter-fields">
          <label className="loan-search-field">
            <span className="sr-only">搜尋銀行或方案</span>
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="輸入銀行或方案名稱" />
          </label>
          <label className="loan-sort-field">
            <span>排序</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="recommended">推薦排序</option>
              <option value="rate">最低利率</option>
              <option value="apr">最低總費用年百分率</option>
              <option value="fee">最低手續費</option>
            </select>
          </label>
        </div>
      </section>

      {filteredOffers.length ? (
        <section className="loan-product-list" aria-label="貸款方案列表">
          {filteredOffers.map((offer) => {
            const selected = selectedIds.includes(offer.id);
            const openPanel = openPanels[offer.id];
            return (
              <article className={`loan-product-card status-${offer.status}`} data-loan-offer={offer.id} key={offer.id}>
                <div className="loan-product-card-head">
                  <div className="loan-bank-identity">
                    <BankVisual offer={offer} />
                    <div>
                      <span className="loan-bank-name">{offer.bank}</span>
                      <h3>{offer.product}</h3>
                      <div className="loan-card-tags">
                        <span className={`loan-status-pill ${offer.status}`}>{statusLabels[offer.status]}</span>
                        {offer.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="loan-card-actions">
                    <button
                      type="button"
                      className={selected ? "loan-compare-toggle selected" : "loan-compare-toggle"}
                      onClick={() => toggleCompare(offer.id)}
                      aria-pressed={selected}
                    >
                      {selected ? <CheckIcon /> : <VisualIcon name="merge" />}
                      {selected ? <span key="selected">已選</span> : <span key="available">放進比較</span>}
                    </button>
                    <a href={offer.officialUrl} target="_blank" rel="noreferrer noopener" className="loan-official-link">
                      到銀行官網確認
                      <ExternalIcon />
                    </a>
                  </div>
                </div>

                <div className="loan-product-metrics">
                  <ProductMetric label="最低貸款利率" value={offer.rate} icon="rate" emphasis />
                  <ProductMetric label="手續費" value={offer.fee} icon="fee" />
                  <ProductMetric label="總費用年百分率" value={offer.apr} icon="apr" />
                  <ProductMetric label="參考最低月付" value={offer.monthly} icon="monthly" />
                </div>

                <div className="loan-product-glance">
                  <div><VisualIcon name="amount" /><span>最高額度</span><strong>{offer.maxAmount}</strong></div>
                  <div><VisualIcon name="term" /><span>最長期間</span><strong>{offer.maxTerm}</strong></div>
                  <div><VisualIcon name="person" /><span>適合對象</span><strong>{offer.audience}</strong></div>
                </div>

                <div className="loan-product-accordions">
                  <AccordionPanel offer={offer} panel="analysis" open={openPanel === "analysis"} onToggle={() => togglePanel(offer.id, "analysis")} />
                  <AccordionPanel offer={offer} panel="info" open={openPanel === "info"} onToggle={() => togglePanel(offer.id, "info")} />
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="loan-empty-state">
          <span>目前找不到符合條件的方案</span>
          <h2>換個條件看看，或把篩選清掉</h2>
          <button type="button" onClick={resetFilters}>清除篩選</button>
        </section>
      )}

      {selectedOffers.length ? (
        <section className="loan-compare-workspace" aria-label="已選方案比較">
          <div className="loan-compare-workspace-head">
            <div>
              <span>已選 <b data-no-translate>{selectedOffers.length}</b> / 3 款</span>
              <h2 key={selectedOffers.length < 2 ? "need-more" : "ready"}>{selectedOffers.length < 2 ? "再選一款，就能放在一起比" : "看看這幾款差在哪裡"}</h2>
            </div>
            <button type="button" onClick={() => setSelectedIds([])}>全部移除</button>
          </div>
          {compareMessage ? <p className="loan-compare-message" role="status">{compareMessage}</p> : null}
          <div className="loan-compare-table-wrap">
            <table className="loan-compare-table">
              <thead>
                <tr>
                  <th scope="col">比較欄位</th>
                  {selectedOffers.map((offer) => <th scope="col" key={offer.id}>{offer.bank}<small>{offer.product}</small></th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ["最低利率", (offer: LoanOffer) => offer.rate],
                  ["手續費", (offer: LoanOffer) => offer.fee],
                  ["總費用年百分率", (offer: LoanOffer) => offer.apr],
                  ["參考月付", (offer: LoanOffer) => offer.monthly],
                  ["最高額度", (offer: LoanOffer) => offer.maxAmount],
                  ["最長期間", (offer: LoanOffer) => offer.maxTerm],
                ].map(([label, getter]) => (
                  <tr key={label as string}>
                    <th scope="row">{label as string}</th>
                    {selectedOffers.map((offer) => <td key={offer.id}>{(getter as (item: LoanOffer) => string)(offer)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
