import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canManageContent, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB, readDB } from "@/lib/store";
import type { Article, ArticleComplianceFlags } from "@/lib/types";

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

function normalizeComplianceFlags(value: ArticleInput["complianceFlags"]): ArticleComplianceFlags {
  const source = (typeof value === "object" && value ? value : {}) as Partial<ArticleComplianceFlags>;
  return complianceFlagKeys.reduce((flags, key) => {
    flags[key] = Boolean(source[key]);
    return flags;
  }, {} as ArticleComplianceFlags);
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  return NextResponse.json({ articles: db.articles, categories: db.articleCategories });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as ArticleInput;
  if (!body.title || !body.slug) {
    return NextResponse.json({ message: "請輸入標題與 slug" }, { status: 400 });
  }
  if (body.status === "published" && !body.complianceChecked) {
    return NextResponse.json({ message: "發布前必須完成合規檢查" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const title = body.title.trim();
  const slug = body.slug.trim();
  const complianceChecked = Boolean(body.complianceChecked);
  const status = body.status === "published" ? "published" : "draft";
  const article = await mutateDB((db) => {
    if (db.articles.some((entry) => entry.slug === slug)) {
      return "duplicate-slug";
    }
    const category = body.category?.trim() || db.articleCategories[0]?.name || "貸款知識";
    if (!db.articleCategories.some((item) => item.name === category)) {
      return "invalid-category";
    }
    const item: Article = {
      id: randomUUID(),
      title,
      slug,
      category,
      excerpt: body.excerpt?.trim() || "",
      body: body.body?.trim() || "",
      coverImageUrl: body.coverImageUrl?.trim() || "/brand/bank_club_hero.png",
      coverImageAlt: body.coverImageAlt?.trim() || `${title} 封面圖`,
      seoTitle: body.seoTitle?.trim() || title,
      seoDescription: body.seoDescription?.trim() || body.excerpt?.trim() || "",
      keywords: normalizeKeywords(body.keywords),
      fbSummary: body.fbSummary?.trim() || body.excerpt?.trim() || "",
      fbPostStatus: "not_started",
      fbPostUrl: "",
      fbPostedAt: "",
      fbPostNote: "",
      ctaType: body.ctaType || "form",
      status,
      complianceChecked,
      complianceFlags: normalizeComplianceFlags(body.complianceFlags),
      complianceNotes: body.complianceNotes?.trim() || "",
      totalAnnualPercentageRate: body.totalAnnualPercentageRate?.trim() || "",
      annualPercentageRateDescription: body.annualPercentageRateDescription?.trim() || "",
      feeDisclosureNote: body.feeDisclosureNote?.trim() || "",
      complianceReviewedAt: complianceChecked ? now : "",
      complianceReviewedBy: complianceChecked ? user.id : "",
      publishedAt: status === "published" ? now : "",
      publishedBy: status === "published" ? user.id : "",
      lastModifiedBy: user.id,
      revisionHistory: [
        {
          id: randomUUID(),
          actorId: user.id,
          action: status === "published" ? "published" : "created",
          summary: status === "published" ? "建立文章並發布。" : "建立文章草稿。",
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.articles.unshift(item);
    db.auditLogs.unshift(createAudit(user.id, "article_created", "article", item.id));
    return item;
  });
  if (article === "duplicate-slug") return NextResponse.json({ message: "slug 已存在" }, { status: 409 });
  if (article === "invalid-category") return NextResponse.json({ message: "請選擇有效文章分類" }, { status: 400 });
  return NextResponse.json({ article });
}
