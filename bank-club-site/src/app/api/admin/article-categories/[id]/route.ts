import { NextResponse } from "next/server";
import { canManageContent, isSameOriginRequest, requireAdmin } from "@/lib/auth";
import { createAudit, mutateDB } from "@/lib/store";
import type { ArticleCategory } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function categorySlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
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
  const body = (await request.json().catch(() => ({}))) as Partial<ArticleCategory>;
  const nextName = text(body.name);
  const nextSlug = categorySlug(text(body.slug) || nextName);
  if (!nextName || !nextSlug) {
    return NextResponse.json({ message: "請輸入分類名稱與 slug" }, { status: 400 });
  }

  const updated = await mutateDB((db) => {
    const item = db.articleCategories.find((category) => category.id === id);
    if (!item) return null;
    if (db.articleCategories.some((category) => category.id !== id && (category.name === nextName || category.slug === nextSlug))) {
      return "duplicate";
    }
    const previousName = item.name;
    item.name = nextName;
    item.slug = nextSlug;
    item.description = text(body.description);
    item.updatedAt = new Date().toISOString();
    for (const article of db.articles) {
      if (article.category === previousName) {
        article.category = nextName;
        article.updatedAt = item.updatedAt;
      }
    }
    db.auditLogs.unshift(createAudit(user.id, "article_category_updated", "article_category", id));
    return item;
  });

  if (updated === "duplicate") return NextResponse.json({ message: "分類名稱或 slug 已存在" }, { status: 409 });
  if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ category: updated });
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
    const item = db.articleCategories.find((category) => category.id === id);
    if (!item) return null;
    if (db.articles.some((article) => article.category === item.name)) return "in-use";
    db.articleCategories = db.articleCategories.filter((category) => category.id !== id);
    db.auditLogs.unshift(createAudit(user.id, "article_category_deleted", "article_category", id));
    return true;
  });

  if (deleted === "in-use") return NextResponse.json({ message: "仍有文章使用此分類，請先改分類。" }, { status: 400 });
  if (!deleted) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
