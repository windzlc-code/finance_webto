import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/Icons";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "貸款知識文章｜銀行行員俱樂部",
  description: "銀行行員俱樂部 SEO 文章列表，沉澱信貸、房貸、企業貸、文件與風險提醒內容。",
  path: "/blog",
});

type BlogPageProps = {
  searchParams?: Promise<{ category?: string; q?: string }>;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function articleMatchesSearch(article: Article, query: string) {
  if (!query) return true;
  const searchableText = [
    article.title,
    article.excerpt,
    article.body,
    article.category,
    article.seoTitle,
    article.seoDescription,
    article.fbSummary,
    ...article.keywords,
  ]
    .join(" ")
    .toLowerCase();
  return searchableText.includes(query);
}

function blogHref(category: string, query: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/blog?${search}` : "/blog";
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  await connection();
  const db = await readDB();
  const params = await searchParams;
  const activeCategory = params?.category || "";
  const searchQuery = (params?.q || "").trim();
  const normalizedQuery = normalizeSearch(searchQuery);
  const publishedArticles = db.articles.filter((article) => article.status === "published");
  const categoryArticles = activeCategory
    ? publishedArticles.filter((article) => article.category === activeCategory)
    : publishedArticles;
  const articles = categoryArticles.filter((article) => articleMatchesSearch(article, normalizedQuery));
  const categoryCounts = publishedArticles.reduce<Record<string, number>>((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {});
  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>貸款知識文章</h1>
          <p>把 FB 社團常見問題沉澱成可搜尋、可收錄、可轉化的站內內容。</p>
        </section>
        <section className="blog-search-panel" id="article-search" aria-label="文章搜尋">
          <form action="/blog" method="get" className="blog-search-form">
            {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
            <label htmlFor="blog-search-input">搜尋文章</label>
            <div className="blog-search-box">
              <input
                id="blog-search-input"
                name="q"
                type="search"
                defaultValue={searchQuery}
                placeholder="輸入信貸、財力證明、上一頁、房屋增貸..."
              />
              <button type="submit" aria-label="送出文章搜尋">
                <Icon name="search" />
              </button>
            </div>
          </form>
          <div className="blog-search-meta" aria-live="polite">
            <span>
              {searchQuery || activeCategory
                ? `找到 ${articles.length} 篇${activeCategory ? `「${activeCategory}」` : ""}${searchQuery ? `「${searchQuery}」` : ""}相關文章`
                : `目前共有 ${publishedArticles.length} 篇貸款知識文章`}
            </span>
            {(searchQuery || activeCategory) ? <Link href="/blog">清除篩選</Link> : null}
          </div>
        </section>
        <nav className="category-filter" aria-label="文章分類">
          <Link className={!activeCategory ? "active" : ""} href={blogHref("", searchQuery)}>
            全部 <span>{publishedArticles.length}</span>
          </Link>
          {db.articleCategories
            .filter((category) => categoryCounts[category.name])
            .map((category) => (
              <Link
                className={activeCategory === category.name ? "active" : ""}
                href={blogHref(category.name, searchQuery)}
                key={category.id}
              >
                {category.name} <span>{categoryCounts[category.name]}</span>
              </Link>
            ))}
        </nav>
        <section className="article-list">
          {articles.length ? (
            articles.map((article) => (
              <Link className="article-row" href={`/blog/${article.slug}`} key={article.id}>
                <Image
                  src={article.coverImageUrl || "/brand/bank_club_hero.png"}
                  alt={article.coverImageAlt || `${article.title} 封面圖`}
                  width={320}
                  height={240}
                  unoptimized
                />
                <div>
                  <span>{article.category}</span>
                  <h2>{article.title}</h2>
                  <p>{article.excerpt}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <h2>目前沒有符合的文章</h2>
              <p>可以換一個關鍵詞，或先查看常見 QA 與免費諮詢入口。</p>
              <div className="inline-actions">
                <Link className="outline-link" href="/qa">查看常見 QA</Link>
                <Link className="outline-link" href="/consultation?source_page=blog_empty">免費諮詢</Link>
              </div>
            </div>
          )}
        </section>
        <BreadcrumbJsonLd current="貸款知識文章" path="/blog" />
      </main>
    </PublicShell>
  );
}
