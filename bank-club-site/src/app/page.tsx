import Image from "next/image";
import { connection } from "next/server";
import { EventLink } from "@/components/EventLink";
import { Icon } from "@/components/Icons";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/StructuredData";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { processSteps, propertyValuationUrl, serviceCards } from "@/lib/site-data";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "銀行行員俱樂部｜銀行專員一對一 信用貸/房屋貸/企業貸免費評估",
  description: "銀行行員俱樂部提供信貸、房貸、企業貸款諮詢，協助整理資格、文件清單、申辦流程與 LINE 一對一免費評估。",
  path: "/",
});

export default async function Home() {
  await connection();
  const { settings } = await readDB();
  const homeLineHref = lineHref(settings.lineUrl, { sourcePage: "home_contact_strip" });
  return (
    <PublicShell>
      <main>
        <section className="hero">
          <div className="hero-shell">
            <h1 className="sr-only">台灣社大銀行方案與行員俱樂部</h1>
            <Image
              className="hero-key-visual"
              src="/brand/bank_club_hero.png"
              alt=""
              width={1897}
              height={829}
              priority
              sizes="100vw"
              unoptimized
            />
            <div className="hero-live-actions loan-first-actions" aria-label="三大貸款快速入口">
              {serviceCards.map((card) => (
                <EventLink
                  className="hero-loan-btn"
                  href={card.href}
                  eventName="hero_loan_click"
                  metadata={{ loanType: card.key, sourceSection: "hero" }}
                  key={card.key}
                >
                  {card.title}
                  <Icon name="arrow" />
                </EventLink>
              ))}
            </div>
          </div>
        </section>

        <section className="service-rail" id="loan-services" aria-label="三大貸款服務">
          {serviceCards.map((card) => (
            <EventLink
              className="service-panel"
              href={card.href}
              eventName="home_service_click"
              metadata={{ loanType: card.key, sourceSection: "service_rail" }}
              key={card.key}
            >
              <div className="service-icon">
                <Icon name={card.icon as "person" | "home" | "building"} />
              </div>
              <h2>{card.title}</h2>
              <p className="service-subtitle">
                <span>{card.subtitle}</span>
                <span>{card.railDescription}</span>
              </p>
              <span className="service-panel-action">
                {card.cta}
                <Icon name="arrow" />
              </span>
            </EventLink>
          ))}
        </section>

        <section className="contact-strip service-contact-strip">
          <div className="advisor">
            <Icon name="phone" />
            <span>{settings.mobile}</span>
            <span className="divider" />
            <Icon name="mail" />
            <span>{settings.email}</span>
          </div>
          <div className="contact-actions">
            <EventLink
              className="qr-mini subtle-contact-link"
              href={homeLineHref}
              eventName="home_line_click"
              target={homeLineHref.startsWith("http") ? "_blank" : undefined}
              metadata={{ sourceSection: "contact_strip" }}
            >
              <span>
                需要確認貸款類型？
                <br />
                先用 LINE 補充需求
              </span>
              <Image src={settings.lineQrCodeUrl} alt="LINE 一對一諮詢 QR Code" width={74} height={74} unoptimized />
            </EventLink>
            <EventLink
              className="property-valuation-inline"
              href={propertyValuationUrl}
              eventName="property_valuation_home_click"
              metadata={{ sourceSection: "home_contact_strip" }}
            >
              <Icon name="home" />
              不動產估價工具
            </EventLink>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <h2>首頁核心入口</h2>
            <p>首頁只保留最重要的站內跳轉，讓使用者快速進到對應服務頁。</p>
          </div>
          <div className="entry-grid">
            {serviceCards.map((card) => (
              <EventLink
                className="entry-card"
                href={card.href}
                eventName="home_entry_click"
                metadata={{ loanType: card.key, sourceSection: "core_entry" }}
                key={card.key}
              >
                <span className="round-badge">{card.title.slice(0, 1)}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <strong>{card.cta} ›</strong>
              </EventLink>
            ))}
          </div>
        </section>

        <section className="flow-box">
          <h2>簡化申辦流程</h2>
          <p>首頁展示流程摘要，詳細步驟交由「申辦流程」頁承接。</p>
          <div className="flow-line">
            {processSteps.map((step, index) => (
              <div className="flow-step" key={step}>
                <span className={index === 0 ? "active" : ""}>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <h2>文件準備提醒</h2>
            <p>首頁只保留申請前重點提醒，敏感資料請先透過 LINE 與專員確認。</p>
          </div>
          <div className="reminder-grid">
            <div>
              <h3>身分證</h3>
              <p>正反面拍攝清楚，避免反光與裁切。</p>
            </div>
            <div>
              <h3>財力證明</h3>
              <p>先與專員確認補件方式，不在首頁收敏感文件。</p>
            </div>
            <div>
              <h3>用途提醒</h3>
              <p>依實際合法用途填寫，避免不符合銀行規範。</p>
            </div>
          </div>
        </section>
        <OrganizationJsonLd />
        <BreadcrumbJsonLd current="首頁" path="/" />
      </main>
    </PublicShell>
  );
}
