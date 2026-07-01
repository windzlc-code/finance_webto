import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canManageContent, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB, readDB } from "@/lib/store";
import type { Article, ArticleComplianceFlags } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };
type ArticleInput = Partial<Omit<Article, "keywords">> & { keywords?: string[] | string };
const complianceFlagKeys: Array<keyof ArticleComplianceFlags> = [
  "mentionsAmountOrTerm",
  "mentionsRateOrFee",
  "mentionsBinding",
  "mentionsBankName",
  "containsGuaranteeLanguage",
  "mentionsLoanPurpose",
];

function normalizeKeywords(value: ArticleInput["keywords"]) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeComplianceFlags(
  value: ArticleInput["complianceFlags"] | undefined,
  fallback: ArticleComplianceFlags,
): ArticleComplianceFlags {
  const source = (typeof value === "object" && value ? value : fallback) as Partial<ArticleComplianceFlags>;
  return complianceFlagKeys.reduce((flags, key) => {
    flags[key] = Boolean(source[key]);
    return flags;
  }, {} as ArticleComplianceFlags);
}

function isValidFacebookPostUrl(value: string) {
  try {
    const url = new URL(value);
    return /(^|\.)facebook\.com$/i.test(url.hostname) && url.pathname.length > 1;
  } catch {
    return false;
  }
}

export async function GET(_: Request, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = await readDB();
  const article = db.articles.find((item) => item.id === id);
  if (!article) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as ArticleInput;
  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json({ message: "請輸入標題" }, { status: 400 });
  }
  if (body.slug !== undefined && !body.slug.trim()) {
    return NextResponse.json({ message: "請輸入 slug" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const slug = body.slug?.trim();
  const fbPostStatus = body.fbPostStatus;
  if (fbPostStatus && !["not_started", "copied", "posted"].includes(fbPostStatus)) {
    return NextResponse.json({ message: "未知的 FB 發文狀態" }, { status: 400 });
  }
  const requestedFbPostUrl = typeof body.fbPostUrl === "string" ? body.fbPostUrl.trim() : "";

  const article = await mutateDB((db) => {
    const item = db.articles.find((entry) => entry.id === id);
    if (!item) return null;
    const nextFbPostStatus = fbPostStatus || item.fbPostStatus;
    const nextFbPostUrl = typeof body.fbPostUrl === "string" ? body.fbPostUrl.trim() : item.fbPostUrl;
    if (nextFbPostStatus === "posted" && !isValidFacebookPostUrl(nextFbPostUrl)) {
      return "missing-fb-post-url";
    }
    if (slug && db.articles.some((entry) => entry.id !== id && entry.slug === slug)) {
      return "duplicate-slug";
    }
    const previousStatus = item.status;
    const nextStatus = body.status || item.status;
    const nextComplianceChecked =
      typeof body.complianceChecked === "boolean" ? body.complianceChecked : item.complianceChecked;
    if (nextStatus === "published" && !nextComplianceChecked) {
      return "missing-compliance";
    }

    if (typeof body.title === "string") item.title = body.title.trim();
    if (typeof body.slug === "string") item.slug = slug!;
    if (typeof body.category === "string") {
      const nextCategory = body.category.trim() || db.articleCategories[0]?.name || "貸款知識";
      if (!db.articleCategories.some((category) => category.name === nextCategory)) return "invalid-category";
      item.category = nextCategory;
    }
    if (typeof body.excerpt === "string") item.excerpt = body.excerpt.trim();
    if (typeof body.body === "string") item.body = body.body.trim();
    if (typeof body.coverImageUrl === "string") item.coverImageUrl = body.coverImageUrl.trim() || "/brand/bank_club_logo.png";
    if (typeof body.coverImageAlt === "string") item.coverImageAlt = body.coverImageAlt.trim() || `${item.title} 封面圖`;
    if (typeof body.seoTitle === "string") item.seoTitle = body.seoTitle.trim() || item.title;
    if (typeof body.seoDescription === "string") item.seoDescription = body.seoDescription.trim() || item.excerpt;
    if (typeof body.fbSummary === "string") item.fbSummary = body.fbSummary.trim() || item.excerpt;
    const fbPostChanged =
      Boolean(fbPostStatus && fbPostStatus !== item.fbPostStatus) ||
      (typeof body.fbPostUrl === "string" && body.fbPostUrl.trim() !== item.fbPostUrl) ||
      (typeof body.fbPostNote === "string" && body.fbPostNote.trim() !== item.fbPostNote);
    if (fbPostStatus === "not_started" || fbPostStatus === "copied" || fbPostStatus === "posted") {
      item.fbPostStatus = fbPostStatus;
      if (fbPostStatus === "posted" && !item.fbPostedAt) item.fbPostedAt = now;
      if (fbPostStatus !== "posted") item.fbPostedAt = "";
    }
    if (typeof body.fbPostUrl === "string") item.fbPostUrl = requestedFbPostUrl;
    if (typeof body.fbPostNote === "string") item.fbPostNote = body.fbPostNote.trim();
    if (body.keywords !== undefined) item.keywords = normalizeKeywords(body.keywords);
    if (body.ctaType === "line" || body.ctaType === "form" || body.ctaType === "fb") item.ctaType = body.ctaType;
    if (body.status === "draft" || body.status === "published") item.status = body.status;
    if (body.complianceFlags !== undefined) {
      item.complianceFlags = normalizeComplianceFlags(body.complianceFlags, item.complianceFlags);
    }
    if (typeof body.complianceNotes === "string") item.complianceNotes = body.complianceNotes.trim();
    if (typeof body.totalAnnualPercentageRate === "string") {
      item.totalAnnualPercentageRate = body.totalAnnualPercentageRate.trim();
    }
    if (typeof body.annualPercentageRateDescription === "string") {
      item.annualPercentageRateDescription = body.annualPercentageRateDescription.trim();
    }
    if (typeof body.feeDisclosureNote === "string") {
      item.feeDisclosureNote = body.feeDisclosureNote.trim();
    }
    if (typeof body.complianceChecked === "boolean") {
      const wasUnchecked = !item.complianceChecked && body.complianceChecked;
      item.complianceChecked = body.complianceChecked;
      if (body.complianceChecked && wasUnchecked) {
        item.complianceReviewedAt = now;
        item.complianceReviewedBy = user.id;
      }
      if (!body.complianceChecked) {
        item.complianceReviewedAt = "";
        item.complianceReviewedBy = "";
      }
    }
    if (previousStatus !== "published" && item.status === "published") {
      item.publishedAt = now;
      item.publishedBy = user.id;
    }
    item.lastModifiedBy = user.id;
    item.updatedAt = now;
    const action =
      previousStatus !== "published" && item.status === "published"
        ? "published"
        : previousStatus === "published" && item.status === "draft"
          ? "unpublished"
          : fbPostChanged
            ? "fb_post_updated"
            : body.complianceChecked === true
            ? "compliance_reviewed"
            : "updated";
    item.revisionHistory.unshift({
      id: randomUUID(),
      actorId: user.id,
      action,
      summary:
        action === "published"
          ? "文章已發布。"
          : action === "unpublished"
            ? "文章已下架為草稿。"
            : action === "compliance_reviewed"
              ? "文章合規檢查已更新。"
              : action === "fb_post_updated"
                ? "FB 社團發文狀態已更新。"
              : "文章內容或 SEO 設定已更新。",
      createdAt: now,
    });
    db.auditLogs.unshift(createAudit(user.id, "article_updated", "article", id));
    return item;
  });

  if (article === "duplicate-slug") return NextResponse.json({ message: "slug 已存在" }, { status: 409 });
  if (article === "invalid-category") return NextResponse.json({ message: "請選擇有效文章分類" }, { status: 400 });
  if (article === "missing-fb-post-url") {
    return NextResponse.json({ message: "標記已發布到 FB 時，必須提供有效的 FB 貼文網址" }, { status: 400 });
  }
  if (article === "missing-compliance") {
    return NextResponse.json({ message: "發布前必須完成合規檢查" }, { status: 400 });
  }
  if (!article) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const deleted = await mutateDB((db) => {
    const exists = db.articles.some((article) => article.id === id);
    if (!exists) return false;
    db.articles = db.articles.filter((article) => article.id !== id);
    if (!db.deletedArticleIds.includes(id)) db.deletedArticleIds.push(id);
    db.auditLogs.unshift(createAudit(user.id, "article_deleted", "article", id));
    return true;
  });
  if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
