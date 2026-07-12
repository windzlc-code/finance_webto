import { connection } from "next/server";
import { EventLink } from "@/components/EventLink";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "FB 銀行行員俱樂部社團｜貸款文件、流程與專員答疑",
  description: "加入 FB 銀行行員俱樂部社團，取得最新貸款優惠、文件清單、流程教學與常見問題整理。",
  path: "/facebook",
});

export const dynamic = "force-dynamic";

export default async function FacebookPage() {
  await connection();
  const { articles, settings } = await readDB();
  const facebookPageFbHref = fbHref(settings.fbGroupUrl, { sourcePage: "facebook" });
  const facebookPageLineHref = lineHref(settings.lineUrl, { sourcePage: "facebook" });
  const popularArticles = articles.filter((article) => article.status === "published").slice(0, 4);
  const groupQuestions = [
    {
      question: "社團可以直接問貸款條件嗎？",
      answer: "可以先描述身份、需求與文件狀況，但不要在留言公開手機、身分證、財力證明或存摺等敏感資料。",
    },
    {
      question: "看到文章後想進一步確認怎麼辦？",
      answer: "可先閱讀對應站內文章，再用 LINE 或免費諮詢表單留下需求，專員會協助整理下一步。",
    },
    {
      question: "社團資訊是否代表銀行一定核准？",
      answer: "不代表。社團與網站只提供諮詢、文件準備與流程整理，實際額度、利率、年限及核准結果以銀行審核為準。",
    },
  ];
  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact">
          <h1>FB 銀行行員俱樂部社團</h1>
          <p>把社群討論沉澱成站內文章，再由站內文章導回社團與 LINE 諮詢。</p>
          <div className="hero-actions">
            <EventLink className="primary-btn" href={facebookPageFbHref} eventName="fb_join_click" target="_blank">
              加入社團
            </EventLink>
            <EventLink className="secondary-btn" href={facebookPageLineHref} eventName="fb_line_click" target={facebookPageLineHref.startsWith("http") ? "_blank" : undefined}>
              LINE 諮詢
            </EventLink>
            <EventLink className="secondary-btn" href="/blog" eventName="fb_blog_click">
              查看熱門文章
            </EventLink>
          </div>
        </section>
        <section className="card-grid">
          {["銀行專員駐點答疑", "最新貸款優惠整理", "文件清單與流程教學", "常見社團問題回覆"].map((item) => (
            <article className="small-card" key={item}>
              <h2>{item}</h2>
              <p>社團內容會逐步整理成站內文章，方便搜尋、收藏與後續諮詢。</p>
            </article>
          ))}
        </section>
        <section className="content-section">
          <div className="section-heading">
            <h2>熱門文章入口</h2>
            <p>FB 貼文會導回站內文章，讓流程、文件與風險提醒可以被搜尋與追蹤。</p>
          </div>
          <div className="card-grid">
            {popularArticles.map((article) => (
              <EventLink className="small-card article-card-link" href={`/blog/${article.slug}`} eventName="fb_popular_article_click" metadata={{ articleId: article.id, articleSlug: article.slug }} key={article.id}>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <span className="text-link">閱讀站內整理 ›</span>
              </EventLink>
            ))}
          </div>
        </section>
        <section className="content-section">
          <div className="section-heading">
            <h2>常見社團問題</h2>
            <p>社團適合先理解方向，涉及個資、文件或個案條件時請改用 LINE 或表單。</p>
          </div>
          <div className="card-grid">
            {groupQuestions.map((item) => (
              <article className="small-card" key={item.question}>
                <h2>{item.question}</h2>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="warning-block wide">
          <h2>從社團討論進入一對一諮詢</h2>
          <p>若問題涉及個人信用、收入、房屋或企業資料，請使用 LINE 或表單，由專員協助整理，不要在公開社團留言敏感資訊。</p>
          <div className="hero-actions">
            <EventLink className="primary-btn" href={facebookPageLineHref} eventName="fb_bottom_line_click" target={facebookPageLineHref.startsWith("http") ? "_blank" : undefined}>
              開啟 LINE 諮詢
            </EventLink>
            <EventLink className="secondary-btn" href="/consultation?source_page=facebook" eventName="fb_form_click">
              填寫免費諮詢
            </EventLink>
          </div>
        </section>
        <BreadcrumbJsonLd current="FB 銀行行員俱樂部社團" path="/facebook" />
      </main>
    </PublicShell>
  );
}
