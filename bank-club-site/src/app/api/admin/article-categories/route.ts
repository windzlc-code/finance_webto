import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { canManageContent, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB, readDB } from "@/lib/store";
import type { ArticleCategory } from "@/lib/types";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function categorySlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const db = await readDB();
  const articleCounts = db.articles.reduce<Record<string, number>>((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {});
  return NextResponse.json({
    categories: db.articleCategories.map((category) => ({
      ...category,
      articleCount: articleCounts[category.name] || 0,
    })),
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const user = await requireAdmin();
  if (!user || !canManageContent(user)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as Partial<ArticleCategory>;
  const name = text(body.name);
  const slug = categorySlug(text(body.slug) || name);
  const description = text(body.description);
  if (!name || !slug) {
    return NextResponse.json({ message: "請輸入分類名稱與 slug" }, { status: 400 });
  }

  const category = await mutateDB((db) => {
    if (db.articleCategories.some((item) => item.name === name || item.slug === slug)) return "duplicate";
    const now = new Date().toISOString();
    const item: ArticleCategory = {
      id: randomUUID(),
      name,
      slug,
      description,
      createdAt: now,
      updatedAt: now,
    };
    db.articleCategories.push(item);
    db.auditLogs.unshift(createAudit(user.id, "article_category_created", "article_category", item.id));
    return item;
  });

  if (category === "duplicate") return NextResponse.json({ message: "分類名稱或 slug 已存在" }, { status: 409 });
  return NextResponse.json({ category });
}
