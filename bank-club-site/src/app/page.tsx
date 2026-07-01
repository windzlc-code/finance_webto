import Image from "next/image";
import { connection } from "next/server";
import { EventLink } from "@/components/EventLink";
import { Icon } from "@/components/Icons";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd, OrganizationJsonLd } from "@/components/StructuredData";
import { lineHref } from "@/lib/line-links";
import { createPageMetadata } from "@/lib/seo";
import { processSteps, serviceCards } from "@/lib/site-data";
import { readDB } from "@/lib/store";

export const metadata = createPageMetadata({
  title: "銀行俱樂部｜銀行專員一對一 信用貸/房屋貸/企業貸免費評估",
  description: "銀行俱樂部提供信貸、房貸、企業貸款諮詢，協助整理資格、文件清單、申辦流程與 LINE 一對一免費評估。",
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
          <div className="hero-content">
            <h1>銀行俱樂部</h1>
            <p className="hero-lead">
              一對一銀行專員，
              <span>信貸 / 房貸 / 企業貸款</span>
              <span className="gold-text">免費評估</span>
            </p>
            <p className="hero-sub">
              協助整理資格、文件與申辦流程，
              <span>LINE 專員快速諮詢。</span>
            </p>
            <div className="hero-actions">
              <EventLink className="primary-btn" href="/consultation?source_page=home" eventName="hero_form_click">
                立即免費諮詢
                <Icon name="arrow" />
              </EventLink>
              <EventLink className="secondary-btn" href="/application-flow" eventName="hero_flow_click">
                查看申辦流程
                <Icon name="arrow" />
              </EventLink>
            </div>
            <div className="slider-dots" aria-hidden="true">
              <span />
              <span />
              <span />
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
              <span>›</span>
            </EventLink>
          ))}
        </section>

        <section className="contact-strip">
          <div className="advisor">
            <span className="advisor-icon"><Icon name="person" /></span>
            <strong>{settings.specialistName}</strong>
            <span>{settings.specialistTitle}</span>
            <span className="divider" />
            <Icon name="phone" />
            <span>{settings.mobile}</span>
            <span className="divider" />
            <Icon name="mail" />
            <span>{settings.email}</span>
          </div>
          <EventLink
            className="qr-mini"
            href={homeLineHref}
            eventName="home_line_click"
            target={homeLineHref.startsWith("http") ? "_blank" : undefined}
            metadata={{ sourceSection: "contact_strip" }}
          >
            <span>
              LINE 一對一諮詢
              <br />
              掃描 QR Code 加入專員
            </span>
            <Image src={settings.lineQrCodeUrl} alt={`${settings.specialistName} LINE 一對一諮詢 QR Code`} width={74} height={74} unoptimized />
          </EventLink>
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
            <p>首頁只做簡潔提示，完整清單由「文件總整理」頁承接。</p>
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
