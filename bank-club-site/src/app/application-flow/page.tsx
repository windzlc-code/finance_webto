import { EventLink } from "@/components/EventLink";
import { Icon } from "@/components/Icons";
import { PublicShell } from "@/components/PublicLayout";
import { BreadcrumbJsonLd } from "@/components/StructuredData";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "貸款申辦流程教學｜網路申請、文件準備與審核等待｜銀行行員俱樂部",
  description: "線上申請、實體遞件、身分證拍攝、頁面當機與資金用途風險提醒。",
  path: "/application-flow",
});

export default function ApplicationFlowPage() {
  const steps = [
    {
      title: "線上或表單填寫需求",
      note: "需求送出",
      icon: "mail",
      href: "/consultation?loan_type=unknown&source_page=flow_step_need",
      eventName: "flow_step_need_form_click",
      cta: "填寫需求",
    },
    {
      title: "專員初步了解資格",
      note: "資格初評",
      icon: "person",
      href: "/consultation?source_page=flow_step_review",
      eventName: "flow_step_review_form_click",
      cta: "預約初評",
    },
    {
      title: "準備身分與財力文件",
      note: "資料整理",
      icon: "shield",
      href: "/consultation?source_page=flow_step_documents",
      eventName: "flow_step_documents_form_click",
      cta: "諮詢補件方式",
    },
    {
      title: "確認適合銀行方案",
      note: "方案確認",
      icon: "globe",
      href: "/credit-loan",
      eventName: "flow_step_plan_click",
      cta: "比較方案",
    },
    {
      title: "遞交銀行審核",
      note: "正式送件",
      icon: "building",
      href: "/application-flow#official-submit",
      eventName: "flow_step_submit_click",
      cta: "看送件提醒",
    },
    {
      title: "審核通過後撥款",
      note: "案件跟進",
      icon: "home",
      href: "/consultation?source_page=flow_step_followup",
      eventName: "flow_step_followup_form_click",
      cta: "跟進案件",
    },
  ] as const;
  const guides = [
    {
      title: "線上網路申請流程",
      icon: "mail",
      body: "先確認需求與合法資金用途，再依銀行官方頁面順序填寫。進入官方頁後不要任意返回上一頁或重複刷新，避免流程中斷。",
      items: ["確認姓名、性別、手機、貸款類型與期望金額；所在城市可選填", "依真實狀況填寫申請金額與年限", "案件來源與方案類型以專員確認及銀行頁面規則為準"],
      href: "/credit-loan",
      eventName: "flow_credit_click",
      cta: "查看信貸網路申辦提醒",
    },
    {
      title: "實體銀行遞件流程",
      icon: "building",
      body: "若需實體遞件，先由專員協助整理資格、文件與預約時段，再由銀行依內部流程收件、審核與通知結果。",
      items: ["確認遞件銀行與窗口", "文件以銀行要求版本為準", "保留送件時間、補件內容與回覆紀錄"],
      href: "/consultation?source_page=flow_branch",
      eventName: "flow_branch_form_click",
      cta: "預約專員整理文件",
    },
    {
      title: "身分證拍攝注意事項",
      icon: "shield",
      body: "身分證正反面拍攝需清楚對焦、四角完整、避免反光與裁切。若使用銀行官方頁面上傳，請只在官方流程或授權通道提供。",
      items: ["避免模糊、反光、遮蔽或裁切", "確認正反面皆可辨識", "不要把身分證照片直接傳到普通網站表單"],
      href: "/credit-loan#credit-application",
      eventName: "flow_credit_application_click",
      cta: "查看信貸申請提醒",
    },
    {
      title: "財力證明準備方式",
      icon: "person",
      body: "上班族、自營業主、企業主需要的財力佐證不同。先整理方向即可，高度敏感文件請與專員確認補件方式後再提供。",
      items: ["上班族：薪轉、扣繳憑單、勞保資料", "自營業主：營業資料、銀行流水、報稅資料", "企業主：營登、報稅、存摺、負責人資料"],
      href: "/blog/employee-self-employed-income-documents",
      eventName: "flow_income_article_click",
      cta: "閱讀財力證明清單",
    },
    {
      title: "頁面當機或上傳失敗處理",
      icon: "home",
      body: "銀行頁面卡住時不要連續送件。先截圖保留狀態，記下發生步驟，再透過 LINE 或電話讓專員協助判斷下一步。",
      items: ["先截圖，不重複刷新", "記下卡住欄位與時間", "如照片上傳失敗，重新確認檔案清晰度與格式"],
      href: "/blog/online-application-back-button-crash",
      eventName: "flow_crash_article_click",
      cta: "查看當機處理辦法",
    },
    {
      title: "資金用途填寫風險",
      icon: "globe",
      body: "不得填寫投資理財、股票操作或不符合銀行規範的用途，也不要用不實用途包裝實際需求。若不確定，先選擇諮詢。",
      items: ["依真實合法用途填寫", "避免投資理財、股市操作等高風險用途", "不確定時先由專員協助確認方向"],
      href: "/blog/loan-purpose-risk",
      eventName: "flow_purpose_article_click",
      cta: "閱讀用途風險提醒",
    },
    {
      title: "申請後等待審核",
      icon: "phone",
      body: "送件後銀行會依信用、收入、負債、文件完整度與用途進行審核。等待期間若有補件需求，專員會協助整理狀態。",
      items: ["留意電話與 LINE 通知", "補件只提供必要摘要與授權通道", "核准、額度、利率、年限與撥款以銀行最終結果為準"],
      href: "/consultation?source_page=flow_followup",
      eventName: "flow_followup_form_click",
      cta: "讓專員協助跟進",
    },
  ] as const;
  return (
    <PublicShell>
      <main className="subpage">
        <section className="page-hero compact flow-page-hero">
          <h1>申辦流程教學</h1>
          <p>每一步都以真實資料、銀行規範與個資最小化為原則。</p>
          <div className="flow-hero-rail" aria-label="流程重點導覽">
            <div>
              <span>01</span>
              <strong>先確認需求</strong>
            </div>
            <div>
              <span>02</span>
              <strong>再整理文件</strong>
            </div>
            <div>
              <span>03</span>
              <strong>最後等銀行審核</strong>
            </div>
          </div>
        </section>
        <section className="timeline flow-timeline" aria-label="貸款申辦主流程">
          {steps.map((step, index) => (
            <article key={step.title}>
              <div className="flow-card-head">
                <span className="flow-card-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="flow-card-icon" aria-hidden="true">
                  <Icon name={step.icon} />
                </span>
                <span className="flow-card-note">{step.note}</span>
              </div>
              <div className="flow-card-body">
                <h2>{step.title}</h2>
                <p>此步驟完成後可透過 LINE 或表單與專員確認下一步；最終審核與撥款均由銀行辦理。</p>
              </div>
              <EventLink className="step-cta" href={step.href} eventName={step.eventName}>
                {step.cta}
              </EventLink>
            </article>
          ))}
        </section>
        <section className="flow-guide-grid" id="official-submit">
          {guides.map((guide, index) => (
            <article className="flow-guide-card" key={guide.title}>
              <div className="flow-guide-top">
                <span className="flow-guide-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="flow-guide-art" aria-hidden="true">
                  <Icon name={guide.icon} />
                </span>
              </div>
              <h2>{guide.title}</h2>
              <p>{guide.body}</p>
              <ul>
                {guide.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <EventLink className="outline-link" href={guide.href} eventName={guide.eventName}>
                {guide.cta}
              </EventLink>
            </article>
          ))}
        </section>
        <section className="warning-block wide">
          <h2>申請前檢查清單</h2>
          <ul className="preflight-list">
            <li>身分證照片清楚、四角完整、無反光或裁切。</li>
            <li>財力文件來源真實，敏感資料只透過授權通道補件。</li>
            <li>資金用途依真實合法需求填寫，不填投資理財或股票操作。</li>
            <li>已閱讀個資告知，理解平台只做諮詢媒合，不保證核貸。</li>
            <li>遇到銀行頁面卡住時先截圖，不重複送件，立即聯繫專員。</li>
          </ul>
          <EventLink className="primary-btn" href="/consultation?source_page=flow" eventName="flow_form_click">
            填寫免費諮詢
          </EventLink>
        </section>
        <BreadcrumbJsonLd current="申辦流程教學" path="/application-flow" />
      </main>
    </PublicShell>
  );
}
