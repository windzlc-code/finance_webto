import type { Article } from "./types";

const complianceNotice =
  "提醒：本平台為銀行服務人員媒合與貸款諮詢平台，非銀行或金融機構；實際額度、利率、年限、費用與核准結果以銀行最終審核及契約揭露為準，不保證核貸。";

function trackedArticleUrl(origin: string, article: Article) {
  const url = new URL(`/blog/${article.slug}`, origin);
  url.searchParams.set("utm_source", "facebook");
  url.searchParams.set("utm_medium", "group_post");
  url.searchParams.set("utm_campaign", article.slug);
  url.searchParams.set("utm_content", article.category || "article");
  return url.toString();
}

export function createFbPostText(article: Article, origin: string) {
  const title = article.title.trim();
  const summary = (article.fbSummary || article.excerpt).trim();
  return [
    title,
    "",
    summary,
    "",
    complianceNotice,
    "",
    `延伸閱讀：${trackedArticleUrl(origin, article)}`,
  ].join("\n");
}
