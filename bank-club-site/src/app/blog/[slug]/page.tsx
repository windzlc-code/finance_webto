import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EventLink } from "@/components/EventLink";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd, JsonLd } from "@/components/StructuredData";
import { fbHref } from "@/lib/fb-links";
import { lineHref } from "@/lib/line-links";
import { absoluteUrl } from "@/lib/seo";
import { readDB } from "@/lib/store";

export const dynamic = "force-dynamic";

type ArticleCta = {
  key: "form" | "line" | "fb";
  href: string;
  eventName: "blog_form_click" | "blog_line_click" | "blog_fb_click";
  label: string;
  external: boolean;
};

function articleImageUrl(value: string) {
  if (!value) return absoluteUrl("/brand/bank_club_logo.png");
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return absoluteUrl(value.startsWith("/") ? value : `/${value}`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();
  const db = await readDB();
  const article = db.articles.find((item) => item.slug === slug && item.status === "published");
  if (!article) return {};
  const url = absoluteUrl(`/blog/${article.slug}`);
  const image = articleImageUrl(article.coverImageUrl);
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    keywords: article.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      url,
      type: "article",
      images: [{ url: image, alt: article.coverImageAlt || article.title }],
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.seoDescription,
      images: [image],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connection();
  const db = await readDB();
  const article = db.articles.find((item) => item.slug === slug && item.status === "published");
  const settings = db.settings;
  if (!article) notFound();
  const ctasByType: Record<ArticleCta["key"], ArticleCta> = {
    form: {
      key: "form",
      href: "/consultation?source_page=blog",
      eventName: "blog_form_click",
      label: "填寫免費諮詢",
      external: false,
    },
    line: {
      key: "line",
      href: lineHref(settings.lineUrl, { sourcePage: "blog", sourceDetail: article.slug }),
      eventName: "blog_line_click",
      label: "加入 LINE 諮詢",
      external: true,
    },
    fb: {
      key: "fb",
      href: fbHref(settings.fbGroupUrl, { sourcePage: "blog", sourceDetail: article.slug }),
      eventName: "blog_fb_click",
      label: "加入 FB 社團",
      external: true,
    },
  };
  const articleCtas = [
    ctasByType[article.ctaType],
    ctasByType.form,
    ctasByType.line,
    ctasByType.fb,
  ].filter((cta, index, items) => items.findIndex((item) => item.key === cta.key) === index);
  const shouldShowFeeDisclosure =
    article.complianceFlags?.mentionsRateOrFee ||
    article.totalAnnualPercentageRate ||
    article.annualPercentageRateDescription ||
    article.feeDisclosureNote;
  const image = articleImageUrl(article.coverImageUrl);
  return (
    <PublicShell>
      <main className="article-page">
        <span className="article-category">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="article-excerpt">{article.excerpt}</p>
        <Image
          className="article-cover"
          src={article.coverImageUrl || "/brand/bank_club_logo.png"}
          alt={article.coverImageAlt || `${article.title} 封面圖`}
          width={1200}
          height={525}
          priority
          unoptimized
        />
        <article>
          {article.body.split("\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
        {shouldShowFeeDisclosure ? (
          <section className="article-disclosure" aria-labelledby="article-fee-disclosure">
            <h2 id="article-fee-disclosure">利率與費用揭露</h2>
            {article.totalAnnualPercentageRate ? <p><strong>總費用年百分率：</strong>{article.totalAnnualPercentageRate}</p> : null}
            <p>
              {article.annualPercentageRateDescription ||
                "總費用年百分率不等於貸款利率，實際年百分率、利率、費用與核准結果以銀行最終審核及契約揭露為準。"}
            </p>
            {article.feeDisclosureNote ? <p>{article.feeDisclosureNote}</p> : null}
          </section>
        ) : null}
        <div className="article-cta">
          <h2>需要專員協助整理條件？</h2>
          <div className="hero-actions">
            {articleCtas.map((cta, index) => (
              <EventLink
                className={index === 0 ? "primary-btn" : "secondary-btn"}
                href={cta.href}
                eventName={cta.eventName}
                target={cta.external && cta.href.startsWith("http") ? "_blank" : undefined}
                key={cta.key}
              >
                {cta.label}
              </EventLink>
            ))}
          </div>
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            image,
            datePublished: article.createdAt,
            dateModified: article.updatedAt,
            mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
            publisher: {
              "@type": "Organization",
              name: "銀行俱樂部",
              logo: {
                "@type": "ImageObject",
                url: absoluteUrl("/brand/bank_club_logo.png"),
              },
            },
          }}
        />
        <BreadcrumbJsonLd current={article.title} path={`/blog/${article.slug}`} />
      </main>
    </PublicShell>
  );
}
