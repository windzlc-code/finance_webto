export type MaterialAsset = {
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  points: string[];
  accent: string;
  bg: string;
};

export const materialAssets: MaterialAsset[] = [
  {
    slug: "credit-application-flow",
    title: "信貸申請流程圖",
    subtitle: "從需求確認到銀行審核的 5 個步驟",
    eyebrow: "信用貸款",
    points: ["確認金額與用途", "整理身分與財力", "專員初步檢查", "送銀行審核", "結果與補件跟進"],
    accent: "#1f8a5b",
    bg: "#eef8f0",
  },
  {
    slug: "id-card-photo-tips",
    title: "身分證拍攝注意事項圖",
    subtitle: "清楚、完整、無反光，不上傳到普通網站",
    eyebrow: "文件準備",
    points: ["四角完整", "文字清晰", "避免反光", "正反面齊全"],
    accent: "#2367a2",
    bg: "#edf5fc",
  },
  {
    slug: "income-document-checklist",
    title: "財力證明準備清單圖",
    subtitle: "上班族、自營業主、企業主文件方向",
    eyebrow: "財力文件",
    points: ["薪轉與扣繳憑單", "營業資料與流水", "報稅資料", "先與專員確認補件方式"],
    accent: "#8a6a1f",
    bg: "#fff8e8",
  },
  {
    slug: "loan-purpose-risk",
    title: "貸款資金用途風險提醒圖",
    subtitle: "用途需真實合法，不包裝投資理財",
    eyebrow: "風險提醒",
    points: ["不得填不實用途", "避免投資理財或股票操作", "不確定先諮詢", "以銀行規範為準"],
    accent: "#b33a3a",
    bg: "#fff0f0",
  },
  {
    slug: "house-loan-flow",
    title: "房貸流程圖",
    subtitle: "房屋條件、鑑價、審核、對保與撥款",
    eyebrow: "房屋貸款",
    points: ["整理房屋資料", "銀行鑑價", "收入與負債審核", "對保撥款"],
    accent: "#4f6f2f",
    bg: "#f2f7ea",
  },
  {
    slug: "business-loan-documents",
    title: "企業貸款文件圖",
    subtitle: "營登、報稅、流水與負責人資料",
    eyebrow: "企業貸款",
    points: ["營業登記", "報稅資料", "近六個月流水", "負責人身分與信用資料"],
    accent: "#5864a6",
    bg: "#f0f2ff",
  },
  {
    slug: "fb-group-benefits",
    title: "FB 社團福利圖",
    subtitle: "最新貼文、QA、文件清單與站內延伸閱讀",
    eyebrow: "社群導流",
    points: ["追蹤最新貸款文章", "收藏文件清單", "回站閱讀完整內容", "需要評估再進 LINE"],
    accent: "#2459a6",
    bg: "#eef4ff",
  },
  {
    slug: "line-consultation-flow",
    title: "LINE 諮詢流程圖",
    subtitle: "表單送出後用 LINE 做預約、補件與跟進",
    eyebrow: "LINE 閉環",
    points: ["送出諮詢表單", "加入 LINE 確認", "摘要式補件", "後台更新狀態"],
    accent: "#0c8f45",
    bg: "#ecf9f0",
  },
];

export function materialAssetPath(slug: string) {
  return `/materials/${slug}.svg`;
}
