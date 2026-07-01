"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { identityLabels, loanLabels } from "@/lib/site-data";
import { getTrackingSessionId } from "@/lib/tracking-session";
import type { IdentityType, LoanType } from "@/lib/types";

type Props = {
  defaultLoanType?: string;
  defaultIdentityType?: string;
};

type CreditUploadSide = "front" | "back";

type CreditUploadState = {
  fileName: string;
  fileSize: number;
  previewUrl: string;
  error: string;
};

type ValidationIssue = {
  field: string;
  level: "error" | "warning";
  message: string;
};

const allowedCreditFileTypes = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const creditFileMaxBytes = 8 * 1024 * 1024;
const taiwanCities = ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"];
const phoneCountryCodes = [
  ["+886", "台灣 +886"],
  ["+86", "中國大陸 +86"],
  ["+852", "香港 +852"],
  ["+853", "澳門 +853"],
  ["+81", "日本 +81"],
  ["+82", "韓國 +82"],
  ["+65", "新加坡 +65"],
  ["+60", "馬來西亞 +60"],
  ["+66", "泰國 +66"],
  ["+84", "越南 +84"],
  ["+63", "菲律賓 +63"],
  ["+62", "印尼 +62"],
  ["+1", "美國 / 加拿大 +1"],
  ["+44", "英國 +44"],
  ["+61", "澳洲 +61"],
  ["+64", "紐西蘭 +64"],
  ["+49", "德國 +49"],
  ["+33", "法國 +33"],
  ["+39", "義大利 +39"],
  ["+34", "西班牙 +34"],
];
const appointmentMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const currentYear = new Date().getFullYear();
const appointmentYears = Array.from({ length: 3 }, (_, index) => String(currentYear + index));

function daysForMonth(year: string, month: string) {
  if (!year || !month) return Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0"));
  const days = new Date(Number(year), Number(month), 0).getDate();
  return Array.from({ length: days }, (_, index) => String(index + 1).padStart(2, "0"));
}

function amountOptionsFor(loanType: LoanType) {
  if (loanType === "credit") {
    return [
      ["300000", "30 萬"],
      ["500000", "50 萬"],
      ["800000", "80 萬"],
      ["1000000", "100 萬"],
      ["2000000", "200 萬"],
      ["3000000", "300 萬"],
      ["5000000", "500 萬"],
      ["7000000", "700 萬"],
    ];
  }
  if (loanType === "house") {
    return [
      ["500000", "50 萬"],
      ["1000000", "100 萬"],
      ["1800000", "180 萬"],
      ["3000000", "300 萬"],
      ["5000000", "500 萬"],
      ["8000000", "800 萬"],
      ["10000000", "1,000 萬以上"],
    ];
  }
  if (loanType === "business") {
    return [
      ["300000", "30 萬"],
      ["500000", "50 萬"],
      ["800000", "80 萬"],
      ["1000000", "100 萬"],
      ["2000000", "200 萬"],
      ["5000000", "500 萬"],
      ["10000000", "1,000 萬以上"],
    ];
  }
  return [
    ["300000", "30 萬"],
    ["500000", "50 萬"],
    ["1000000", "100 萬"],
    ["3000000", "300 萬以上"],
  ];
}

function sourceFromReferrer(referrer: string) {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("facebook") || host.includes("fb.")) return "facebook";
    if (host.includes("line.me") || host.includes("lin.ee")) return "line";
    if (["google.", "bing.", "yahoo.", "duckduckgo.", "baidu."].some((name) => host.includes(name))) return "seo";
    return "referral";
  } catch {
    return "referral";
  }
}

function keywordFromReferrer(referrer: string) {
  if (!referrer) return "";
  try {
    const params = new URL(referrer).searchParams;
    return params.get("q") || params.get("p") || params.get("query") || params.get("keyword") || "";
  } catch {
    return "";
  }
}

function emptyUploadState(): CreditUploadState {
  return { fileName: "", fileSize: 0, previewUrl: "", error: "" };
}

function formatFileSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formText(form: FormData, name: string) {
  return String(form.get(name) || "").trim();
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function validateLeadDraft(form: FormData, options: { requireComplete: boolean; hasIdFront: boolean; hasIdBack: boolean }): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const addIssue = (field: string, level: ValidationIssue["level"], message: string) => {
    issues.push({ field, level, message });
  };
  const name = formText(form, "name");
  const phone = formText(form, "phone");
  const phoneDigits = digitsOnly(phone);
  const phoneCountryCode = formText(form, "phoneCountryCode") || "+886";
  const lineId = formText(form, "lineId");
  const identityType = formText(form, "identityType");
  const loanType = formText(form, "loanType");
  const appointmentTime = formText(form, "appointmentTime");
  const purpose = formText(form, "purpose");
  const requestedAmount = Number(formText(form, "requestedAmount") || formText(form, "desiredAmount") || 0);
  const requestedTermYears = Number(formText(form, "requestedTermYears") || 0);
  const note = formText(form, "note");

  if (options.requireComplete && !name) addIssue("name", "error", "請填寫姓名。");
  if (name && !/^[\p{L}\s.'·-]{2,40}$/u.test(name)) {
    addIssue("name", "error", "姓名請填寫 2 到 40 個中文字或英文字母，不要填數字、電話或符號。");
  }

  if (options.requireComplete && !phone) addIssue("phone", "error", "請填寫手機號碼。");
  if (phone) {
    if (phoneDigits.length < 6 || phoneDigits.length > 15) {
      addIssue("phone", "error", "手機號碼長度不合理，請確認是否少填或多填。");
    }
    if (phoneDigits.startsWith("09") && phoneCountryCode !== "+886") {
      addIssue("phone", "error", "手機看起來是台灣 09 開頭號碼，國碼請改選台灣 +886。");
    }
    if (phoneCountryCode === "+886" && !/^0?9\d{8}$/.test(phoneDigits)) {
      addIssue("phone", "error", "台灣手機請填 09 開頭 10 碼，或 9 開頭 9 碼。");
    }
    if (phoneCountryCode === "+86" && !/^1\d{10}$/.test(phoneDigits)) {
      addIssue("phone", "error", "中國大陸手機通常為 1 開頭 11 碼，請確認國碼或號碼是否正確。");
    }
  }

  if (options.requireComplete && loanType !== "unknown" && !lineId) addIssue("lineId", "error", "請填寫 LINE ID，方便後續確認補件方式。");
  if (lineId && (lineId.length < 3 || /\s/.test(lineId))) {
    addIssue("lineId", "error", "LINE ID 至少 3 個字元，且不要包含空格。");
  }

  if (options.requireComplete && !identityType) addIssue("identityType", "error", "請選擇身份類型。");

  if (options.requireComplete && !appointmentTime) addIssue("appointmentTime", "error", "請選擇完整的預約年、月、日。");
  if (appointmentTime) {
    const selectedDate = new Date(appointmentTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(selectedDate.getTime())) {
      addIssue("appointmentTime", "error", "預約日期格式異常，請重新選擇年、月、日。");
    } else if (selectedDate < today) {
      addIssue("appointmentTime", "error", "預約日期不能早於今天，請重新選擇。");
    }
  }

  if (loanType === "credit") {
    if (options.requireComplete && !requestedAmount) addIssue("requestedAmount", "error", "請選擇信貸申請金額。");
    if (options.requireComplete && !requestedTermYears) addIssue("requestedTermYears", "error", "請選擇信貸申請年限。");
    if (options.requireComplete && !formText(form, "caseSource")) addIssue("caseSource", "error", "請選擇案件來源。");
    if (options.requireComplete && !formText(form, "programType")) addIssue("programType", "error", "請選擇適用方案。");
    if (requestedAmount >= 5000000) addIssue("requestedAmount", "warning", "申請 500 萬以上通常需要更完整的收入、信用與負債條件，實際以銀行審核為準。");
    if (requestedTermYears >= 10) addIssue("requestedTermYears", "warning", "10 年期會拉長總費用，請確認可接受月付金與總成本。");
    if (purpose === "high_risk") addIssue("purpose", "warning", "投資理財或高風險用途可能不符合銀行規範，送件前建議先讓專員確認。");
    if (formText(form, "programType") === "binding") addIssue("programType", "warning", "綁約方案可能有提前清償限制或費用，送出前請確認可接受。");
    if (options.requireComplete && !options.hasIdFront) addIssue("idFront", "error", "請上傳身分證正面照片。");
    if (options.requireComplete && !options.hasIdBack) addIssue("idBack", "error", "請上傳身分證反面照片。");
  }

  if (loanType === "house") {
    const existingMortgage = formText(form, "existingMortgage");
    const hasExistingMortgage = existingMortgage === "has_mortgage" || existingMortgage === "second_mortgage";
    const requiredHouseFields = [
      ["houseLoanType", "請選擇房貸類型。"],
      ["desiredAmount", "請選擇房貸期望貸款金額。"],
      ["propertyCity", "請選擇房屋縣市。"],
      ["propertyArea", "請填寫房屋區域。"],
      ["propertyType", "請選擇房屋類型。"],
      ["existingMortgage", "請選擇是否已有貸款。"],
      ["purpose", "請選擇資金用途。"],
    ];
    if (options.requireComplete) {
      for (const [field, errorMessage] of requiredHouseFields) {
        if (!formText(form, field)) addIssue(field, "error", errorMessage);
      }
      if (hasExistingMortgage && !formText(form, "currentBank")) addIssue("currentBank", "error", "已有房貸或二胎時，目前貸款銀行為條件必填。");
      if (hasExistingMortgage && !formText(form, "remainingBalance")) addIssue("remainingBalance", "error", "已有房貸或二胎時，剩餘貸款金額為條件必填。");
    }
  }

  if (loanType === "business") {
    const requiredBusinessFields = [
      ["businessLoanType", "請選擇企業貸款類型。"],
      ["businessName", "請填寫公司 / 商號名稱。"],
      ["businessType", "請選擇企業型態。"],
      ["operatingYears", "請選擇營業年數。"],
      ["businessLocation", "請選擇企業所在地。"],
      ["monthlyRevenueRange", "請選擇月平均營收區間。"],
      ["desiredAmount", "請選擇企業貸款期望金額。"],
      ["purpose", "請選擇資金用途。"],
    ];
    if (options.requireComplete) {
      for (const [field, errorMessage] of requiredBusinessFields) {
        if (!formText(form, field)) addIssue(field, "error", errorMessage);
      }
    }
  }

  if (note && /[A-Z][12]\d{8}|\d{10,16}/i.test(note)) {
    addIssue("note", "error", "備註請不要填身分證字號、銀行帳號或完整敏感文件內容。");
  }

  return issues;
}

export function ConsultationForm({ defaultLoanType = "unknown", defaultIdentityType = "" }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [formStartedAt] = useState(() => Date.now().toString());
  const [loanType, setLoanType] = useState<LoanType>(defaultLoanType as LoanType);
  const [purpose, setPurpose] = useState("unsure");
  const [existingMortgage, setExistingMortgage] = useState("");
  const [appointmentYear, setAppointmentYear] = useState("");
  const [appointmentMonth, setAppointmentMonth] = useState("");
  const [appointmentDay, setAppointmentDay] = useState("");
  const [idFrontUpload, setIdFrontUpload] = useState<CreditUploadState>(() => emptyUploadState());
  const [idBackUpload, setIdBackUpload] = useState<CreditUploadState>(() => emptyUploadState());
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const appointmentDays = useMemo(() => daysForMonth(appointmentYear, appointmentMonth), [appointmentYear, appointmentMonth]);
  const validAppointmentDay = appointmentDays.includes(appointmentDay) ? appointmentDay : "";
  const appointmentTime = appointmentYear && appointmentMonth && validAppointmentDay ? `${appointmentYear}-${appointmentMonth}-${validAppointmentDay}T09:00` : "";

  useEffect(() => {
    return () => {
      if (idFrontUpload.previewUrl) URL.revokeObjectURL(idFrontUpload.previewUrl);
      if (idBackUpload.previewUrl) URL.revokeObjectURL(idBackUpload.previewUrl);
    };
  }, [idFrontUpload.previewUrl, idBackUpload.previewUrl]);

  function updateUpload(side: CreditUploadSide, nextState: CreditUploadState) {
    const setter = side === "front" ? setIdFrontUpload : setIdBackUpload;
    setter((previous) => {
      if (previous.previewUrl) URL.revokeObjectURL(previous.previewUrl);
      return nextState;
    });
  }

  function handleCreditFileChange(side: CreditUploadSide, event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      updateUpload(side, emptyUploadState());
      return;
    }
    if (!allowedCreditFileTypes.has(file.type)) {
      event.currentTarget.value = "";
      updateUpload(side, { ...emptyUploadState(), error: "格式不支援，請改選 JPG、PNG 或 HEIC 圖片。" });
      return;
    }
    if (file.size > creditFileMaxBytes) {
      event.currentTarget.value = "";
      updateUpload(side, { ...emptyUploadState(), error: "檔案超過 8MB，請重新拍攝或壓縮後再上傳。" });
      return;
    }
    const previewUrl = ["image/jpeg", "image/png"].includes(file.type) ? URL.createObjectURL(file) : "";
    updateUpload(side, {
      fileName: file.name || "已選擇檔案",
      fileSize: file.size,
      previewUrl,
      error: "",
    });
  }

  function clearCreditFile(side: CreditUploadSide) {
    const input = side === "front" ? idFrontInputRef.current : idBackInputRef.current;
    if (input) input.value = "";
    updateUpload(side, emptyUploadState());
    setUploadProgress("");
  }

  function buildFormData(form: HTMLFormElement) {
    const data = new FormData(form);
    data.set("appointmentTime", appointmentTime);
    return data;
  }

  function runValidation(form: HTMLFormElement, requireComplete: boolean) {
    const issues = validateLeadDraft(buildFormData(form), {
      requireComplete,
      hasIdFront: Boolean(idFrontInputRef.current?.files?.[0]),
      hasIdBack: Boolean(idBackInputRef.current?.files?.[0]),
    });
    setValidationIssues(issues);
    return issues;
  }

  const visibleIssues = hasInteracted ? validationIssues : [];

  function issuesFor(field: string) {
    return visibleIssues.filter((issue) => issue.field === field);
  }

  function fieldIssueClass(field: string) {
    const fieldIssues = issuesFor(field);
    if (!fieldIssues.length) return "";
    return fieldIssues.some((issue) => issue.level === "error") ? " has-field-issue has-field-error" : " has-field-issue has-field-warning";
  }

  function renderFieldIssues(field: string) {
    const fieldIssues = issuesFor(field);
    if (!fieldIssues.length) return null;
    return (
      <div className="field-issue-list" aria-live="polite">
        {fieldIssues.map((issue, index) => (
          <span className={`field-issue field-issue-${issue.level}`} key={`${field}-${issue.level}-${index}`}>
            {issue.message}
          </span>
        ))}
      </div>
    );
  }

  function renderPurposeSelect() {
    return (
      <label className={fieldIssueClass("purpose")}>
        資金用途
        <select name="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)}>
          <option value="living">生活消費</option>
          <option value="renovation">房屋修繕</option>
          <option value="business">合法營運週轉</option>
          <option value="unsure">不確定，想先諮詢專員</option>
          <option value="high_risk">投資理財或高風險用途</option>
        </select>
        <span className="field-help">請依真實用途選擇；不確定時選先諮詢，避免為送件包裝用途。</span>
        {renderFieldIssues("purpose")}
      </label>
    );
  }

  function renderCreditUpload(side: CreditUploadSide, title: string, help: string) {
    const state = side === "front" ? idFrontUpload : idBackUpload;
    const inputId = side === "front" ? "id-front-upload" : "id-back-upload";
    const inputRef = side === "front" ? idFrontInputRef : idBackInputRef;
    const hasSelectedFile = Boolean(state.fileName || state.previewUrl);
    const displayName = state.fileName || title;
    const displaySize = state.fileSize;

    return (
      <div className={`upload-field${state.error ? " has-error" : ""}${fieldIssueClass(side === "front" ? "idFront" : "idBack")}`}>
        <label htmlFor={inputId}>{title}</label>
        <input
          id={inputId}
          ref={inputRef}
          name={side === "front" ? "idFront" : "idBack"}
          type="file"
          className="upload-native-input"
          accept="image/jpeg,image/png,image/heic,image/heif"
          onChange={(event) => handleCreditFileChange(side, event)}
        />
        <label className="upload-preview-card" htmlFor={inputId}>
          {state.previewUrl ? (
            <Image src={state.previewUrl} alt={`${title}預覽`} width={136} height={102} unoptimized />
          ) : (
            <div className="upload-preview-placeholder">{hasSelectedFile ? "已選擇 HEIC 檔案" : "尚未選擇檔案"}</div>
          )}
          <div>
            <strong>{displayName}</strong>
            <span>{hasSelectedFile ? `${formatFileSize(displaySize)}，送出前可刪除重選。` : help}</span>
            {state.error ? <span className="upload-error">{state.error}</span> : null}
          </div>
        </label>
        {renderFieldIssues(side === "front" ? "idFront" : "idBack")}
        {hasSelectedFile ? (
          <button type="button" className="ghost-button upload-clear-button" onClick={() => clearCreditFile(side)}>
            刪除重傳
          </button>
        ) : null}
      </div>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasInteracted(true);
    const issues = runValidation(event.currentTarget, true);
    const blockingIssues = issues.filter((issue) => issue.level === "error");
    if (blockingIssues.length) {
      setMessage("請先修正紅框欄位後再送出申請。");
      return;
    }
    setSubmitting(true);
    setMessage("");
    setUploadProgress(loanType === "credit" ? "身分證檔案上傳中，請勿關閉頁面；若失敗可保留目前選擇後再次送出。" : "");
    const data = buildFormData(event.currentTarget);
    const search = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    const sessionId = getTrackingSessionId();
    const source = {
      sourcePage: search.get("source_page") || window.location.pathname,
      sourceChannel: search.get("utm_source") || search.get("source_channel") || sourceFromReferrer(referrer),
      sessionId,
      utmSource: search.get("utm_source") || "",
      utmMedium: search.get("utm_medium") || "",
      utmCampaign: search.get("utm_campaign") || "",
      utmContent: search.get("utm_content") || "",
      utmTerm: search.get("utm_term") || "",
      referrer,
      seoKeyword:
        search.get("utm_term") ||
        search.get("keyword") ||
        search.get("q") ||
        keywordFromReferrer(referrer),
    };
    Object.entries(source).forEach(([key, value]) => data.set(key, value));
    const response = await fetch("/api/leads", { method: "POST", body: data });
    const result = (await response.json().catch(() => ({}))) as { leadId?: string; message?: string };
    setSubmitting(false);
    setUploadProgress("");
    if (!response.ok || !result.leadId) {
      setMessage(result.message || "送出失敗，請稍後再試。");
      return;
    }
    router.push(`/success?lead_id=${encodeURIComponent(result.leadId)}`);
  }

  return (
    <form
      className="lead-form"
      noValidate
      onBlur={(event) => {
        if (event.currentTarget.contains(event.target as Node)) {
          setHasInteracted(true);
          runValidation(event.currentTarget, false);
        }
      }}
      onChange={(event) => {
        setHasInteracted(true);
        runValidation(event.currentTarget, false);
      }}
      onSubmit={submit}
    >
      <input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="bot-field" />
      <input name="formStartedAt" type="hidden" value={formStartedAt} />
      <fieldset className="context-fields form-section">
        <legend>聯絡資料與需求類型</legend>
        <p className="field-note">先留下聯絡方式與貸款類型，再依所選類型填寫對應申請資料。</p>
        <div className="field-grid contact-field-grid">
          <label className={fieldIssueClass("name")}>
            姓名
            <input name="name" required placeholder="請輸入姓名（必填）" />
            {renderFieldIssues("name")}
          </label>
          <label className={`phone-field${fieldIssueClass("phone")}`}>
            手機
            <div className="phone-control">
              <select name="phoneCountryCode" required defaultValue="+886" aria-label="手機國家或地區代碼">
                {phoneCountryCodes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input name="phone" required placeholder="09xx xxx xxx（必填）" inputMode="tel" />
            </div>
            {renderFieldIssues("phone")}
          </label>
          <label className={fieldIssueClass("lineId")}>
            LINE ID
            <input name="lineId" required={loanType !== "unknown"} placeholder="LINE ID（必填）" />
            <span className="field-help">三類貸款申請需留下 LINE ID，方便送出後確認補件方式。</span>
            {renderFieldIssues("lineId")}
          </label>
          <label className={fieldIssueClass("identityType")}>
            身份類型
            <select name="identityType" required defaultValue={defaultIdentityType as IdentityType | ""}>
              <option value="" disabled>
                請選擇（必填）
              </option>
              {Object.entries(identityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {renderFieldIssues("identityType")}
          </label>
          <label>
            貸款類型
            <select name="loanType" required value={loanType} onChange={(event) => setLoanType(event.target.value as LoanType)}>
              {Object.entries(loanLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={`appointment-field${fieldIssueClass("appointmentTime")}`}>
            預約時段
            <input name="appointmentTime" type="hidden" value={appointmentTime} readOnly />
            <div className="date-select-group">
              <select name="appointmentYear" required value={appointmentYear} onChange={(event) => setAppointmentYear(event.target.value)} aria-label="預約年份">
                <option value="" disabled>年（必填）</option>
                {appointmentYears.map((year) => (
                  <option key={year} value={year}>
                    {year} 年
                  </option>
                ))}
              </select>
              <select name="appointmentMonth" required value={appointmentMonth} onChange={(event) => setAppointmentMonth(event.target.value)} aria-label="預約月份">
                <option value="" disabled>月（必填）</option>
                {appointmentMonths.map((month) => (
                  <option key={month} value={month}>
                    {Number(month)} 月
                  </option>
                ))}
              </select>
              <select name="appointmentDay" required value={validAppointmentDay} onChange={(event) => setAppointmentDay(event.target.value)} aria-label="預約日期">
                <option value="" disabled>日（必填）</option>
                {appointmentDays.map((day) => (
                  <option key={day} value={day}>
                    {Number(day)} 日
                  </option>
                ))}
              </select>
            </div>
            <span className="field-help">先選方便聯繫的日期；實際時間由專員透過電話或 LINE 再確認。</span>
            {renderFieldIssues("appointmentTime")}
          </label>
        </div>
      </fieldset>
      {loanType === "credit" ? (
        <fieldset className="context-fields">
          <legend>信貸網路申請資料</legend>
          <p className="field-note">本站信貸申請只收身分證正反面。財力證明請傳 LINE 給專員確認補件方式。</p>
          <div className="field-grid credit-basic-grid">
            <label className={fieldIssueClass("requestedAmount")}>
              申請金額
              <select name="requestedAmount" required defaultValue="7000000">
                {amountOptionsFor("credit").map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="field-help">可先選期望額度；實際核准金額仍依收入、信用、DBR 與銀行審核結果調整。</span>
              {renderFieldIssues("requestedAmount")}
            </label>
            <label className={fieldIssueClass("requestedTermYears")}>
              申請年限
              <select name="requestedTermYears" required defaultValue="10">
                <option value="10">10 年</option>
                <option value="7">7 年</option>
                <option value="5">5 年</option>
                <option value="3">3 年</option>
              </select>
              <span className="field-help">年限會影響月付金與總費用；最終仍以銀行契約條件為準。</span>
              {renderFieldIssues("requestedTermYears")}
            </label>
            {renderPurposeSelect()}
            <label className={fieldIssueClass("caseSource")}>
              案件來源
              <select name="caseSource" required defaultValue="company_preferential">
                <option value="company_preferential">公司優惠貸款</option>
                <option value="specialist_referral">專員協助確認</option>
                <option value="unsure">不確定，先諮詢</option>
              </select>
              <span className="field-help">若不確定是否符合公司優惠或專案資格，先選不確定，由專員確認。</span>
              {renderFieldIssues("caseSource")}
            </label>
            <label className={fieldIssueClass("programType")}>
              適用方案
              <select name="programType" required defaultValue="binding">
                <option value="binding">綁約方案</option>
                <option value="non_binding">不綁約方案</option>
                <option value="unsure">不確定，先諮詢</option>
              </select>
              <span className="field-help">綁約可能涉及提前清償限制或費用；送出前先確認自己可接受的方案。</span>
              {renderFieldIssues("programType")}
            </label>
          </div>
          {purpose === "high_risk" ? (
            <div className="warning-block form-warning" role="alert">
              <h3>資金用途需先確認是否符合銀行規範</h3>
              <p>請依本人真實需求、銀行官方頁面與個案審核結果填寫，不要包裝或填寫不真實用途。不確定時先由專員協助確認是否適合送件。</p>
            </div>
          ) : null}
          <div className="credit-upload-grid">
            {renderCreditUpload("front", "身分證正面", "支援 JPG、PNG、HEIC，請確認四角完整且清楚對焦。")}
            {renderCreditUpload("back", "身分證反面", "正反面缺一不可；若上傳失敗可保留檔案再次送出，或刪除重選。")}
          </div>
          <div className="warning-block form-warning">
            <h3>信貸申請操作提醒</h3>
            <p>填寫過程請使用站內返回修改，不要按瀏覽器上一頁。綁約方案可能涉及限制清償或提前清償費用，實際條件以銀行審核與契約為準。</p>
          </div>
        </fieldset>
      ) : null}
      {loanType === "house" ? (
        <fieldset className="context-fields">
          <legend>房屋貸款申請資料</legend>
          <p className="field-note">權狀、收入證明、稅單與存摺不在本站上傳；送出後由專員透過 LINE 確認補件方式。</p>
          <div className="field-grid">
            <label className={fieldIssueClass("houseLoanType")}>
              房貸類型
              <select name="houseLoanType" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                <option value="first_purchase">購屋首貸</option>
                <option value="home_equity">房屋增貸</option>
                <option value="refinance">轉增貸</option>
                <option value="second_mortgage">二胎房貸</option>
                <option value="renovation">老屋修繕貸款</option>
                <option value="unsure">不確定，先諮詢</option>
              </select>
              {renderFieldIssues("houseLoanType")}
            </label>
            <label className={fieldIssueClass("desiredAmount")}>
              期望貸款金額
              <select key={loanType} name="desiredAmount" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                {amountOptionsFor("house").map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {renderFieldIssues("desiredAmount")}
            </label>
            <label className={fieldIssueClass("propertyCity")}>
              房屋縣市
              <select name="propertyCity" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                {taiwanCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {renderFieldIssues("propertyCity")}
            </label>
            <label className={fieldIssueClass("propertyArea")}>
              房屋區域
              <input name="propertyArea" required placeholder="例如：中和區（必填）" />
              {renderFieldIssues("propertyArea")}
            </label>
            <label className={fieldIssueClass("propertyType")}>
              房屋類型
              <select name="propertyType" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                <option value="apartment">公寓</option>
                <option value="elevator">電梯大樓</option>
                <option value="townhouse">透天 / 別墅</option>
                <option value="factory">廠房 / 商辦</option>
              </select>
              {renderFieldIssues("propertyType")}
            </label>
            <label>
              房屋用途
              <select name="propertyUsage" defaultValue="self_use">
                <option value="self_use">自住</option>
                <option value="rental">出租</option>
                <option value="business_use">營業使用</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label>
              持有狀態
              <select name="ownershipStatus" defaultValue="self_owned">
                <option value="self_owned">本人持有</option>
                <option value="family_owned">家人持有</option>
                <option value="buying">購屋中</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label>
              預估市值
              <input name="estimatedPropertyValue" placeholder="可留空，或填預估金額（可跳過）" inputMode="numeric" />
            </label>
            <label className={fieldIssueClass("existingMortgage")}>
              是否已有貸款
              <select name="existingMortgage" required value={existingMortgage} onChange={(event) => setExistingMortgage(event.target.value)}>
                <option value="" disabled>請選擇（必填）</option>
                <option value="none">無既有房貸</option>
                <option value="has_mortgage">已有房貸</option>
                <option value="second_mortgage">已有二胎或其他設定</option>
              </select>
              {renderFieldIssues("existingMortgage")}
            </label>
            <label className={fieldIssueClass("currentBank")}>
              目前貸款銀行
              <input name="currentBank" required={existingMortgage === "has_mortgage" || existingMortgage === "second_mortgage"} placeholder="已有貸款時必填，否則可跳過" />
              <span className="field-help">選擇已有房貸或二胎時，請填目前銀行或債權單位。</span>
              {renderFieldIssues("currentBank")}
            </label>
            <label className={fieldIssueClass("remainingBalance")}>
              剩餘貸款金額
              <input name="remainingBalance" required={existingMortgage === "has_mortgage" || existingMortgage === "second_mortgage"} placeholder="已有貸款時必填，否則可跳過" inputMode="numeric" />
              <span className="field-help">可填概估金額，專員後續再透過 LINE 確認補件。</span>
              {renderFieldIssues("remainingBalance")}
            </label>
            <label>
              期望貸款年限
              <select name="requestedTermYears" defaultValue="">
                <option value="">尚不確定（可跳過）</option>
                <option value="5">5 年</option>
                <option value="10">10 年</option>
                <option value="15">15 年</option>
                <option value="20">20 年</option>
                <option value="30">30 年</option>
              </select>
            </label>
            <label>
              是否需要寬限期
              <select name="gracePeriodNeeded" defaultValue="no">
                <option value="no">不需要或不確定（可跳過）</option>
                <option value="yes">需要專員評估</option>
              </select>
            </label>
            {renderPurposeSelect()}
          </div>
        </fieldset>
      ) : null}
      {loanType === "business" ? (
        <fieldset className="context-fields">
          <legend>企業貸款申請資料</legend>
          <p className="field-note">報稅資料、存摺、執照與負責人財力證明不在本站上傳；送出後透過 LINE 與專員確認補件方式。</p>
          <div className="field-grid">
            <label className={fieldIssueClass("businessLoanType")}>
              企業貸款類型
              <select name="businessLoanType" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                <option value="business_credit">企業信用貸</option>
                <option value="factory_mortgage">廠房不動產抵押貸</option>
                <option value="working_capital">營運週轉金貸款</option>
                <option value="unsure">不確定，先諮詢</option>
              </select>
              {renderFieldIssues("businessLoanType")}
            </label>
            <label className={fieldIssueClass("businessName")}>
              公司 / 商號名稱
              <input name="businessName" required placeholder="公司、商號或品牌名稱（必填）" />
              {renderFieldIssues("businessName")}
            </label>
            <label>
              統編 / 登記編號
              <input name="registrationNo" placeholder="依實際情況填寫（可跳過）" />
            </label>
            <label className={fieldIssueClass("businessType")}>
              企業型態
              <select name="businessType" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                <option value="company">公司</option>
                <option value="business">商號 / 行號</option>
                <option value="self_employed">自營接案</option>
                <option value="other">其他</option>
              </select>
              {renderFieldIssues("businessType")}
            </label>
            <label>
              產業類別
              <select name="industry" defaultValue="">
                <option value="">尚不確定（可跳過）</option>
                <option value="餐飲">餐飲</option>
                <option value="批發零售">批發零售</option>
                <option value="工程營造">工程營造</option>
                <option value="製造加工">製造加工</option>
                <option value="專業服務">專業服務</option>
                <option value="其他">其他</option>
              </select>
            </label>
            <label className={fieldIssueClass("operatingYears")}>
              營業年數
              <select name="operatingYears" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                <option value="0.5">未滿 1 年</option>
                <option value="1">1 年</option>
                <option value="3">3 年</option>
                <option value="5">5 年</option>
                <option value="10">10 年以上</option>
              </select>
              {renderFieldIssues("operatingYears")}
            </label>
            <label>
              員工人數
              <select name="employeeCount" defaultValue="">
                <option value="">尚不確定（可跳過）</option>
                <option value="1">1 人</option>
                <option value="5">2 到 5 人</option>
                <option value="10">6 到 10 人</option>
                <option value="30">11 到 30 人</option>
                <option value="100">31 人以上</option>
              </select>
            </label>
            <label className={fieldIssueClass("businessLocation")}>
              企業所在地
              <select name="businessLocation" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                {taiwanCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {renderFieldIssues("businessLocation")}
            </label>
            <label>
              近一年營業額區間
              <select name="annualRevenueRange" defaultValue="">
                <option value="">尚不確定（可跳過）</option>
                <option value="under_1m">100 萬以下</option>
                <option value="1m_5m">100 萬到 500 萬</option>
                <option value="5m_20m">500 萬到 2,000 萬</option>
                <option value="over_20m">2,000 萬以上</option>
              </select>
            </label>
            <label className={fieldIssueClass("monthlyRevenueRange")}>
              月平均營收區間
              <select name="monthlyRevenueRange" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                <option value="under_100k">10 萬以下</option>
                <option value="100k_500k">10 萬到 50 萬</option>
                <option value="500k_1m">50 萬到 100 萬</option>
                <option value="over_1m">100 萬以上</option>
              </select>
              {renderFieldIssues("monthlyRevenueRange")}
            </label>
            <label className={fieldIssueClass("desiredAmount")}>
              期望貸款金額
              <select key={loanType} name="desiredAmount" required defaultValue="">
                <option value="" disabled>請選擇（必填）</option>
                {amountOptionsFor("business").map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {renderFieldIssues("desiredAmount")}
            </label>
            <label>
              期望還款年限
              <select name="requestedTermYears" defaultValue="">
                <option value="">尚不確定（可跳過）</option>
                <option value="1">1 年</option>
                <option value="3">3 年</option>
                <option value="5">5 年</option>
                <option value="7">7 年</option>
                <option value="10">10 年</option>
              </select>
            </label>
            {renderPurposeSelect()}
            <label>
              是否有抵押品
              <select name="hasCollateral" defaultValue="no">
                <option value="no">無或不確定（可跳過）</option>
                <option value="yes">有</option>
              </select>
            </label>
            <label>
              是否已有企業貸款
              <select name="hasExistingBusinessLoan" defaultValue="no">
                <option value="no">無或不確定（可跳過）</option>
                <option value="yes">有</option>
              </select>
            </label>
          </div>
        </fieldset>
      ) : null}
      {loanType === "unknown" ? (
        <fieldset className="context-fields">
          <legend>需求摘要</legend>
          <p className="field-note">還不確定貸款類型時，先留下期望金額與資金用途，專員會協助判斷適合入口。</p>
          <div className="field-grid">
            <label>
              期望金額
              <select name="desiredAmount" defaultValue="">
                <option value="">尚不確定，先諮詢（可跳過）</option>
                {amountOptionsFor("unknown").map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {renderPurposeSelect()}
          </div>
        </fieldset>
      ) : null}
      {loanType !== "credit" && purpose === "high_risk" ? (
        <div className="warning-block form-warning" role="alert">
          <h3>資金用途需先確認是否符合銀行規範</h3>
          <p>請依本人真實需求、銀行官方頁面與個案審核結果填寫，不要包裝或填寫不真實用途。不確定時先由專員協助確認是否適合送件。</p>
        </div>
      ) : null}
      <label className={`full-field${fieldIssueClass("note")}`}>
        備註
        <textarea name="note" rows={5} placeholder="可描述目前工作、收入型態、是否已有貸款、想詢問的問題。（可跳過）" />
        {renderFieldIssues("note")}
      </label>
      <div className="consent-box">
        <input id="consent" name="consent" type="checkbox" required />
        <label htmlFor="consent">
          我已閱讀並同意個資告知事項：資料僅用於貸款諮詢、資格初步評估與專員電話/LINE 聯繫；利用地區為台灣，利用對象為本平台與受指派專員，利用方式包含電話、LINE、Email、後台案件管理與來源追蹤；保存期間以案件跟進、法令或爭議處理必要期間為限；系統會記錄同意時間、來源、IP 與瀏覽器資訊以供稽核；可要求查詢、更正、停止利用或刪除，不提供必要資料將無法完成諮詢媒合。平台非銀行或金融機構，不保證核貸、額度、利率或撥款結果。
        </label>
      </div>
      {message ? <p className="form-error">{message}</p> : null}
      {uploadProgress ? <p className="upload-progress" role="status">{uploadProgress}</p> : null}
      <button className="primary-btn form-submit" disabled={submitting}>
        {submitting ? "送出中..." : "送出免費諮詢"}
      </button>
    </form>
  );
}
