import path from "node:path";
import { readDbJson, readDbSnapshot, writeDbSnapshot } from "./db-file-lock.mjs";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const dbPath = path.join(process.cwd(), ".data", "bank-club-db.json");
const keepData = process.env.ARTICLES_SMOKE_KEEP_DATA === "1";
const defaultPassword = "admin123";
const legacyDefaultPassword = "BankClub2026!";

function fail(message) {
  const error = new Error(message);
  error.name = "ArticlesSmokeError";
  throw error;
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function cookieFromSetCookie(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/bank_club_session=[^;]+/);
  return match?.[0] || "";
}

function sameOriginHeaders(cookie = "", ip = "127.0.0.137") {
  return {
    origin: baseUrl,
    referer: `${baseUrl}/admin`,
    "x-forwarded-for": ip,
    ...(cookie ? { cookie } : {}),
  };
}

async function fetchJson(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const json = await parseJson(response);
  return { response, json };
}

async function adminLogin(db) {
  const admin = db.users.find((user) => user.role === "super_admin") || db.users[0];
  const passwordCandidates = [
    process.env.ARTICLES_SMOKE_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    defaultPassword,
    legacyDefaultPassword,
  ].filter((value, index, values) => Boolean(value) && values.indexOf(value) === index);

  let loginResult = null;
  for (const password of passwordCandidates) {
    const result = await fetchJson("/api/admin/login", {
      method: "POST",
      headers: {
        ...sameOriginHeaders("", "127.0.0.136"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: admin.email, password }),
    });
    loginResult = result;
    if (result.response.ok) break;
  }
  if (!loginResult?.response.ok) {
    fail(`admin login failed HTTP ${loginResult?.response.status}: ${loginResult?.json.message || "unknown error"}. Set ARTICLES_SMOKE_ADMIN_PASSWORD to the current local admin password.`);
  }
  const cookie = cookieFromSetCookie(loginResult.response.headers);
  if (!cookie) fail("admin login did not return bank_club_session cookie");
  if (loginResult.json.user?.role !== "super_admin") fail(`admin login returned unexpected role: ${loginResult.json.user?.role}`);
  return { cookie };
}

async function readDb() {
  return readDbJson(dbPath);
}

function articlePayload({ title, slug, category, status = "draft", complianceChecked = false, ctaType = "line" }) {
  return {
    title,
    slug,
    category,
    excerpt: "文章煙測：將 FB 社團常見問題整理為站內 SEO 文章，並保留貸款合規提醒。",
    body: [
      "文章煙測第一段：使用者從社團看到貸款文件問題後，可回到站內閱讀完整整理。",
      "文章煙測第二段：所有貸款條件、利率、費用、額度與核准結果均以銀行最終審核與契約揭露為準。",
      "文章煙測第三段：平台不收身分證、薪轉、銀行流水等敏感文件，只提供諮詢與文件準備提醒。",
    ].join("\n"),
    coverImageUrl: "/brand/bank_club_logo.png",
    coverImageAlt: "銀行俱樂部文章煙測封面",
    seoTitle: `${title}｜銀行俱樂部`,
    seoDescription: "驗證後台文章可建立、合規發布、輸出 SEO meta、Article JSON-LD 與社群 CTA。",
    keywords: ["文章煙測", "FB 社團導流", "貸款 SEO"],
    fbSummary: "文章煙測 FB 摘要：社團問題回站內看完整整理，需要評估再進 LINE 或表單。",
    ctaType,
    status,
    complianceChecked,
    complianceFlags: {
      mentionsAmountOrTerm: false,
      mentionsRateOrFee: true,
      mentionsBinding: false,
      mentionsBankName: true,
      containsGuaranteeLanguage: false,
      mentionsLoanPurpose: true,
    },
    complianceNotes: complianceChecked ? "文章煙測已確認無保證核貸、不看信用等紅線文案。" : "",
    totalAnnualPercentageRate: "依銀行契約揭露為準",
    annualPercentageRateDescription: "總費用年百分率不等於貸款利率，實際年百分率、利率、費用與核准結果以銀行最終審核及契約揭露為準。",
    feeDisclosureNote: "本文僅供申請流程與文件準備參考，不構成核貸、額度、利率或撥款承諾。",
  };
}

async function assertPublicArticle(slug, title, expectedCtaText) {
  const response = await fetch(`${baseUrl}/blog/${slug}`);
  const html = await response.text();
  if (!response.ok) fail(`published article page failed HTTP ${response.status}`);
  for (const text of [
    title,
    "利率與費用揭露",
    "Article",
    "BreadcrumbList",
    "property=\"og:type\" content=\"article\"",
    "rel=\"canonical\"",
    expectedCtaText,
  ]) {
    if (!html.includes(text)) fail(`published article page missing "${text}"`);
  }
  return html.length;
}

async function run() {
  const backup = keepData ? null : await readDbSnapshot(dbPath);
  const originalDB = JSON.parse(backup || await readDbSnapshot(dbPath));
  const stamp = Date.now();
  const categoryName = `文章煙測分類${stamp}`;
  const categorySlug = `articles-smoke-${stamp}`;
  const articleTitle = `文章煙測 SEO 與社群導流 ${stamp}`;
  const articleSlug = `articles-smoke-${stamp}`;

  try {
    const { cookie } = await adminLogin(originalDB);
    const headers = { ...sameOriginHeaders(cookie), "content-type": "application/json" };

    const category = await fetchJson("/api/admin/article-categories", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: categoryName,
        slug: categorySlug,
        description: "文章 smoke 使用的臨時分類。",
      }),
    });
    if (!category.response.ok || !category.json.category?.id) {
      fail(`article category create failed HTTP ${category.response.status}: ${category.json.message || ""}`);
    }

    const duplicateCategory = await fetchJson("/api/admin/article-categories", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: categoryName, slug: categorySlug, description: "duplicate" }),
    });
    if (duplicateCategory.response.status !== 409) {
      fail(`duplicate article category should be rejected, got HTTP ${duplicateCategory.response.status}`);
    }

    const publishWithoutCompliance = await fetchJson("/api/admin/articles", {
      method: "POST",
      headers,
      body: JSON.stringify(articlePayload({ title: `${articleTitle} 未檢查`, slug: `${articleSlug}-no-compliance`, category: categoryName, status: "published" })),
    });
    if (publishWithoutCompliance.response.status !== 400 || !String(publishWithoutCompliance.json.message || "").includes("合規")) {
      fail(`publishing without compliance should fail, got HTTP ${publishWithoutCompliance.response.status}`);
    }

    const created = await fetchJson("/api/admin/articles", {
      method: "POST",
      headers,
      body: JSON.stringify(articlePayload({ title: articleTitle, slug: articleSlug, category: categoryName })),
    });
    if (!created.response.ok || !created.json.article?.id) {
      fail(`article draft create failed HTTP ${created.response.status}: ${created.json.message || ""}`);
    }
    const articleId = created.json.article.id;
    if (created.json.article.status !== "draft" || created.json.article.complianceChecked !== false) {
      fail("created article should start as unchecked draft");
    }
    if (created.json.article.fbPostStatus !== "not_started" || created.json.article.fbPostUrl || created.json.article.fbPostedAt) {
      fail(`created article should start with empty FB post tracking fields: ${JSON.stringify({
        fbPostStatus: created.json.article.fbPostStatus,
        fbPostUrl: created.json.article.fbPostUrl,
        fbPostedAt: created.json.article.fbPostedAt,
      })}`);
    }

    const draftPage = await fetch(`${baseUrl}/blog/${articleSlug}`);
    if (draftPage.status !== 404) fail(`draft article should not be public, got HTTP ${draftPage.status}`);

    const duplicateArticle = await fetchJson("/api/admin/articles", {
      method: "POST",
      headers,
      body: JSON.stringify(articlePayload({ title: `${articleTitle} duplicate`, slug: articleSlug, category: categoryName })),
    });
    if (duplicateArticle.response.status !== 409) {
      fail(`duplicate article slug should be rejected, got HTTP ${duplicateArticle.response.status}`);
    }

    const published = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        status: "published",
        complianceChecked: true,
        complianceNotes: "文章煙測發布前已完成合規檢查。",
      }),
    });
    if (!published.response.ok || published.json.article?.status !== "published" || !published.json.article?.publishedAt) {
      fail(`article publish failed HTTP ${published.response.status}: ${published.json.message || ""}`);
    }
    if (!published.json.article.revisionHistory?.some((entry) => entry.action === "published")) {
      fail("published article missing published revision history");
    }
    const publishedHtmlBytes = await assertPublicArticle(articleSlug, articleTitle, "加入 LINE 諮詢");

    const blogList = await fetch(`${baseUrl}/blog?category=${encodeURIComponent(categoryName)}`);
    const blogListHtml = await blogList.text();
    if (!blogList.ok || !blogListHtml.includes(articleTitle) || !blogListHtml.includes(categoryName)) {
      fail(`published article missing from category-filtered blog list HTTP ${blogList.status}`);
    }

    const updatedTitle = `${articleTitle} 更新`;
    const updated = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        title: updatedTitle,
        seoDescription: "文章煙測更新後的 SEO 描述，驗證後台可維護文章內容與社群 CTA。",
        fbSummary: "文章煙測更新 FB 摘要，可複製到社團導流回站內。",
        ctaType: "fb",
      }),
    });
    if (!updated.response.ok || updated.json.article?.title !== updatedTitle || updated.json.article?.ctaType !== "fb") {
      fail(`article update failed HTTP ${updated.response.status}: ${updated.json.message || ""}`);
    }
    if (!updated.json.article.revisionHistory?.some((entry) => entry.action === "updated")) {
      fail("updated article missing updated revision history");
    }
    await assertPublicArticle(articleSlug, updatedTitle, "加入 FB 社團");

    const copiedFbPost = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fbPostStatus: "copied",
        fbPostNote: "文章煙測：已複製 FB 社團貼文草稿。",
      }),
    });
    if (
      !copiedFbPost.response.ok ||
      copiedFbPost.json.article?.fbPostStatus !== "copied" ||
      copiedFbPost.json.article?.fbPostedAt
    ) {
      fail(`FB copied state update failed HTTP ${copiedFbPost.response.status}: ${copiedFbPost.json.message || ""}`);
    }

    const postedWithoutUrl = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fbPostStatus: "posted",
      }),
    });
    if (postedWithoutUrl.response.status !== 400 || !String(postedWithoutUrl.json.message || "").includes("FB")) {
      fail(`FB posted state without URL should fail, got HTTP ${postedWithoutUrl.response.status}`);
    }

    const fbPostUrl = `https://www.facebook.com/groups/bankclub/posts/${stamp}`;
    const postedFbPost = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        fbPostStatus: "posted",
        fbPostUrl,
        fbPostNote: "文章煙測：FB 社團貼文已發布，文末導回站內文章。",
      }),
    });
    if (
      !postedFbPost.response.ok ||
      postedFbPost.json.article?.fbPostStatus !== "posted" ||
      postedFbPost.json.article?.fbPostUrl !== fbPostUrl ||
      !postedFbPost.json.article?.fbPostedAt ||
      !postedFbPost.json.article?.revisionHistory?.some((entry) => entry.action === "fb_post_updated")
    ) {
      fail(`FB posted state update failed HTTP ${postedFbPost.response.status}: ${postedFbPost.json.message || ""}`);
    }

    const summaryAfterFbPost = await fetchJson("/api/admin/summary", { headers });
    if (!summaryAfterFbPost.response.ok) {
      fail(`admin summary after FB post failed HTTP ${summaryAfterFbPost.response.status}`);
    }
    if (
      summaryAfterFbPost.json.contentOperations?.fbPosted < 1 ||
      summaryAfterFbPost.json.contentOperations?.publishedArticles < 1
    ) {
      fail(`content operations summary did not count published FB post: ${JSON.stringify(summaryAfterFbPost.json.contentOperations || {})}`);
    }

    const inUseCategoryDelete = await fetchJson(`/api/admin/article-categories/${category.json.category.id}`, {
      method: "DELETE",
      headers,
    });
    if (inUseCategoryDelete.response.status !== 400) {
      fail(`category in use should not be deleted, got HTTP ${inUseCategoryDelete.response.status}`);
    }

    const unpublished = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "draft" }),
    });
    if (!unpublished.response.ok || unpublished.json.article?.status !== "draft") {
      fail(`article unpublish failed HTTP ${unpublished.response.status}: ${unpublished.json.message || ""}`);
    }
    if (!unpublished.json.article.revisionHistory?.some((entry) => entry.action === "unpublished")) {
      fail("unpublished article missing unpublished revision history");
    }
    const unpublishedPage = await fetch(`${baseUrl}/blog/${articleSlug}`);
    if (unpublishedPage.status !== 404) fail(`unpublished article should not be public, got HTTP ${unpublishedPage.status}`);

    const deleted = await fetchJson(`/api/admin/articles/${articleId}`, {
      method: "DELETE",
      headers,
    });
    if (!deleted.response.ok || deleted.json.ok !== true) {
      fail(`article delete failed HTTP ${deleted.response.status}: ${deleted.json.message || ""}`);
    }
    const categoryDeleted = await fetchJson(`/api/admin/article-categories/${category.json.category.id}`, {
      method: "DELETE",
      headers,
    });
    if (!categoryDeleted.response.ok || categoryDeleted.json.ok !== true) {
      fail(`article category delete failed HTTP ${categoryDeleted.response.status}: ${categoryDeleted.json.message || ""}`);
    }

    const db = await readDb();
    const auditActions = db.auditLogs.map((log) => log.action);
    for (const action of ["article_category_created", "article_created", "article_updated", "article_deleted", "article_category_deleted"]) {
      if (!auditActions.includes(action)) fail(`missing audit action ${action}`);
    }
    if (!db.deletedArticleIds.includes(articleId)) fail("deleted article ID was not retained in deletedArticleIds");

    console.log(JSON.stringify({
      categoryId: category.json.category.id,
      articleId,
      slug: articleSlug,
      publishedHtmlBytes,
      finalPublicStatus: unpublishedPage.status,
      deletedArticleTracked: db.deletedArticleIds.includes(articleId),
      auditActions: auditActions.filter((action) => action.startsWith("article")),
    }, null, 2));
  } finally {
    if (backup !== null) {
      await writeDbSnapshot(backup, { dbPath, label: "articles-smoke" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
